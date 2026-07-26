import { AiError, type ProviderResult } from '../types'
import { MAX_OUTPUT_TOKENS } from '../defaults'
import {
  mergeConsecutive,
  toNetworkError,
  type ProviderArgs,
} from './shared'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiContent {
  role: string
  parts: { text: string }[]
}

interface GeminiResponse {
  candidates?: {
    content?: GeminiContent
    finishReason?: string
  }[]
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
}

/**
 * Map our ChatMessage roles to Gemini roles. Gemini expects
 * "user" / "model" (not "assistant").
 */
function toGeminiRole(role: 'user' | 'assistant'): string {
  return role === 'assistant' ? 'model' : 'user'
}

export async function generateGoogle(args: ProviderArgs): Promise<ProviderResult> {
  const { apiKey, model, systemPrompt, messages, timeoutMs } = args

  const contents: GeminiContent[] = mergeConsecutive(messages).map((m) => ({
    role: toGeminiRole(m.role),
    parts: [{ text: m.content }],
  }))

  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        system_instruction: systemPrompt
          ? { parts: [{ text: systemPrompt }] }
          : undefined,
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw toNetworkError(err)
  }

  if (!res.ok) {
    let detail = ''
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      detail = body?.error?.message ?? ''
    } catch { /* ignore */ }
    const status = res.status
    const code =
      status === 401 || status === 403
        ? 'invalid_key'
        : status === 429
          ? 'rate_limited'
          : 'provider_error'
    const base =
      code === 'invalid_key'
        ? 'Google AI rejected the API key'
        : code === 'rate_limited'
          ? 'Google AI rate limit reached'
          : `Google AI API error (${status})`
    throw new AiError(detail ? `${base}: ${detail}` : base, {
      code,
      status: code === 'invalid_key' ? 401 : 502,
    })
  }

  const data = (await res.json().catch(() => null)) as GeminiResponse | null
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .join('')
    .trim()

  if (!text) {
    throw new AiError('Google AI returned an empty response.', {
      code: 'empty_response',
    })
  }

  const usage = {
    prompt_tokens: data?.usageMetadata?.promptTokenCount ?? 0,
    completion_tokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
    total: data?.usageMetadata?.totalTokenCount ?? 0,
  }
  const usageResult = {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total,
  }
  const hasUsage =
    usage.prompt_tokens > 0 ||
    usage.completion_tokens > 0 ||
    usage.total > 0

  return {
    text,
    usage: hasUsage ? usageResult : null,
  }
}
