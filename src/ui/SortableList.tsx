import type { ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

interface Props<T> {
  items: T[];
  getId: (t: T) => string;
  onReorder: (next: T[]) => void;
  render: (t: T, handle: ReactNode) => ReactNode;
}

export function SortableList<T>({ items, getId, onReorder, render }: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 4 } }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => getId(i) === e.active.id);
    const to = items.findIndex((i) => getId(i) === e.over!.id);
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[verticalOnly]}>
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        {items.map((it) => (
          <SortableItem key={getId(it)} id={getId(it)}>
            {(handle) => render(it, handle)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button className="drag-handle" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Reordenar">
      <GripVertical size={20} />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      className={`sortable ${isDragging ? 'is-dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children(handle)}
    </div>
  );
}
