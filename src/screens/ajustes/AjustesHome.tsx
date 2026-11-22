import { useEffect, useRef, useState } from 'react';
import { Download, HardDrive, Info, Pill, Share2, Smartphone, Sparkles, Target, Upload, User, UtensilsCrossed, UserPlus } from 'lucide-react';
import { Page } from '../../ui/Page';
import { setSetting, useSettings } from '../../state/settings';
import { fmtK, fmtKg, relativeDay } from '../../lib/format';
import { ask, confirm, toast } from '../../ui/uiStore';
import { createBackup, exportFoods, importFoods, readBackup, restoreBackup, shareOrDownload } from '../../lib/backup';
import { fmtBytes } from '../../lib/image';
import { isStandalone } from '../../lib/platform';
import { InstallSheet } from './InstallSheet';
import { push } from '../../nav/nav';
import { ProfilePage } from './ProfilePage';
import { TargetsPage } from './TargetsPage';
import { MealsPage } from './MealsPage';
import { SupplementsPage } from './SupplementsPage';
import { AiPage } from './AiPage';
import { GOAL_LABEL } from '../../lib/nutrition';
import { useSupplements } from '../../db/hooks';

function useStorageInfo() {
  const [info, setInfo] = useState<{ usage?: number; persisted?: boolean }>({});
  useEffect(() => {
    const load = async () => {
      try {
        const [est, persisted] = await Promise.all([navigator.storage?.estimate?.(), navigator.storage?.persisted?.()]);
        setInfo({ usage: est?.usage, persisted });
      } catch {
        /* sin datos */
      }
    };
    void load();
  }, []);
  return info;
}

async function deliver(file: File, what: string): Promise<boolean> {
  let r = await shareOrDownload(file);
  if (r === 'needs-gesture') {
    const ok = await confirm({ title: `${what} preparado`, message: `${fmtBytes(file.size)} listos para guardar o enviar.`, confirmText: 'Guardar' });
    r = ok ? await shareOrDownload(file) : 'cancelled';
  }
  return r === 'shared' || r === 'downloaded';
}

export function AjustesHome() {
  const s = useSettings();
  const supps = useSupplements() ?? [];
  const storage = useStorageInfo();
  const [busy, setBusy] = useState<string | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const backupInput = useRef<HTMLInputElement>(null);
  const foodsInput = useRef<HTMLInputElement>(null);
  const standalone = isStandalone();
  const backupAge = s.lastBackupAt ? (Date.now() - s.lastBackupAt) / 86400000 : Infinity;
  const p = s.profile;
  const t = s.targets;

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message || 'Algo ha fallado', { duration: 4000 });
    } finally {
      setBusy(null);
    }
  };

  const doExport = () =>
    run('export', async () => {
      const file = await createBackup();
      if (await deliver(file, 'Copia')) {
        await setSetting('lastBackupAt', Date.now());
        toast(`Copia creada (${fmtBytes(file.size)})`, { tone: 'success' });
      }
    });

  const doImport = (file: File) =>
    run('import', async () => {
      const b = await readBackup(file);
      const r = await ask({
        title: '¿Restaurar esta copia?',
        message: `Del ${new Date(b.json.exportedAt).toLocaleDateString('es-ES')}: ${b.json.entries.length} registros y ${b.json.foods.length} alimentos. Sustituirá TODOS los datos actuales.`,
        confirmText: 'Restaurar',
        destructive: true,
      });
      if (r !== 'confirm') return;
      await restoreBackup(b);
      toast('Copia restaurada', { tone: 'success' });
    });

  const doShareFoods = () =>
    run('share', async () => {
      const { file, count } = await exportFoods();
      if (!count) return toast('Aún no has guardado alimentos propios ni recetas');
      if (await deliver(file, 'Archivo de alimentos')) toast(`${count} alimentos listos para compartir`, { tone: 'success' });
    });

  const doImportFoods = (file: File) =>
    run('importFoods', async () => {
      const { added, updated } = await importFoods(file);
      toast(`${added} alimentos añadidos${updated ? ` y ${updated} actualizados` : ''}`, { tone: 'success' });
    });

  return (
    <Page title="Ajustes" large>
      {!standalone && (
        <button className="install-banner" onClick={() => setInstallOpen(true)}>
          <Smartphone size={22} />
          <span>
            <b>Instala la app en tu iPhone</b>
            <small>Pantalla completa, sin conexión y sin que iOS borre tus datos.</small>
          </span>
        </button>
      )}

      <div className="group-title">Plan</div>
      <div className="group">
        <button className="group__row group__row--link" onClick={() => push(() => <ProfilePage />)}>
          <span className="group__icon">
            <User size={18} />
          </span>
          <span>Perfil y objetivo</span>
          <span className="group__value">{p ? `${p.name ? p.name.split(' ')[0] + ' · ' : ''}${GOAL_LABEL[p.goal]}` : ''}</span>
        </button>
        <button className="group__row group__row--link" onClick={() => push(() => <TargetsPage />)}>
          <span className="group__icon group__icon--orange">
            <Target size={18} />
          </span>
          <span>Objetivos diarios</span>
          <span className="group__value">{t ? `${fmtK(t.kcal)} kcal · P ${t.protein} g` : ''}</span>
        </button>
        <button className="group__row group__row--link" onClick={() => push(() => <MealsPage />)}>
          <span className="group__icon group__icon--blue">
            <UtensilsCrossed size={18} />
          </span>
          <span>Comidas del día</span>
          <span className="group__value">{s.meals.length}</span>
        </button>
        <button className="group__row group__row--link" onClick={() => push(() => <SupplementsPage />)}>
          <span className="group__icon group__icon--purple">
            <Pill size={18} />
          </span>
          <span>Suplementos</span>
          <span className="group__value">{supps.filter((x) => x.active).length}</span>
        </button>
        <button className="group__row group__row--link" onClick={() => push(() => <AiPage />)}>
          <span className="group__icon group__icon--yellow">
            <Sparkles size={18} />
          </span>
          <span>Lectura de etiquetas (IA)</span>
          <span className="group__value">{s.apiKey ? 'Activada' : 'Opcional'}</span>
        </button>
      </div>

      <div className="group-title">Compartir con tu pareja</div>
      <div className="group">
        <button className="group__row group__row--link" onClick={doShareFoods} disabled={!!busy}>
          <span className="group__icon group__icon--green">
            <Share2 size={18} />
          </span>
          <span>{busy === 'share' ? 'Preparando…' : 'Enviar mis alimentos y recetas'}</span>
        </button>
        <button className="group__row group__row--link" onClick={() => foodsInput.current?.click()} disabled={!!busy}>
          <span className="group__icon group__icon--blue">
            <UserPlus size={18} />
          </span>
          <span>{busy === 'importFoods' ? 'Importando…' : 'Importar alimentos recibidos'}</span>
        </button>
      </div>
      <p className="hint group-hint">Lo que escanee uno, lo puede importar el otro (por AirDrop, WhatsApp o Archivos). Vuestros diarios siguen siendo independientes.</p>

      <div className="group-title">Copia de seguridad</div>
      {backupAge > 14 && (
        <div className="backup-warn">
          {s.lastBackupAt ? `Tu última copia es de hace ${Math.floor(backupAge)} días.` : 'Aún no has hecho ninguna copia.'} Guárdala en Archivos o iCloud Drive.
        </div>
      )}
      <div className="group">
        <button className="group__row group__row--link" onClick={doExport} disabled={!!busy}>
          <span className="group__icon group__icon--green">
            <Upload size={18} />
          </span>
          <span>{busy === 'export' ? 'Creando copia…' : 'Exportar copia completa'}</span>
          <span className="group__value">{s.lastBackupAt ? relativeDay(s.lastBackupAt) : 'Nunca'}</span>
        </button>
        <button className="group__row group__row--link" onClick={() => backupInput.current?.click()} disabled={!!busy}>
          <span className="group__icon group__icon--blue">
            <Download size={18} />
          </span>
          <span>{busy === 'import' ? 'Restaurando…' : 'Importar copia'}</span>
        </button>
      </div>
      <input
        ref={backupInput}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void doImport(f);
        }}
      />
      <input
        ref={foodsInput}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void doImportFoods(f);
        }}
      />

      <div className="group-title">Dispositivo</div>
      <div className="group">
        <div className="group__row">
          <span className="group__icon group__icon--purple">
            <HardDrive size={18} />
          </span>
          <span>Espacio usado</span>
          <span className="group__value">{storage.usage != null ? fmtBytes(storage.usage) : '—'}</span>
        </div>
        <div className="group__row">
          <span className="group__icon group__icon--green">
            <Info size={18} />
          </span>
          <span>Almacenamiento persistente</span>
          <span className="group__value">{storage.persisted ? 'Activado' : 'No concedido'}</span>
        </div>
        <button className="group__row group__row--link" onClick={() => setInstallOpen(true)}>
          <span className="group__icon">
            <Smartphone size={18} />
          </span>
          <span>Instalar en el iPhone</span>
          <span className="group__value">{standalone ? 'Instalada' : 'Ver pasos'}</span>
        </button>
      </div>
      <p className="hint group-hint">Tus datos se guardan solo en este dispositivo; no hay servidor ni cuenta.</p>
      <p className="version">
        Nutri · versión {__APP_VERSION__}
        {t ? ` · mantenimiento de referencia ${fmtK(t.tdee)} kcal` : ''}
        {p ? ` · ritmo ${fmtKg(p.ratePct)} %/sem` : ''}
      </p>
      <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
    </Page>
  );
}
