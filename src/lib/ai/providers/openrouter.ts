import { type ProviderResult } from '../types'
import { generateOpenAiCompatible } from './openai-compatible'
import type { ProviderArgs } from './shared'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function generateOpenRouter(args: ProviderArgs): Promise<ProviderResult> {
  return generateOpenAiCompatible(args, OPENROUTER_URL, 'OpenRouter')
}
