# empresas-management — delta spec

**Capability**: empresas-management
**Change**: alinear-contrato-mapeos (Change 2)
**Delta tipo**: ADD (endpoint cambiar-estado) + MODIFY (campos estadoRelacion/notas)
**Status**: proposed
**Fecha**: 2026-06-05

---

## Purpose

Agregar el cambio de `estadoRelacion` de empresa vía su endpoint dedicado y
permitir setear `estadoRelacion` y `notas` (campos que `Create/EditEmpresaRequest`
aceptan y el form ignoraba).

---

## Requirements

### REQ-1 — el estado de empresa se cambia vía edit (NO cambiar-estado)

**Decisión:** A diferencia de contactos, la empresa NO usa el endpoint dedicado
`/empresas/cambiar-estado`. El estado se modifica a través del formulario de
edición (`PUT /empresas/edit`), que ya incluye el campo `estadoRelacion`.

**REQ-1.1:** El front NO debe declarar `endpoints.empresas.cambiarEstado` ni un
hook `useCambiarEstadoEmpresa` (código muerto: ninguna UI los usa).

**REQ-1.2:** `EmpresaForm` MUST exponer `estadoRelacion` editable, de modo que
al guardar la edición el estado viaje en el body de `PUT /empresas/edit`.

#### Scenario: Cambiar estado de empresa al editar [integration test]
- GIVEN una empresa con `estadoRelacion: PROSPECTO`
- WHEN el usuario edita la empresa y selecciona `ACTIVO`
- THEN el front hace `PUT /empresas/edit?id={id}` con `estadoRelacion: "ACTIVO"` en el body

### REQ-2 — campos estadoRelacion y notas

**REQ-2.1:** `empresaCreateSchema` MUST aceptar `estadoRelacion` (enum EstadoRelacion, opcional) y `notas` (string, opcional).

**REQ-2.2:** `empresaUpdateSchema` deriva (`.partial()`).

**REQ-2.3:** `EmpresaForm` MUST exponer un select de `estadoRelacion` y un textarea de `notas`.

#### Scenario: Crear empresa con notas y estado [unit test]
- GIVEN `empresaCreateSchema`
- WHEN se valida `{ nombre: "X", estadoRelacion: "ACTIVO", notas: "cliente clave" }`
- THEN `safeParse` retorna `success: true`

---

## API Contract Reference

```
PUT /api/empresas/edit?id={uuid}   // el estado viaja acá, en estadoRelacion

CreateEmpresaRequest / EditEmpresaRequest (campos relevantes):
  nombre          @NotBlank (REQUERIDO)
  estadoRelacion, notas, responsableId, sector, telefono,
  paginaWeb, facebook, instagram, twitter   (opcionales)
```

## Out of Scope (este delta)

- `responsableId` — requiere selector de usuarios (UI nueva). Follow-up.
