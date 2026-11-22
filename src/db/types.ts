export type Sex = 'hombre' | 'mujer';
export type Activity = 'sedentario' | 'ligero' | 'moderado' | 'alto' | 'muy_alto';
export type Goal = 'perder' | 'mantener' | 'ganar';

export interface Profile {
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  /** Peso con el que se creó el perfil; el actual sale de los registros de peso. */
  startWeightKg: number;
  bodyFatPct?: number;
  activity: Activity;
  trainingDays: number;
  goal: Goal;
  /** Ritmo objetivo en % del peso corporal por semana (negativo = perder). */
  ratePct: number;
  createdAt: number;
}

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
  /** Mantenimiento usado para calcularlos. */
  tdee: number;
  source: 'calculado' | 'adaptativo' | 'manual';
  setAt: number;
}

/** Nutrientes por 100 g (o 100 ml). */
export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  sugar?: number;
  fat: number;
  satFat?: number;
  fiber?: number;
  salt?: number;
}

export interface Portion {
  id: string;
  name: string; // "1 huevo", "1 cacito"
  grams: number;
}

export interface RecipeItem {
  foodId: string;
  grams: number;
}

export type FoodSource = 'generico' | 'off' | 'ia' | 'manual' | 'receta';

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  unit: 'g' | 'ml';
  per100: Nutrients;
  portions: Portion[];
  source: FoodSource;
  /** Para recetas: ingredientes y peso final cocinado. */
  recipe?: { items: RecipeItem[]; totalWeight: number; servings: number };
  favorite?: boolean;
  lastUsedAt?: number;
  useCount?: number;
  /** Última cantidad usada (g), para proponerla de nuevo. */
  lastGrams?: number;
  thumb?: Blob;
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: string; // id de la comida
  foodId: string;
  grams: number;
  /** Si se añadió por porciones: cuál y cuántas. */
  portionName?: string;
  portionQty?: number;
  /** Copia de nombre y nutrientes al registrar: editar el alimento no cambia el pasado. */
  name: string;
  brand?: string;
  unit?: 'g' | 'ml';
  per100: Nutrients;
  createdAt: number;
}

export interface Meal {
  id: string;
  name: string;
}

export interface Supplement {
  id: string;
  name: string;
  dose: number;
  unit: string; // g, mg, cápsulas, UI…
  time?: string; // texto libre: "con el desayuno"
  active: boolean;
  order: number;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  waterMl: number;
  /** id del suplemento → marca de tiempo en que se tomó */
  supplements: Record<string, number>;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD (uno por día)
  kg: number;
  createdAt: number;
}

export interface TemplateItem {
  foodId: string;
  grams: number;
  meal: string;
  portionName?: string;
  portionQty?: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  /** null = día completo; si no, se añade a la comida que elijas. */
  scope: 'dia' | 'comida';
  items: TemplateItem[];
  createdAt: number;
}

export interface CheckIn {
  id: string;
  date: string;
  estTdee: number;
  ratePct: number; // ritmo real medido
  fromKcal: number;
  toKcal: number;
  applied: boolean;
  createdAt: number;
}

export interface SettingRow {
  key: string;
  value: unknown;
}
