import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Part } from '@google/generative-ai';
import { createHash } from 'crypto';
import type { AIClassification, IAIProvider } from '@arkelythex/application';
import { CacheMetrics } from '../cache/metrics';
import { CACHE_TTL, redis } from '../cache/redis.client';

/**
 * GeminiAdapter class.
 *
 * @example
 * ```ts
 * const value = new GeminiAdapter();
 * console.log(value);
 * ```
 */
export class GeminiAdapter implements IAIProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('⚠️ [GeminiAdapter] No API Key provided during initialization.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private hashPrompt(prompt: string): string {
    const normalized = prompt.toLowerCase().trim().replace(/\s+/g, ' ');
    return createHash('sha256').update(normalized).digest('hex');
  }

  async analyze(message: string, images: string[] = [], systemContext?: string): Promise<string> {
    if (images.length > 0) {
      return this.callGeminiDirect(message, images, systemContext);
    }

    const cacheKey = `gemini:${this.hashPrompt(message + (systemContext || ''))}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      CacheMetrics.recordHit();
      return cached;
    }

    CacheMetrics.recordMiss();
    const result = await this.callGeminiDirect(message, images, systemContext);
    await redis.setex(cacheKey, CACHE_TTL.AI_CLASSIFICATION, result);

    return result;
  }

  async classify(description: string, context?: string): Promise<AIClassification> {
    const response = await this.analyze(description, [], context);
    return JSON.parse(response) as AIClassification;
  }

  private async callGeminiDirect(message: string, images: string[], systemContext?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemContext,
    });

    try {
      const parts: Part[] = [];

      if (message) {
        parts.push({ text: message } as Part);
      }

      for (const imgData of images) {
        const matches = imgData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

        if (matches && matches.length === 3) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          } as Part);
        } else {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imgData,
            },
          } as Part);
        }
      }

      const result = await model.generateContent(parts);
      const response = result.response.text();

      if (!response) {
        throw new Error('Empty response from Gemini API');
      }

      return response;
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Falla en la comunicación con Google Gemini';
      console.error('❌ [Gemini Error]:', e);
      return `Error del motor de IA: ${message}. Verifica tu API Key y conexión.`;
    }
  }
}
