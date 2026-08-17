import { X } from 'lucide-react';

interface SavedViewChipItem {
  id: string;
  name: string;
}

interface SavedViewChipsProps {
  items: SavedViewChipItem[];
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedViewChips({ items, onApply, onDelete }: SavedViewChipsProps) {
  return (
    <>
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 py-0.5 pl-2 pr-1 text-xs text-muted-foreground"
        >
          <button type="button" onClick={() => onApply(item.id)} className="hover:underline">
            {item.name}
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={`Eliminar vista ${item.name}`}
            className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </>
  );
}
