export interface ListPreset<TFilters> {
  id: string;
  name: string;
  filters: TFilters;
  createdAt: string;
}

export function loadListPresets<TFilters>(storageKey: string): ListPreset<TFilters>[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isListPreset) as ListPreset<TFilters>[];
  } catch {
    return [];
  }
}

export function saveListPresets<TFilters>(
  storageKey: string,
  presets: ListPreset<TFilters>[],
): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(presets));
  } catch {
    // localStorage can fail in private mode/sandboxes. Presets are progressive enhancement.
  }
}

export function createListPreset<TFilters>(
  name: string,
  filters: TFilters,
): ListPreset<TFilters> {
  return {
    id: createId(),
    name: name.trim(),
    filters,
    createdAt: new Date().toISOString(),
  };
}

function isListPreset(value: unknown): value is ListPreset<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.filters === 'object' &&
    candidate.filters !== null
  );
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
