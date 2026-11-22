import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { cleanNum } from '../../ui/fields';

const HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
  [DecodeHintType.TRY_HARDER, true],
]);

export function BarcodeScanner({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!open) return;
    setError(null);
    setManual('');
    let controls: IScannerControls | null = null;
    let done = false;
    const reader = new BrowserMultiFormatReader(HINTS, { delayBetweenScanAttempts: 120 });
    const start = async () => {
      try {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          video.current!,
          (result) => {
            if (result && !done) {
              done = true;
              controls?.stop();
              onCode(result.getText());
            }
          },
        );
      } catch (e) {
        const name = (e as Error).name;
        setError(
          name === 'NotAllowedError'
            ? 'No hay permiso para usar la cámara. Actívalo en Ajustes del iPhone → Safari → Cámara, o escribe el código.'
            : 'No se pudo abrir la cámara. Escribe el código a mano.',
        );
      }
    };
    // Pequeña espera para que la hoja termine de abrirse antes de pedir la cámara.
    const t = setTimeout(() => void start(), 250);
    return () => {
      clearTimeout(t);
      done = true;
      controls?.stop();
    };
  }, [open, onCode]);

  return (
    <Sheet open={open} onClose={onClose} size="full" className="scanner-sheet">
      <SheetHeader
        title="Escanear código"
        left={
          <button className="link-btn" onClick={onClose}>
            Cancelar
          </button>
        }
      />
      <div className="scanner">
        <div className="scanner__view">
          <video ref={video} playsInline muted autoPlay />
          <div className="scanner__frame">
            <span />
          </div>
          {error && <div className="scanner__error">{error}</div>}
        </div>
        <p className="hint" style={{ textAlign: 'center' }}>
          Centra el código de barras en el recuadro.
        </p>
        <form
          className="scanner__manual"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.length >= 8) onCode(manual);
          }}
        >
          <input
            className="input"
            inputMode="numeric"
            placeholder="O escribe el número del código"
            value={manual}
            onChange={(e) => setManual(cleanNum(e.target.value, false))}
          />
          <button className="btn btn--tinted" disabled={manual.length < 8}>
            Buscar
          </button>
        </form>
      </div>
    </Sheet>
  );
}
