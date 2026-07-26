import { type ProviderResult } from '../types'
import { generateOpenAiCompatible } from './openai-compatible'
import type { ProviderArgs } from './shared'

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

export async function generateDeepSeek(args: ProviderArgs): Promise<ProviderResult> {
  return generateOpenAiCompatible(args, DEEPSEEK_URL, 'DeepSeek')
}
