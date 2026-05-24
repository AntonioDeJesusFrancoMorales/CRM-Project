// Placeholders para features pendientes. Cada uno indica el Change que
// implementará el contenido real. Se reemplazan cuando llegue el Change correspondiente.

interface PlaceholderProps {
  feature: string;
  changeNumber: number;
  description: string;
}

function Placeholder({ feature, changeNumber, description }: PlaceholderProps) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-3">
      <span className="inline-block text-[10px] uppercase tracking-widest rounded-full bg-muted px-3 py-1 text-muted-foreground">
        Change {changeNumber} · Próximamente
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{feature}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export const TablerosPlaceholder = () => (
  <Placeholder
    feature="Tableros Kanban"
    changeNumber={7}
    description="Motor genérico de tableros con columnas y fichas. Drag & drop para mover entre columnas."
  />
);
