import { useMemo, useState } from 'react';
import { Camera, ChefHat, PenLine, Plus, ScanBarcode } from 'lucide-react';
import { Page } from '../../ui/Page';
import { Segmented } from '../../ui/controls';
import { SearchBox } from '../../ui/SearchBox';
import { searchFoods, useFoods } from '../../db/hooks';
import { FoodRow } from './FoodRow';
import { push } from '../../nav/nav';
import { FoodDetail } from './FoodDetail';
import { RecipeEditor } from './RecipeEditor';
import { useFoodCapture } from './useFoodCapture';
import { showActions } from '../../ui/uiStore';

type Filter = 'mios' | 'recetas' | 'favoritos' | 'todos';

export function AlimentosHome() {
  const foods = useFoods();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const capture = useFoodCapture((f) => push(() => <FoodDetail id={f.id} />));

  const list = useMemo(() => {
    let all = foods ?? [];
    if (filter === 'mios') all = all.filter((f) => f.source !== 'generico' && !f.recipe);
    if (filter === 'recetas') all = all.filter((f) => f.recipe);
    if (filter === 'favoritos') all = all.filter((f) => f.favorite);
    return searchFoods(all, q);
  }, [foods, q, filter]);

  const addMenu = () =>
    showActions({
      title: 'Añadir',
      actions: [
        { label: 'Escanear código de barras', icon: <ScanBarcode size={18} />, onSelect: capture.scan },
        { label: 'Foto de la etiqueta', icon: <Camera size={18} />, onSelect: capture.photo },
        { label: 'Crear alimento a mano', icon: <PenLine size={18} />, onSelect: () => capture.create() },
        { label: 'Crear receta', icon: <ChefHat size={18} />, onSelect: () => push(() => <RecipeEditor />) },
      ],
    });

  return (
    <Page
      title="Alimentos"
      right={
        <button className="icon-btn" onClick={addMenu} aria-label="Añadir alimento">
          <Plus size={26} />
        </button>
      }
      sub={
        <>
          <SearchBox value={q} onChange={setQ} placeholder="Buscar alimento o marca" />
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'mios', label: 'Míos' },
              { value: 'recetas', label: 'Recetas' },
              { value: 'favoritos', label: 'Favoritos' },
            ]}
          />
        </>
      }
    >
      <div className="list-plain">
        {list.map((f) => (
          <FoodRow key={f.id} food={f} onClick={() => push(() => <FoodDetail id={f.id} />)} />
        ))}
      </div>
      {foods && list.length === 0 && (
        <div className="empty">
          <div className="empty__title">
            {q ? 'Sin resultados' : filter === 'recetas' ? 'Aún no tienes recetas' : filter === 'mios' ? 'Aún no has guardado alimentos' : 'Sin favoritos'}
          </div>
          <div className="empty__text">
            {filter === 'recetas' ? 'Combina alimentos, indica el peso final cocinado y la app calcula los macros por ración.' : 'Escanea el código de barras o haz una foto de la etiqueta.'}
          </div>
          <button className="btn btn--tinted" onClick={filter === 'recetas' ? () => push(() => <RecipeEditor />) : addMenu}>
            {filter === 'recetas' ? 'Crear receta' : 'Añadir alimento'}
          </button>
        </div>
      )}
      <div className="list-count">{foods ? `${list.length} alimentos` : ''}</div>
      {capture.ui}
    </Page>
  );
}
