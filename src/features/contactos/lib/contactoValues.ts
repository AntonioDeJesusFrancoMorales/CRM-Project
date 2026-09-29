type ContactoTextValues = {
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
  cargo?: string | null;
  comoNosConocio?: string | null;
};

function trimOptional(value: string | null | undefined): string | null | undefined {
  if (value == null) return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeContactoValues<T extends ContactoTextValues>(values: T): T {
  return {
    ...values,
    nombre: values.nombre.trim(),
    correo: trimOptional(values.correo),
    telefono: trimOptional(values.telefono),
    cargo: trimOptional(values.cargo),
    comoNosConocio: trimOptional(values.comoNosConocio),
  };
}
