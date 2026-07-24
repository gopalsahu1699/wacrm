import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { resumePendingExecution } from '@/lib/automations/engine'
import type { AutomationContext } from '@/lib/automations/engine'

/**
 * Drain due `automation_pending_executions` rows. Meant to be hit
 * on a schedule (Vercel Cron / external pinger).
 *
 * Accepts two auth schemes:
 *   1. Vercel native cron — Vercel automatically sends:
 *        Authorization: Bearer <CRON_SECRET>
 *      where CRON_SECRET is set in your Vercel project env vars.
 *      This works with Vercel Hobby's 1-cron-per-day limit.
 *   2. External pinger (cron-job.org, EasyCron, etc.) — send:
 *        x-cron-secret: <AUTOMATION_CRON_SECRET>
 *      This is the legacy header used by earlier versions.
 *
 * Both secrets are compared with timingSafeEqual to prevent
 * timing-oracle attacks.
 */
export async function GET(request: Request) {
  // --- Auth: accept Vercel's native Authorization: Bearer OR x-cron-secret ---
  const cronSecret = process.env.CRON_SECRET ?? ''
  const legacySecret = process.env.AUTOMATION_CRON_SECRET ?? ''

  if (!cronSecret && !legacySecret) {
    return NextResponse.json({ error: 'cron not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const xCronHeader = request.headers.get('x-cron-secret') ?? ''

  // Check Vercel native: "Authorization: Bearer <CRON_SECRET>"
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const nativeOk =
    cronSecret.length > 0 &&
    bearerToken.length === cronSecret.length &&
    timingSafeEqual(Buffer.from(bearerToken), Buffer.from(cronSecret))

  // Check legacy custom header
  const legacyOk =
    legacySecret.length > 0 &&
    xCronHeader.length === legacySecret.length &&
    timingSafeEqual(Buffer.from(xCronHeader), Buffer.from(legacySecret))

  if (!nativeOk && !legacyOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const { data: due, error } = await admin
    .from('automation_pending_executions')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', new Date().toISOString())
    .order('run_at', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!due || due.length === 0) return NextResponse.json({ processed: 0 })

  const resumes = due.map(async (row) => {
    const { data: claim } = await admin
      .from('automation_pending_executions')
      .update({ status: 'running' })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()
    if (!claim) return 0

    await resumePendingExecution({
      id: row.id as string,
      automation_id: row.automation_id as string,
      account_id: row.account_id as string,
      user_id: row.user_id as string,
      contact_id: (row.contact_id as string | null) ?? null,
      log_id: (row.log_id as string | null) ?? null,
      parent_step_id: (row.parent_step_id as string | null) ?? null,
      branch: (row.branch as 'yes' | 'no' | null) ?? null,
      next_step_position: row.next_step_position as number,
      context: (row.context as AutomationContext) ?? {},
    })
    return 1
  })

  const results = await Promise.allSettled(resumes)
  const processed = results.filter(r => r.status === 'fulfilled').reduce((s, r) => s + r.value, 0)

  return NextResponse.json({ processed })
}
