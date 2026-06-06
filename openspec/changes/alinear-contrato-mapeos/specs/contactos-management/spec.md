# contactos-management — delta spec

**Capability**: contactos-management
**Change**: alinear-contrato-mapeos (Change 2)
**Delta tipo**: ADD (endpoint cambiar-estado) + MODIFY (payload de edit, campo cargo)
**Status**: proposed
**Fecha**: 2026-06-05

---

## Purpose

Alinear el cambio de `estadoRelacion` al endpoint dedicado del back y endurecer
el payload de edición para que coincida con `EditContactoRequest`
(`nombre` y `estadoRelacion` son `@NotBlank`/`@NotNull`).

---

## Requirements

### REQ-1 — cambiar-estado usa el endpoint dedicado

**REQ-1.1:** Debe existir `endpoints.contactos.cambiarEstado(id)` que resuelva a
`/contactos/cambiar-estado?id={id}`.

**REQ-1.2:** Debe existir `useCambiarEstadoContacto` que haga
`PUT /contactos/cambiar-estado?id={id}` con body `{ nuevoEstado: EstadoRelacion }`.

**REQ-1.3:** `ContactoDetailPage` MUST cambiar `estadoRelacion` vía
`useCambiarEstadoContacto`, NO vía `useUpdateContacto` con payload completo.

#### Scenario: Cambiar estado dispara cambiar-estado [integration test]
- GIVEN un contacto con `estadoRelacion: PROSPECTO`
- WHEN el usuario selecciona `ACTIVO`
- THEN el front hace `PUT /contactos/cambiar-estado?id={id}` con body `{ nuevoEstado: "ACTIVO" }`
- AND NO envía `nombre` ni el resto del contacto

### REQ-2 — ContactoUpdatePayload endurecido

**REQ-2.1:** `ContactoUpdatePayload.nombre` MUST ser requerido (no opcional).

**REQ-2.2:** `ContactoUpdatePayload.estadoRelacion` MUST ser requerido.

**REQ-2.3:** `contactoUpdateSchema` MUST reflejar lo mismo (nombre min(1), estadoRelacion enum requerido).

#### Scenario: edit sin nombre falla en el schema [unit test]
- GIVEN `contactoUpdateSchema`
- WHEN se valida `{ estadoRelacion: "ACTIVO" }` (sin nombre)
- THEN `safeParse` retorna `success: false`

### REQ-3 — campo cargo

**REQ-3.1:** `Contacto`, `ContactoCreatePayload` y `ContactoUpdatePayload` MUST incluir `cargo?: string | null`.

**REQ-3.2:** `contactoCreateSchema` y `contactoUpdateSchema` MUST aceptar `cargo` (opcional, string).

**REQ-3.3:** `ContactoForm` MUST exponer un campo de texto `cargo`.

---

## API Contract Reference

```
PUT /api/contactos/cambiar-estado?id={uuid}
  body: { "nuevoEstado": "ACTIVO" | "INACTIVO" | "PROSPECTO" }   // CambiarEstadoContactoRequest

EditContactoRequest:
  nombre          @NotBlank   (REQUERIDO)
  estadoRelacion  @NotNull    (REQUERIDO)
  correo, telefono, cargo, comoNosConocio, responsableId   (opcionales)
```
