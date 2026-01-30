// /src/lib/ai/claude.ts
// Anthropic Claude API client wrapper for Omnixia

import Anthropic from '@anthropic-ai/sdk';

// Initialize client - will fail at runtime if key not set, not at build time
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Default model configuration
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
export const DEFAULT_MAX_TOKENS = 1024;

// Message type for conversation history
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Send a message to Claude and get a response
 */
export async function sendMessage({
  systemPrompt,
  messages,
  maxTokens = DEFAULT_MAX_TOKENS,
}: {
  systemPrompt: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
}) {
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return {
      message: textContent.text,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

/**
 * Estimate cost of a conversation
 * Based on Claude Sonnet 4 pricing: $3/MTok input, $15/MTok output
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 3;
  const outputCost = (outputTokens / 1_000_000) * 15;
  return inputCost + outputCost;
}
