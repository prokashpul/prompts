export enum AppMode {
  ImageToPrompt = 'image-to-prompt',
  TextToPrompt = 'text-to-prompt',
}

export enum AIProvider {
  Gemini = 'gemini',
  Groq = 'groq',
  Mistral = 'mistral'
}

export interface PromptResult {
  text: string;
  timestamp: number;
}

export interface GenerationConfig {
  length: 'short' | 'medium' | 'long';
  complexity: 'standard' | 'artistic' | 'photorealistic';
}

export interface ProviderKeys {
  groq?: string;
  mistral?: string;
}