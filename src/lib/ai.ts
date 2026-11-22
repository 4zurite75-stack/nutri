import Anthropic from '@anthropic-ai/sdk';
import type { Nutrients } from '../db/types';
import type { AiModel } from '../state/settings';

export interface LabelReading {
  name: string;
  brand: string;
  unit: 'g' | 'ml';
  per100: Nutrients;
  servingGrams: number | null;
  /** Avisos de la IA: valores dudosos, etiqueta por ración, etc. */
  notes: string;
  isNutritionLabel: boolean;
}

const nullableNumber = { type: ['number', 'null'] };

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isNutritionLabel', 'name', 'brand', 'unit', 'per100', 'servingGrams', 'notes'],
  properties: {
    isNutritionLabel: { type: 'boolean' },
    name: { type: 'string' },
    brand: { type: 'string' },
    unit: { type: 'string', enum: ['g', 'ml'] },
    per100: {
      type: 'object',
      additionalProperties: false,
      required: ['kcal', 'protein', 'carbs', 'sugar', 'fat', 'satFat', 'fiber', 'salt'],
      properties: {
        kcal: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        sugar: nullableNumber,
        fat: { type: 'number' },
        satFat: nullableNumber,
        fiber: nullableNumber,
        salt: nullableNumber,
      },
    },
    servingGrams: nullableNumber,
    notes: { type: 'string' },
  },
};

const PROMPT = `Lee la tabla de información nutricional de esta foto de un envase (etiquetado europeo/español).

Devuelve los valores POR 100 g o 100 ml:
- kcal: la energía en kcal (no kJ). Si solo aparece kJ, divide entre 4,184.
- protein, carbs (hidratos de carbono), sugar (de los cuales azúcares), fat (grasas), satFat (de las cuales saturadas), fiber (fibra alimentaria), salt (sal), en gramos.
- Si la tabla solo da valores por ración, conviértelos a 100 g usando el tamaño de la ración y dilo en notes.
- Usa null en los nutrientes opcionales que no aparezcan. No inventes valores.
- name: nombre del producto si se ve en la foto (en español, breve); si no, cadena vacía. brand: la marca o cadena vacía.
- unit: "ml" si los valores son por 100 ml (bebidas), si no "g".
- servingGrams: tamaño de una ración o unidad si la etiqueta lo indica; si no, null.
- notes: en español y breve, avisa de cualquier valor ilegible o dudoso. Cadena vacía si todo está claro.
- isNutritionLabel: false si la foto no muestra una tabla nutricional legible.`;

/** Comprime la foto para el envío: 1568 px de lado mayor es el máximo útil para el modelo. */
async function toJpegBase64(file: Blob, maxSide = 1568): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo leer la foto'));
      i.src = url;
    });
    const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85).split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

function client(apiKey: string) {
  // La clave es tuya y solo se guarda en este dispositivo; la app no tiene servidor propio.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 60_000 });
}

export async function readLabel(photo: Blob, apiKey: string, model: AiModel): Promise<LabelReading> {
  const data = await toJpegBase64(photo);
  const request = {
    model,
    max_tokens: 4000,
    // Tarea sencilla: esfuerzo bajo para que sea rápida y barata.
    output_config: { effort: 'low' as const, format: { type: 'json_schema' as const, schema: SCHEMA } },
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data } },
          { type: 'text' as const, text: PROMPT },
        ],
      },
    ],
  };
  const c = client(apiKey);
  // Con Opus se activa el modelo de respaldo del servidor por si el filtro de seguridad rechaza la petición.
  const res =
    model === 'claude-opus-5-5'
      ? await c.beta.messages.create({ ...request, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      : await c.messages.create(request);
  if (res.stop_reason === 'refusal') throw new Error('La IA no ha podido procesar esta foto. Prueba con otra.');
  if (res.stop_reason === 'max_tokens') throw new Error('La respuesta se cortó. Vuelve a intentarlo.');
  const text = res.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Respuesta vacía de la IA.');
  return JSON.parse(text.text) as LabelReading;
}

/** Comprueba que la clave funciona con una petición mínima. */
export async function testKey(apiKey: string): Promise<void> {
  await client(apiKey).models.retrieve('claude-opus-5-5');
}

export function aiErrorMessage(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'La clave de API no es válida. Revísala en Ajustes.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'Tu clave no tiene permiso para usar este modelo.';
  if (e instanceof Anthropic.RateLimitError) return 'Demasiadas peticiones o sin saldo. Espera un poco o revisa tu saldo.';
  if (e instanceof Anthropic.BadRequestError) {
    const msg = (e as Error).message ?? '';
    if (/credit|balance|billing/i.test(msg)) return 'Tu cuenta de Anthropic no tiene saldo. Recárgala en console.anthropic.com.';
    return 'La petición no es válida: ' + msg;
  }
  if (e instanceof Anthropic.APIConnectionError) return 'Sin conexión. Inténtalo cuando tengas cobertura.';
  if (e instanceof Anthropic.APIError) return 'Error del servicio de IA. Inténtalo de nuevo.';
  return (e as Error)?.message || 'Error desconocido';
}
