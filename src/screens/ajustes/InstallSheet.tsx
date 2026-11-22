import { Share, SquarePlus } from 'lucide-react';
import { Sheet, SheetHeader } from '../../ui/Sheet';

export function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader
        title="Instalar en el iPhone"
        right={
          <button className="link-btn is-bold" onClick={onClose}>
            Listo
          </button>
        }
      />
      <div className="sheet-scroll install">
        <ol>
          <li>
            Abre esta página en <b>Safari</b>.
          </li>
          <li>
            Pulsa el botón <b>Compartir</b> <Share size={17} className="install__icon" /> de la barra inferior (en algunos iPhone está tras «⋯»).
          </li>
          <li>
            Elige <b>Añadir a pantalla de inicio</b> <SquarePlus size={17} className="install__icon" />. Si no lo ves, desliza hacia abajo en el menú.
          </li>
          <li>
            Deja activado <b>Abrir como app web</b> y pulsa <b>Añadir</b>.
          </li>
          <li>Abre «Nutri» desde el icono de tu pantalla de inicio: se verá a pantalla completa y funcionará sin conexión.</li>
        </ol>
        <p className="hint">
          Importante: los datos de la app instalada son independientes de los de Safari. Si ya registraste algo en Safari, exporta una copia antes e impórtala en la app.
        </p>
      </div>
    </Sheet>
  );
}
