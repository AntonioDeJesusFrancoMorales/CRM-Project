# Tasks: alinear-contrato-mapeos (Change 2)

## 1. API layer
- [x] 1.1 `endpoints.ts`: agregar `contactos.cambiarEstado(id)` → `/contactos/cambiar-estado?id={id}`
- [x] 1.2 ~~`endpoints.ts`: `empresas.cambiarEstado`~~ DESCARTADO — la empresa cambia estado vía edit
- [x] 1.3 `types.ts`: `Contacto` + `ContactoCreatePayload` agregan `cargo?: string | null`
- [x] 1.4 `types.ts`: `ContactoUpdatePayload` → `nombre` y `estadoRelacion` REQUERIDOS; agregar `cargo`; nuevo `CambiarEstadoPayload`
- [x] 1.5 `types.ts`: `Empresa` ya tiene estadoRelacion/notas/responsableId (confirmado vs EmpresaResponse)

## 2. Hooks cambiar-estado
- [x] 2.1 Crear `contactos/hooks/useCambiarEstadoContacto.ts` (PUT body `{nuevoEstado}`)
- [x] 2.2 ~~`useCambiarEstadoEmpresa`~~ DESCARTADO — empresa usa edit
- [x] 2.3 Tests: `useCambiarEstadoContacto.test.tsx`

## 3. Schemas
- [x] 3.1 `contacto.schema.ts`: `contactoUpdateSchema` nombre+estadoRelacion required; agregar `cargo` en create+update
- [x] 3.2 `empresa.schema.ts`: agregar `estadoRelacion` (enum) y `notas` en create (update deriva)

## 4. UI rewire
- [x] 4.1 `ContactoDetailPage.tsx`: reemplazar workaround de `handleEstadoChange` por `useCambiarEstadoContacto`
- [x] 4.2 `ContactoForm.tsx`: agregar campo `cargo`
- [x] 4.3 `EmpresaForm.tsx`: agregar `estadoRelacion` (select) y `notas` (textarea + nuevo componente ui/textarea)
- [x] 4.4 `EmpresaFormDialog.tsx`: precargar `estadoRelacion` + `notas` en defaultValues del edit
- [x] 4.5 `EmpresaInfoTab.tsx`: mostrar las `notas` (visualización en detalle)

## 5. Mocks MSW
- [x] 5.1 `handlers/contactos.ts`: handler `PUT /contactos/cambiar-estado`; `edit` valida `nombre`+`estadoRelacion` (400 si falta)
- [x] 5.2 ~~`handlers/empresas.ts`: cambiar-estado~~ DESCARTADO — empresa usa edit
- [x] 5.3 fixtures: agregar `cargo` a contactos; empresa ya tiene notas/estadoRelacion

## 6. Verify
- [x] 6.1 `pnpm type-check` 0 errores
- [x] 6.2 `pnpm test:run` verde — 964 tests (was 953, +11)

## Follow-ups (fuera de scope, anotados)
- [ ] empresa `responsableId` (requiere selector de usuarios)
- [ ] usuarios `keycloakId` en edit (opcional, sin UI)
- [ ] features nuevas del back: `/agendas/*`, `/superusuarios/*`, `forgot-password` + `request-password-change`
