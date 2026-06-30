# Design: Empresas advanced filters and local presets

## Approach

- Add `src/features/empresas/lib/empresaFilters.ts` with pure filter helpers.
- Store one `EmpresaFilters` object in `EmpresasListPage`.
- Persist presets under `crm:list-presets:empresas` using `listPresets.ts`.
- Simplify `EmpresasTable` so it only renders the already-filtered companies.

## Filter semantics

- Search: nombre, sector, teléfono and página web, case-insensitive.
- Estado: exact `estadoRelacion` match.
- Sector: exact label from existing company values.
- Responsable: exact `responsableId` match.
- Sitio web: con web / sin web based on `paginaWeb` presence.

## Tradeoffs

- Sector options are derived from loaded data because the backend does not expose a fixed sector catalog.
- Local presets are progressive enhancement; storage failures do not block the page.
