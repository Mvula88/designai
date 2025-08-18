import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODELS = {
  VISION: process.env.CLAUDE_MODEL_VISION || 'claude-3-opus-20240229',
  FAST: process.env.CLAUDE_MODEL_FAST || 'claude-3-sonnet-20240229',
}

export default anthropic
