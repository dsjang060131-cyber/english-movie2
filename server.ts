import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface TtsLineRequest {
  id: string;
  speaker: string;
  voiceRole: 'yellow' | 'green' | 'purple' | 'red' | 'female_lead' | 'male_lead';
  text: string;
}

interface TtsClipPayload {
  id: string;
  speaker: string;
  mimeType: string;
  audioBase64: string;
}

const ttsCache = new Map<string, TtsClipPayload>();

function createAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getVoiceProfile(role: TtsLineRequest['voiceRole']): {
  voiceName: 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';
  style: string;
} {
  switch (role) {
    case 'yellow':
      return {
        voiceName: 'Zephyr',
        style:
          'Natural, crisp conversational pace around 140 words per minute. Cheerful, sparkly, bright young female voice with clear enunciation.',
      };
    case 'green':
      return {
        voiceName: 'Kore',
        style:
          'Natural, crisp conversational pace around 140 words per minute. Chic, sassy, mildly unimpressed young female voice with sharp articulation.',
      };
    case 'purple':
      return {
        voiceName: 'Kore',
        style:
          'Natural, crisp conversational pace around 135 words per minute. Calm, slightly lethargic sighing young female voice, very clear and easy to follow.',
      };
    case 'red':
      return {
        voiceName: 'Fenrir',
        style:
          'Natural, punchy conversational pace around 142 words per minute. Energetic, fiery hot-headed short male voice speaking firmly and clearly.',
      };
    case 'male_lead':
      return {
        voiceName: 'Charon',
        style:
          'Natural, warm conversational pace around 138 words per minute. Gentle, earnest, handsome young male voice with crisp English pronunciation.',
      };
    case 'female_lead':
    default:
      return {
        voiceName: 'Zephyr',
        style:
          'Natural, warm conversational pace around 138 words per minute. Charming, clear young female voice with friendly Korean-learner-friendly clarity.',
      };
  }
}

async function synthesizeLine(ai: GoogleGenAI, line: TtsLineRequest): Promise<TtsClipPayload> {
  const cleanText = line.text.replace(/\*\*/g, '').trim();
  const profile = getVoiceProfile(line.voiceRole);
  const cacheKey = crypto
    .createHash('sha1')
    .update(`${line.voiceRole}:${cleanText}`)
    .digest('hex');

  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return { ...cached, id: line.id, speaker: line.speaker };
  }

  const spokenInput =
    line.voiceRole === 'purple' ? `<breath> ${cleanText}` : cleanText;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: spokenInput,
            speechMetadata: {
              speaker: line.speaker,
              style: profile.style,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: profile.voiceName },
        },
      },
    },
  });

  const inline = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inline?.data) {
    throw new Error(`No audio returned from TTS for line ${line.id}`);
  }

  const payload: TtsClipPayload = {
    id: line.id,
    speaker: line.speaker,
    mimeType: inline.mimeType || 'audio/wav',
    audioBase64: inline.data,
  };
  ttsCache.set(cacheKey, payload);
  return payload;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post('/api/tts/cinephrase', async (req: Request, res: Response) => {
    try {
      const lines = (req.body?.lines ?? []) as TtsLineRequest[];
      if (!Array.isArray(lines) || lines.length === 0) {
        res.status(400).json({ error: 'lines array is required' });
        return;
      }

      const ai = createAiClient();
      // Batch in groups of 5 for fast parallel synthesis
      const results: TtsClipPayload[] = [];
      for (let i = 0; i < lines.length; i += 5) {
        const batch = lines.slice(i, i + 5);
        const batchOut = await Promise.all(batch.map((l) => synthesizeLine(ai, l)));
        results.push(...batchOut);
      }

      res.json({
        source: 'gemini-3.8-flash-tts',
        clips: results,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown TTS synthesis error';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/storyboard/regenerate-beat', async (req: Request, res: Response) => {
    try {
      const {
        beatNumber,
        beatLabel,
        timeRange,
        place,
        situation,
        styleName,
        expressions,
        otherBeatsSummary,
      } = req.body as {
        beatNumber: number;
        beatLabel: string;
        timeRange: string;
        place: string;
        situation: string;
        styleName: string;
        expressions: Array<{ expression: string; meaning: string; movie: string }>;
        otherBeatsSummary: string;
      };

      const ai = createAiClient();
      const exprList = expressions
        .map((e, i) => `${i + 1}. "${e.expression}" (${e.meaning} — from ${e.movie})`)
        .join('\n');

      const prompt = `You are writing one beat of a 30-second stylized animated short film called CinePhrase for Korean university English learners.

Regenerate ONLY Beat ${beatNumber} (${beatLabel}, ${timeRange}).
Setting: ${place}
Situation: ${situation}
Visual Style: ${styleName}
Characters available:
- Female Protagonist (voiceRole: "female_lead")
- Male Lead (voiceRole: "male_lead", short clean-cut men's haircut)
- Yellow figure (voiceRole: "yellow")
- Green figure (voiceRole: "green")
- Purple figure (voiceRole: "purple")
- Red figure (voiceRole: "red")

Other beats context:
${otherBeatsSummary}

Target expressions to include naturally where appropriate (keep exact wording):
${exprList}

Rules:
- Keep dialogue for this single beat around 12-18 words total so the full 4-beat film stays around 60-70 words and speaks clearly at 135-145 WPM.
- Provide 2 to 3 crisp, natural spoken lines with zero filler.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sceneDescription: { type: Type.STRING },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    voiceRole: {
                      type: Type.STRING,
                      description:
                        'One of: yellow, green, purple, red, female_lead, male_lead',
                    },
                    text: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to regenerate beat';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('/{*splat}', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CinePhrase server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
