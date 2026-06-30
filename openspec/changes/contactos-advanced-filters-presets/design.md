# Design: Contactos advanced filters and local presets

## Approach

- Add `src/features/contactos/lib/contactoFilters.ts` with pure filter helpers.
- Keep estadoRelacion tabs as the primary segmentation for Contactos.
- Apply advanced filters to the full contact list, then intersect with the active tab.
- Store presets under `crm:list-presets:contactos`.
- Simplify `ContactosTable` so it renders the already-filtered list.

## Filter semantics

- Search: nombre, correo, teléfono and cargo, case-insensitive.
- Empresa: exact `empresaId` match.
- Responsable: exact `responsableId` match.
- Cómo nos conoció: exact normalized label from existing contact values.

## Tradeoffs

- Tabs remain URL-driven and are not saved inside presets; presets capture the advanced filter values only.
- Origin filter uses existing data values instead of a hard-coded enum because the field allows free text.
