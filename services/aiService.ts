import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider } from "../types";

// Always initialize fresh to catch API key changes from the UI
const getGeminiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = {
  gemini_text: 'gemini-3-pro-preview',
  gemini_image: 'gemini-3-flash-preview',
  groq_text: 'llama-4-scout-preview', // User-specified latest Llama 4 Scout
  groq_vision: 'llava-v1.5-7b-4096-preview', // Switched to stable Llava as Llama 3.2 Vision models are decommissioned
  mistral_text: 'mistral-small-latest',
  mistral_vision: 'pixtral-12b-2409' // Pixtral Vision
};

const PROMPT_INSTRUCTION = `
  You are a Senior AI Prompt Engineer. Your specialty is creating high-fidelity prompts for Midjourney, Stable Diffusion, and Flux.
  
  TASK: Generate a single, powerful, and evocative text-to-image prompt.
  
  REQUIRED ELEMENTS:
  - Subject: Clear and detailed main focus.
  - Style: Specific art medium or camera (e.g., analog film, hyper-realistic, synthwave, impasto oil).
  - Lighting: Dramatic lighting (e.g., volumetric fog, sunset glow, chiaroscuro).
  - Composition: 8k resolution, ultra-detailed, cinematic masterpiece.
  
  STRICT LIMITS:
  - Length: Exactly 50 to 300 characters.
  - No introductory text or quotes.
  - Response must be valid JSON as requested.
`;

const IMAGE_ANALYSIS_INSTRUCTION = `
  Analyze this image and extract its core aesthetic essence. 
  Construct a descriptive prompt that would recreate this specific style and content in an AI image generator.
  Strict Limit: 50 to 300 characters. 
  No meta-commentary, just the prompt.
`;

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({ inlineData: { data: base64Data, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Intelligent character clamping to ensure 50-300 range
 */
const clampPrompt = (prompt: string): string => {
  let p = prompt.trim();
  // Remove wrapping quotes if the model returns them
  if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
  if (p.startsWith('`') && p.endsWith('`')) p = p.slice(1, -1);
  
  // If too short, enrich with high-quality suffixes
  if (p.length < 50) {
    const suffixes = [
      ", cinematic lighting, 8k resolution, highly detailed artstation trend",
      ", ultra-realistic, masterwork, sharp focus, vibrant colors",
      ", breathtaking composition, ethereal atmosphere, professional photography"
    ];
    p += suffixes[Math.floor(Math.random() * suffixes.length)];
  }
  
  // Final padding if still too short (unlikely with suffixes)
  if (p.length < 50) p = p.padEnd(51, ' ');
  
  // If too long, trim cleanly
  if (p.length > 300) {
    p = p.substring(0, 297) + "...";
  }
  
  return p.trim();
};

export const generateImagePrompt = async (
  provider: AIProvider,
  input: { text?: string; file?: File },
  keys: { groq?: string; mistral?: string },
  count: number = 1
): Promise<string[]> => {
  
  // 1. GEMINI PROVIDER
  if (provider === AIProvider.Gemini) {
    const ai = getGeminiClient();
    if (input.file) {
      const imagePart = await fileToGenerativePart(input.file);
      const response = await ai.models.generateContent({
        model: MODELS.gemini_image,
        contents: { parts: [imagePart, { text: IMAGE_ANALYSIS_INSTRUCTION }] },
      });
      return [clampPrompt(response.text || "")];
    } else {
      const response = await ai.models.generateContent({
        model: MODELS.gemini_text,
        contents: `Concept: ${input.text}\n${PROMPT_INSTRUCTION}\nGenerate exactly ${count} unique prompts as a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      const results = JSON.parse(response.text || "[]");
      return Array.isArray(results) ? results.map(clampPrompt) : [clampPrompt(response.text || "")];
    }
  }

  // 2. EXTERNAL PROVIDERS (GROQ / MISTRAL)
  const isGroq = provider === AIProvider.Groq;
  const apiKey = isGroq ? keys.groq : keys.mistral;
  const endpoint = isGroq 
    ? "https://api.groq.com/openai/v1/chat/completions" 
    : "https://api.mistral.ai/v1/chat/completions";
  
  const model = input.file 
    ? (isGroq ? MODELS.groq_vision : MODELS.mistral_vision)
    : (isGroq ? MODELS.groq_text : MODELS.mistral_text);

  if (!apiKey) throw new Error(`${provider.toUpperCase()} API Key is missing. Configure in settings.`);

  let messages: any[] = [];
  let responseFormat: any = undefined;

  if (input.file) {
    const { inlineData } = await fileToGenerativePart(input.file);
    messages = [
      {
        role: "user",
        content: [
          { type: "text", text: IMAGE_ANALYSIS_INSTRUCTION },
          { 
            type: "image_url", 
            image_url: { url: `data:${inlineData.mimeType};base64,${inlineData.data}` } 
          }
        ]
      }
    ];
  } else {
    messages = [
      { 
        role: "system", 
        content: `${PROMPT_INSTRUCTION}\nStrict Requirement: Respond with a JSON object. Mention the word 'json'.\nFormat: {"prompts": ["string1", "string2", ...]}\nNumber of strings: ${count}` 
      },
      { 
        role: "user", 
        content: `Generate image prompts based on this idea: ${input.text}` 
      }
    ];
    responseFormat = { type: "json_object" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      ...(responseFormat && { response_format: responseFormat }),
      temperature: 0.8,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || `API error from ${provider}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  try {
    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed.prompts) ? parsed.prompts : (Array.isArray(parsed) ? parsed : [content]);
    return results.map(clampPrompt);
  } catch (e) {
    // Fallback parsing for non-JSON or malformed JSON responses (common in vision tasks)
    const lines = content.split('\n').filter((s: string) => s.trim().length > 10).slice(0, count);
    return lines.length > 0 ? lines.map(clampPrompt) : [clampPrompt(content)];
  }
};