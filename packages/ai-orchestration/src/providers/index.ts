import type { LanguageModel } from 'ai';

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google';

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Which provider to use */
  provider: AIProvider;

  /** API key for the provider (reads from env if not provided) */
  apiKey?: string;

  /** Model identifier override (provider-specific) */
  modelId?: string;

  /** API base URL override */
  baseUrl?: string;
}

/**
 * Resolved provider configuration with all fields populated
 */
export interface ResolvedProviderConfig {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  baseUrl?: string;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
};

const ENV_KEYS: Record<AIProvider, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
};

/**
 * Resolve provider configuration, reading API keys from environment variables
 * when not explicitly provided.
 */
export function resolveProviderConfig(config: ProviderConfig): ResolvedProviderConfig {
  const apiKey = config.apiKey || process.env[ENV_KEYS[config.provider]];
  if (!apiKey) {
    throw new Error(
      `Missing API key for ${config.provider}. Set ${ENV_KEYS[config.provider]} or provide apiKey in config.`
    );
  }

  return {
    provider: config.provider,
    apiKey,
    modelId: config.modelId || DEFAULT_MODELS[config.provider],
    baseUrl: config.baseUrl,
  };
}

/**
 * Create a Vercel AI SDK LanguageModel from provider configuration.
 *
 * Dynamically imports the provider adapter to avoid bundling all providers.
 */
export async function createLanguageModel(config: ProviderConfig): Promise<LanguageModel> {
  const resolved = resolveProviderConfig(config);

  switch (resolved.provider) {
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openai = createOpenAI({
        apiKey: resolved.apiKey,
        ...(resolved.baseUrl ? { baseURL: resolved.baseUrl } : {}),
      });
      return openai(resolved.modelId);
    }

    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({
        apiKey: resolved.apiKey,
        ...(resolved.baseUrl ? { baseURL: resolved.baseUrl } : {}),
      });
      return anthropic(resolved.modelId);
    }

    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({
        apiKey: resolved.apiKey,
        ...(resolved.baseUrl ? { baseURL: resolved.baseUrl } : {}),
      });
      return google(resolved.modelId);
    }

    default:
      throw new Error(`Unsupported provider: ${resolved.provider}`);
  }
}

/**
 * Detect which provider is available from environment variables.
 * Returns the first available provider, or null if none are configured.
 */
export function detectAvailableProvider(): AIProvider | null {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return 'google';
  return null;
}

/**
 * Create a language model using the first available provider from environment.
 * Throws if no provider API key is configured.
 */
export async function createDefaultLanguageModel(): Promise<LanguageModel> {
  const provider = detectAvailableProvider();
  if (!provider) {
    throw new Error(
      'No AI provider configured. Set one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY'
    );
  }
  return createLanguageModel({ provider });
}

/**
 * List all configured providers based on available environment variables.
 */
export function listConfiguredProviders(): Array<{ provider: AIProvider; modelId: string }> {
  const providers: Array<{ provider: AIProvider; modelId: string }> = [];

  if (process.env.OPENAI_API_KEY) {
    providers.push({ provider: 'openai', modelId: DEFAULT_MODELS.openai });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({ provider: 'anthropic', modelId: DEFAULT_MODELS.anthropic });
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    providers.push({ provider: 'google', modelId: DEFAULT_MODELS.google });
  }

  return providers;
}
