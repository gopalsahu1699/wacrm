-- ============================================================
-- 038_ai_providers.sql — Expand AI provider CHECK constraints
--
-- Adds Google Gemini, Groq, DeepSeek, Mistral, and OpenRouter to
-- the provider CHECK constraints in ai_configs and ai_usage_log.
--
-- Standard PostgreSQL: drop + recreate the constraint.
-- ============================================================

-- Update ai_configs.provider check constraint
ALTER TABLE ai_configs
  DROP CONSTRAINT IF EXISTS ai_configs_provider_check;

ALTER TABLE ai_configs
  ADD CONSTRAINT ai_configs_provider_check
  CHECK (provider IN (
    'openai',
    'anthropic',
    'google',
    'groq',
    'deepseek',
    'mistral',
    'openrouter'
  ));

-- Update ai_usage_log.provider check constraint
ALTER TABLE ai_usage_log
  DROP CONSTRAINT IF EXISTS ai_usage_log_provider_check;

ALTER TABLE ai_usage_log
  ADD CONSTRAINT ai_usage_log_provider_check
  CHECK (provider IN (
    'openai',
    'anthropic',
    'google',
    'groq',
    'deepseek',
    'mistral',
    'openrouter'
  ));
