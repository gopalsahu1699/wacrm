import { type ProviderResult } from '../types'
import { generateOpenAiCompatible } from './openai-compatible'
import type { ProviderArgs } from './shared'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function generateGroq(args: ProviderArgs): Promise<ProviderResult> {
  return generateOpenAiCompatible(args, GROQ_URL, 'Groq')
}
