import type { Nutrients } from '../db/types';

export interface OffProduct {
  name: string;
  brand?: string;
  barcode: string;
  unit: 'g' | 'ml';
  per100: Nutrients;
  servingGrams?: number;
  imageUrl?: string;
  complete: boolean;
}

const FIELDS = [
  'product_name',
  'product_name_es',
  'generic_name_es',
  'brands',
  'nutriments',
  'serving_quantity',
  'quantity',
  'image_front_small_url',
].join(',');

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
};

/** Busca un producto por código de barras en Open Food Facts (gratuito, sin clave). */
export async function lookupBarcode(code: string): Promise<OffProduct | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}&lc=es`, {
      signal: ctrl.signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) != null ? Math.round((num(n['energy_100g'])! / 4.184) * 10) / 10 : undefined);
    const per100: Nutrients = {
      kcal: kcal ?? 0,
      protein: num(n.proteins_100g) ?? 0,
      carbs: num(n.carbohydrates_100g) ?? 0,
      sugar: num(n.sugars_100g),
      fat: num(n.fat_100g) ?? 0,
      satFat: num(n['saturated-fat_100g']),
      fiber: num(n.fiber_100g),
      salt: num(n.salt_100g),
    };
    const quantity = String(p.quantity ?? '').toLowerCase();
    return {
      name: (p.product_name_es || p.product_name || p.generic_name_es || '').trim(),
      brand: String(p.brands ?? '').split(',')[0]?.trim() || undefined,
      barcode: code,
      unit: /\bml\b|\bl\b|cl\b/.test(quantity) && !/\bg\b|kg/.test(quantity) ? 'ml' : 'g',
      per100,
      servingGrams: num(p.serving_quantity),
      imageUrl: p.image_front_small_url,
      complete: kcal != null && n.proteins_100g != null && n.carbohydrates_100g != null && n.fat_100g != null,
    };
  } finally {
    clearTimeout(timer);
  }
}
