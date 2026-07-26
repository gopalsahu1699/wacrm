import { type ProviderResult } from '../types'
import { generateOpenAiCompatible } from './openai-compatible'
import type { ProviderArgs } from './shared'

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'

export async function generateMistral(args: ProviderArgs): Promise<ProviderResult> {
  return generateOpenAiCompatible(args, MISTRAL_URL, 'Mistral')
}
