import type { Food, Portion } from './types';

// [id, nombre, unidad, kcal, proteína, hidratos, azúcares, grasa, saturadas, fibra, sal, porciones "nombre:gramos|…"]
// Valores aproximados por 100 g/ml (tablas de composición). Hidratos = disponibles (criterio de etiquetado UE, sin fibra).
type Row = [string, string, 'g' | 'ml', number, number, number, number, number, number, number, number, string?];

const ROWS: Row[] = [
  // Carnes y huevos
  ['pollo-pechuga', 'Pechuga de pollo (cruda)', 'g', 110, 23, 0, 0, 1.5, 0.4, 0, 0.15, '1 filete:150'],
  ['pollo-pechuga-plancha', 'Pechuga de pollo a la plancha', 'g', 165, 31, 0, 0, 3.6, 1, 0, 0.18, '1 filete:120'],
  ['pollo-muslo', 'Muslo de pollo sin piel (crudo)', 'g', 120, 19.5, 0, 0, 4.5, 1.2, 0, 0.2],
  ['pavo-pechuga', 'Pechuga de pavo (cruda)', 'g', 105, 24, 0, 0, 1, 0.3, 0, 0.15, '1 filete:150'],
  ['pavo-fiambre', 'Pechuga de pavo en lonchas', 'g', 100, 18, 2, 1.5, 2, 0.7, 0, 1.8, '1 loncha:15'],
  ['ternera-filete', 'Ternera magra, filete (crudo)', 'g', 120, 21.5, 0, 0, 3.5, 1.4, 0, 0.15, '1 filete:150'],
  ['ternera-picada', 'Carne picada de ternera 5 % grasa', 'g', 135, 21, 0, 0, 5, 2.2, 0, 0.2],
  ['picada-mixta', 'Carne picada mixta cerdo y ternera', 'g', 230, 17, 0, 0, 18, 7, 0, 0.2],
  ['cerdo-lomo', 'Lomo de cerdo (crudo)', 'g', 140, 21, 0, 0, 6, 2.1, 0, 0.15, '1 filete:120'],
  ['jamon-serrano', 'Jamón serrano', 'g', 240, 30, 0, 0, 13, 4.5, 0, 5, '1 loncha:15'],
  ['jamon-cocido', 'Jamón cocido', 'g', 110, 18, 1.5, 1, 3.5, 1.2, 0, 2, '1 loncha:15'],
  ['chorizo', 'Chorizo', 'g', 455, 24, 2, 1, 39, 15, 0, 4, '1 rodaja:5'],
  ['huevo', 'Huevo', 'g', 143, 12.6, 0.7, 0.4, 9.5, 3.1, 0, 0.36, '1 huevo M:53|1 huevo L:60'],
  ['huevo-clara', 'Clara de huevo', 'g', 52, 10.9, 0.7, 0.7, 0.2, 0, 0, 0.42, '1 clara:33'],
  // Pescado
  ['salmon', 'Salmón (crudo)', 'g', 200, 20, 0, 0, 13, 3.1, 0, 0.15, '1 lomo:125'],
  ['merluza', 'Merluza (cruda)', 'g', 75, 17, 0, 0, 0.8, 0.2, 0, 0.25, '1 filete:150'],
  ['bacalao', 'Bacalao fresco (crudo)', 'g', 80, 18, 0, 0, 0.7, 0.1, 0, 0.3],
  ['atun-natural', 'Atún al natural (escurrido)', 'g', 110, 25, 0, 0, 1, 0.3, 0, 1, '1 lata:52'],
  ['atun-aceite', 'Atún en aceite de oliva (escurrido)', 'g', 190, 26, 0, 0, 9.5, 1.6, 0, 1, '1 lata:56'],
  ['sardinas-lata', 'Sardinas en aceite (escurridas)', 'g', 210, 24, 0, 0, 12.5, 3, 0, 1, '1 lata:85'],
  ['gambas', 'Gambas o langostinos cocidos', 'g', 95, 21, 0, 0, 1, 0.2, 0, 1.2],
  // Lácteos
  ['leche-entera', 'Leche entera', 'ml', 64, 3.2, 4.7, 4.7, 3.6, 2.3, 0, 0.1, '1 vaso:250'],
  ['leche-semi', 'Leche semidesnatada', 'ml', 46, 3.3, 4.8, 4.8, 1.6, 1, 0, 0.1, '1 vaso:250'],
  ['leche-desnatada', 'Leche desnatada', 'ml', 35, 3.4, 4.9, 4.9, 0.2, 0.1, 0, 0.1, '1 vaso:250'],
  ['bebida-avena', 'Bebida de avena', 'ml', 45, 0.5, 7, 4, 1.5, 0.2, 0.8, 0.1, '1 vaso:250'],
  ['yogur-natural', 'Yogur natural', 'g', 61, 3.5, 4.7, 4.7, 3.3, 2.1, 0, 0.13, '1 yogur:125'],
  ['yogur-griego', 'Yogur griego natural', 'g', 120, 3.7, 4.5, 4.5, 10, 6.5, 0, 0.13, '1 yogur:125'],
  ['yogur-proteina', 'Yogur alto en proteínas natural', 'g', 60, 10, 4, 4, 0.2, 0.1, 0, 0.1, '1 yogur:120'],
  ['queso-batido', 'Queso fresco batido 0 %', 'g', 46, 8, 3.5, 3.5, 0.2, 0.1, 0, 0.1, '1 tarrina:250'],
  ['queso-burgos', 'Queso fresco tipo Burgos', 'g', 174, 12, 3, 3, 13, 8.5, 0, 0.9, '1 porción:60'],
  ['queso-curado', 'Queso curado', 'g', 410, 26, 0.5, 0.5, 34, 22, 0, 1.8, '1 cuña:25'],
  ['queso-lonchas', 'Queso en lonchas (tipo gouda)', 'g', 350, 25, 0, 0, 27, 17, 0, 1.8, '1 loncha:20'],
  ['mozzarella', 'Mozzarella', 'g', 250, 18, 1.5, 1.5, 19, 12, 0, 0.5, '1 bola:125'],
  ['requeson', 'Requesón', 'g', 100, 11, 3.5, 3.5, 4.5, 3, 0, 0.3],
  ['mantequilla', 'Mantequilla', 'g', 740, 0.6, 0.6, 0.6, 82, 52, 0, 0.05, '1 porción:10'],
  // Cereales, pan y tubérculos
  ['avena', 'Copos de avena', 'g', 370, 13.5, 59, 1, 7, 1.3, 10, 0, '1 puñado:40'],
  ['arroz-crudo', 'Arroz blanco (crudo)', 'g', 355, 7, 79, 0.2, 0.6, 0.2, 1.3, 0],
  ['arroz-cocido', 'Arroz blanco cocido', 'g', 130, 2.7, 28, 0.1, 0.3, 0.1, 0.4, 0],
  ['arroz-integral', 'Arroz integral (crudo)', 'g', 360, 7.5, 74, 0.7, 2.7, 0.6, 3.5, 0],
  ['pasta-seca', 'Pasta (seca)', 'g', 355, 12.5, 71, 3, 1.5, 0.3, 3, 0],
  ['pasta-cocida', 'Pasta cocida', 'g', 155, 5.5, 30, 0.6, 0.9, 0.2, 1.8, 0],
  ['pasta-integral', 'Pasta integral (seca)', 'g', 345, 13, 63, 3, 2.5, 0.5, 8, 0],
  ['pan-barra', 'Pan blanco de barra', 'g', 270, 9, 55, 2.5, 1.5, 0.3, 3, 1.2, '1 rebanada:30|1/4 barra:60'],
  ['pan-integral', 'Pan integral', 'g', 245, 10, 41, 3, 3.5, 0.6, 7, 1.1, '1 rebanada:30'],
  ['pan-molde', 'Pan de molde', 'g', 265, 8.5, 47, 5, 4, 0.6, 3.5, 1.1, '1 rebanada:25'],
  ['tortitas-arroz', 'Tortitas de arroz', 'g', 385, 8, 81, 0.5, 3, 0.6, 3, 0.1, '1 tortita:8'],
  ['cereales-maiz', 'Copos de maíz', 'g', 375, 7, 84, 8, 1, 0.2, 3, 1.1, '1 bol:30'],
  ['harina-trigo', 'Harina de trigo', 'g', 345, 10, 72, 0.5, 1.2, 0.2, 3, 0],
  ['quinoa', 'Quinoa (cruda)', 'g', 368, 14, 57, 1, 6, 0.7, 7, 0],
  ['cuscus', 'Cuscús (seco)', 'g', 365, 13, 72, 0.5, 1.6, 0.3, 5, 0],
  ['patata', 'Patata (cruda)', 'g', 77, 2, 15, 0.8, 0.1, 0, 2.2, 0, '1 patata mediana:200'],
  ['boniato', 'Boniato (crudo)', 'g', 86, 1.6, 17, 4.2, 0.1, 0, 3, 0.1, '1 boniato:250'],
  ['tortilla-trigo', 'Tortilla de trigo (wrap)', 'g', 300, 8.5, 50, 3, 7, 3, 3, 1.3, '1 tortilla:60'],
  // Legumbres y proteína vegetal
  ['lentejas-secas', 'Lentejas (secas)', 'g', 330, 24, 49, 2, 1.5, 0.2, 11, 0],
  ['garbanzos-secos', 'Garbanzos (secos)', 'g', 365, 19, 50, 10, 6, 0.6, 12, 0],
  ['garbanzos-bote', 'Garbanzos cocidos (bote)', 'g', 120, 7, 15, 0.5, 2.5, 0.3, 5, 0.6, '1 bote escurrido:250'],
  ['lentejas-bote', 'Lentejas cocidas (bote)', 'g', 90, 7, 12, 0.5, 0.5, 0.1, 5, 0.5, '1 bote escurrido:250'],
  ['alubias-bote', 'Alubias blancas cocidas (bote)', 'g', 95, 6.5, 12.5, 0.5, 0.5, 0.1, 6.5, 0.5, '1 bote escurrido:250'],
  ['edamame', 'Edamame', 'g', 120, 11, 7, 2, 5, 0.6, 5, 0],
  ['tofu', 'Tofu firme', 'g', 145, 15, 2, 0.5, 8.5, 1.2, 1, 0],
  ['hummus', 'Hummus', 'g', 250, 7, 14, 0.5, 18, 2, 6, 1.2, '1 cucharada:15'],
  // Verduras
  ['brocoli', 'Brócoli', 'g', 34, 2.8, 4, 1.7, 0.4, 0.1, 2.6, 0.08],
  ['espinacas', 'Espinacas', 'g', 23, 2.9, 1.4, 0.4, 0.4, 0.1, 2.2, 0.2],
  ['lechuga', 'Lechuga', 'g', 15, 1.4, 1.5, 1, 0.2, 0, 1.3, 0],
  ['tomate', 'Tomate', 'g', 18, 0.9, 2.6, 2.6, 0.2, 0, 1.2, 0, '1 tomate:150'],
  ['pepino', 'Pepino', 'g', 15, 0.7, 2.5, 1.7, 0.1, 0, 0.5, 0],
  ['zanahoria', 'Zanahoria', 'g', 41, 0.9, 7, 4.7, 0.2, 0, 2.8, 0.15, '1 zanahoria:80'],
  ['cebolla', 'Cebolla', 'g', 40, 1.1, 7.5, 4.2, 0.1, 0, 1.7, 0, '1 cebolla:150'],
  ['pimiento-rojo', 'Pimiento rojo', 'g', 31, 1, 4.5, 4.2, 0.3, 0, 2.1, 0],
  ['calabacin', 'Calabacín', 'g', 17, 1.2, 2.2, 2, 0.3, 0.1, 1, 0],
  ['champinones', 'Champiñones', 'g', 22, 3.1, 2.3, 2, 0.3, 0.1, 1, 0],
  ['judias-verdes', 'Judías verdes', 'g', 31, 1.8, 4.3, 3.3, 0.2, 0, 2.7, 0],
  ['coliflor', 'Coliflor', 'g', 25, 1.9, 3, 1.9, 0.3, 0.1, 2, 0.05],
  ['berenjena', 'Berenjena', 'g', 25, 1, 3, 3, 0.2, 0, 3, 0],
  ['aguacate', 'Aguacate', 'g', 160, 2, 1.8, 0.7, 14.7, 2.1, 6.7, 0, '1/2 aguacate:70'],
  ['maiz-lata', 'Maíz dulce en lata', 'g', 80, 2.5, 13, 4, 1.2, 0.2, 2.5, 0.5],
  ['tomate-triturado', 'Tomate triturado', 'g', 30, 1.3, 4, 4, 0.2, 0, 1.5, 0.2],
  ['gazpacho', 'Gazpacho', 'ml', 40, 0.8, 3.5, 3, 2.5, 0.4, 0.8, 0.7, '1 vaso:250'],
  // Fruta
  ['platano', 'Plátano', 'g', 89, 1.1, 20, 12, 0.3, 0.1, 2.6, 0, '1 plátano:120'],
  ['manzana', 'Manzana', 'g', 52, 0.3, 11.5, 10, 0.2, 0, 2.4, 0, '1 manzana:180'],
  ['naranja', 'Naranja', 'g', 47, 0.9, 9.5, 9, 0.1, 0, 2.4, 0, '1 naranja:150'],
  ['mandarina', 'Mandarina', 'g', 53, 0.8, 11, 10.6, 0.3, 0, 1.8, 0, '1 mandarina:70'],
  ['pera', 'Pera', 'g', 57, 0.4, 12, 10, 0.1, 0, 3.1, 0, '1 pera:170'],
  ['fresas', 'Fresas', 'g', 32, 0.7, 5.7, 4.9, 0.3, 0, 2, 0],
  ['arandanos', 'Arándanos', 'g', 57, 0.7, 12, 10, 0.3, 0, 2.4, 0],
  ['uvas', 'Uvas', 'g', 69, 0.7, 17, 15.5, 0.2, 0.1, 0.9, 0],
  ['kiwi', 'Kiwi', 'g', 61, 1.1, 12, 9, 0.5, 0, 3, 0, '1 kiwi:75'],
  ['pina', 'Piña', 'g', 50, 0.5, 11.5, 10, 0.1, 0, 1.4, 0],
  ['sandia', 'Sandía', 'g', 30, 0.6, 7.2, 6.2, 0.2, 0, 0.4, 0],
  ['melon', 'Melón', 'g', 34, 0.8, 7.2, 7, 0.2, 0, 0.9, 0],
  ['melocoton', 'Melocotón', 'g', 39, 0.9, 8, 8, 0.3, 0, 1.5, 0, '1 melocotón:150'],
  ['datiles', 'Dátiles', 'g', 280, 2.5, 67, 63, 0.4, 0, 8, 0, '1 dátil:8'],
  // Grasas y frutos secos
  ['aceite-oliva', 'Aceite de oliva virgen extra', 'g', 899, 0, 0, 0, 99.9, 14, 0, 0, '1 cucharada:10|1 cucharadita:4'],
  ['almendras', 'Almendras', 'g', 610, 21, 7, 4.4, 52, 4, 12, 0, '1 puñado:25'],
  ['nueces', 'Nueces', 'g', 690, 15, 7, 2.6, 65, 6, 6.7, 0, '1 puñado:25'],
  ['cacahuetes', 'Cacahuetes', 'g', 590, 26, 9, 4, 49, 7, 8.5, 0, '1 puñado:25'],
  ['crema-cacahuete', 'Crema de cacahuete 100 %', 'g', 610, 26, 11, 5, 50, 9, 7, 0, '1 cucharada:15'],
  ['pipas', 'Pipas de girasol peladas', 'g', 600, 21, 11, 2.6, 51, 4.5, 8.6, 0],
  ['chia', 'Semillas de chía', 'g', 490, 17, 8, 0, 31, 3.3, 34, 0, '1 cucharada:12'],
  ['chocolate-85', 'Chocolate negro 85 %', 'g', 580, 11, 19, 14, 50, 30, 12, 0, '1 onza:10'],
  ['aceitunas', 'Aceitunas verdes', 'g', 145, 1, 0.5, 0, 15, 2, 3.3, 4, '10 aceitunas:40'],
  ['mayonesa', 'Mayonesa', 'g', 700, 1, 1.5, 1.3, 76, 6, 0, 1.3, '1 cucharada:15'],
  // Proteína en polvo
  ['whey', 'Proteína whey (concentrado)', 'g', 400, 75, 8, 6, 6, 3.5, 0, 0.5, '1 cacito:30'],
  ['whey-isolate', 'Proteína whey (aislado)', 'g', 370, 88, 2, 1.5, 1, 0.5, 0, 0.4, '1 cacito:30'],
  // Otros
  ['miel', 'Miel', 'g', 304, 0.3, 82, 82, 0, 0, 0, 0, '1 cucharada:20'],
  ['azucar', 'Azúcar', 'g', 400, 0, 100, 100, 0, 0, 0, 0, '1 sobre:8'],
  ['mermelada', 'Mermelada', 'g', 250, 0.4, 60, 55, 0.1, 0, 1, 0, '1 cucharada:20'],
  ['ketchup', 'Kétchup', 'g', 110, 1.5, 25, 22, 0.2, 0, 0.5, 2.5, '1 cucharada:15'],
  ['tomate-frito', 'Tomate frito', 'g', 75, 1.5, 9, 7, 3.5, 0.4, 1.5, 1.2],
  ['pizza-margarita', 'Pizza margarita', 'g', 250, 11, 30, 3, 9, 4.5, 2, 1.3],
  ['tortilla-patatas', 'Tortilla de patatas', 'g', 180, 6.5, 13, 1, 11.5, 2, 1.2, 0.8, '1 pincho:120'],
  ['galletas-maria', 'Galletas tipo María', 'g', 440, 7, 72, 22, 13, 5, 2.5, 0.6, '1 galleta:6'],
  ['patatas-fritas', 'Patatas fritas de bolsa', 'g', 540, 6, 50, 0.5, 34, 3.5, 4, 1.3],
  ['croissant', 'Cruasán', 'g', 410, 8, 45, 10, 21, 12, 2, 1, '1 cruasán:60'],
  ['helado', 'Helado de nata', 'g', 200, 3.5, 24, 21, 10, 7, 0.5, 0.2, '1 bola:60'],
  // Bebidas
  ['cafe', 'Café solo', 'ml', 2, 0.1, 0, 0, 0, 0, 0, 0, '1 taza:50'],
  ['zumo-naranja', 'Zumo de naranja', 'ml', 45, 0.7, 10, 8.4, 0.2, 0, 0.2, 0, '1 vaso:200'],
  ['refresco-cola', 'Refresco de cola', 'ml', 42, 0, 10.6, 10.6, 0, 0, 0, 0, '1 lata:330'],
  ['refresco-zero', 'Refresco sin azúcar', 'ml', 0.3, 0, 0, 0, 0, 0, 0, 0.02, '1 lata:330'],
  ['cerveza', 'Cerveza', 'ml', 43, 0.4, 3.5, 0.3, 0, 0, 0, 0, '1 caña:200|1 tercio:330'],
  ['vino-tinto', 'Vino tinto', 'ml', 85, 0.1, 2.6, 0.6, 0, 0, 0, 0, '1 copa:150'],
];

function portions(spec: string | undefined, id: string): Portion[] {
  if (!spec) return [];
  return spec.split('|').map((p, i) => {
    const [name, g] = p.split(':');
    return { id: `${id}-p${i}`, name, grams: Number(g) };
  });
}

export function seedFoods(now = Date.now()): Food[] {
  return ROWS.map(([id, name, unit, kcal, protein, carbs, sugar, fat, satFat, fiber, salt, por]) => ({
    id: `g-${id}`,
    name,
    unit,
    per100: { kcal, protein, carbs, sugar, fat, satFat, fiber, salt },
    portions: portions(por, `g-${id}`),
    source: 'generico',
    createdAt: now,
    updatedAt: now,
  }));
}
