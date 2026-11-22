import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../db/db';
import type { Food } from '../../db/types';
import { lookupBarcode } from '../../lib/off';
import { compressPhoto } from '../../lib/image';
import { getSettings } from '../../state/settings';
import { toast } from '../../ui/uiStore';
import { uid } from '../../lib/id';
// El lector de códigos (zxing) y el SDK de IA son grandes: se cargan solo cuando se usan.
const BarcodeScanner = lazy(() => import('./BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })));
import { FoodForm, draftFromNutrients, emptyDraft, type FoodDraft } from './FoodForm';
import { fmtKg } from '../../lib/format';

/** Miniatura pequeña del producto para la biblioteca. */
async function thumbOf(file: Blob): Promise<Blob | undefined> {
  try {
    return (await compressPhoto(file)).thumb;
  } catch {
    return undefined;
  }
}

async function thumbFromUrl(url?: string): Promise<Blob | undefined> {
  if (!url) return undefined;
  try {
    const r = await fetch(url);
    return r.ok ? await r.blob() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Formas de añadir un alimento: código de barras (Open Food Facts), foto de la etiqueta (IA) o a mano.
 * Todas terminan en el formulario de revisión.
 */
export function useFoodCapture(onFood: (f: Food) => void) {
  const [scanning, setScanning] = useState(false);
  const [draft, setDraft] = useState<FoodDraft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingBarcode = useRef<string>('');

  const photo = useCallback((barcode = '') => {
    pendingBarcode.current = barcode;
    fileInput.current?.click();
  }, []);

  const onFile = async (file: File) => {
    const barcode = pendingBarcode.current;
    const settings = await getSettings();
    const thumb = await thumbOf(file);
    if (!settings.apiKey) {
      setDraft(
        emptyDraft({
          barcode,
          refImage: file,
          thumb,
          notes: 'Sin clave de IA: copia los valores mirando la foto. Puedes añadir la clave en Ajustes → Lectura de etiquetas.',
        }),
      );
      return;
    }
    setBusy('Leyendo la etiqueta…');
    try {
      const { readLabel } = await import('../../lib/ai');
      const r = await readLabel(file, settings.apiKey, settings.aiModel);
      if (!r.isNutritionLabel) {
        toast('No se ve una tabla nutricional en la foto');
        setDraft(emptyDraft({ barcode, refImage: file, thumb, notes: 'La IA no encontró la tabla nutricional. Copia los valores a mano o repite la foto.' }));
        return;
      }
      setDraft({
        ...emptyDraft(),
        name: r.name,
        brand: r.brand,
        barcode,
        unit: r.unit,
        values: draftFromNutrients(r.per100),
        portions: r.servingGrams ? [{ id: uid(), name: '1 ración', grams: fmtKg(r.servingGrams) }] : [],
        source: 'ia',
        refImage: file,
        thumb,
        notes: r.notes || undefined,
      });
    } catch (e) {
      const { aiErrorMessage } = await import('../../lib/ai');
      toast(aiErrorMessage(e), { duration: 4500 });
      setDraft(emptyDraft({ barcode, refImage: file, thumb }));
    } finally {
      setBusy(null);
    }
  };

  const onCode = useCallback(
    async (code: string) => {
      setScanning(false);
      const local = await db.foods.where('barcode').equals(code).filter((f) => !f.deletedAt).first();
      if (local) {
        onFood(local);
        return;
      }
      setBusy('Buscando el producto…');
      try {
        const p = await lookupBarcode(code);
        if (!p) {
          setDraft(emptyDraft({ barcode: code, notes: 'Este producto no está en Open Food Facts. Haz una foto de la etiqueta o escribe los valores.' }));
          return;
        }
        setDraft({
          ...emptyDraft(),
          name: p.name,
          brand: p.brand ?? '',
          barcode: code,
          unit: p.unit,
          values: draftFromNutrients(p.per100),
          portions: p.servingGrams ? [{ id: uid(), name: '1 ración', grams: fmtKg(p.servingGrams) }] : [],
          source: 'off',
          thumb: await thumbFromUrl(p.imageUrl),
          notes: p.complete ? undefined : 'Faltan datos en Open Food Facts: completa la tabla o haz una foto de la etiqueta.',
        });
      } catch {
        toast('Sin conexión para buscar el código. Créalo a mano o inténtalo luego.', { duration: 3500 });
        setDraft(emptyDraft({ barcode: code }));
      } finally {
        setBusy(null);
      }
    },
    [onFood],
  );

  const ui = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void onFile(f);
        }}
      />
      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onCode={(c) => void onCode(c)} />
        </Suspense>
      )}
      <FoodForm
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={(f) => {
          setDraft(null);
          onFood(f);
        }}
        onPhoto={draft && !draft.refImage ? () => photo(draft.barcode) : undefined}
      />
      {busy &&
        createPortal(
          <div className="busy">
            <div className="busy__box">
              <span className="spinner" />
              {busy}
            </div>
          </div>,
          document.body,
        )}
    </>
  );

  return {
    scan: () => setScanning(true),
    photo: () => photo(''),
    create: (name = '') => setDraft(emptyDraft({ name: name.trim() ? name.trim().charAt(0).toUpperCase() + name.trim().slice(1) : '' })),
    ui,
  };
}
