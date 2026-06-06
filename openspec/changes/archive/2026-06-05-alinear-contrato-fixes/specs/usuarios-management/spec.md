# usuarios-management — delta spec

**Capability**: usuarios-management
**Change**: alinear-contrato-fixes (Change 1)
**Delta tipo**: MODIFY (correccion de campos required en schema de edicion)
**Status**: implemented
**Fecha**: 2026-06-05

---

## Purpose

Corrige `usuarioUpdateSchema` donde `nombre` y `correo` estaban marcados como `.optional()`. El back (`EditUsuarioRequest.java`) los declara con `@NotBlank` — cualquier edit que omita estos campos causaria un 400.

---

## Requirements modificados

---

### REQ-4 — usuarioUpdateSchema: nombre y correo requeridos

**Modifica:** Requirement "Editar usuario con PUT y ruta RPC" en la spec canonica de `usuarios-management`.

**REQ-4.1:** `usuarioUpdateSchema` MUST declarar `nombre` como `z.string().min(1).max(100)` SIN `.optional()`.

**REQ-4.2:** `usuarioUpdateSchema` MUST declarar `correo` como `z.string().email().max(120)` SIN `.optional()`.

**REQ-4.3:** `rolId` MAY continuar como `.optional()` (campo sin `@NotNull` en `EditUsuarioRequest`).

#### Scenario: usuarioUpdateSchema requiere nombre [unit test]

- GIVEN `usuarioUpdateSchema.safeParse({ correo: 'test@test.com' })` (sin nombre)
- THEN `success: false` con error en campo `nombre`

#### Scenario: usuarioUpdateSchema requiere correo [unit test]

- GIVEN `usuarioUpdateSchema.safeParse({ nombre: 'Juan' })` (sin correo)
- THEN `success: false` con error en campo `correo`

#### Scenario: usuarioUpdateSchema es valido sin rolId [unit test]

- GIVEN `usuarioUpdateSchema.safeParse({ nombre: 'Juan', correo: 'juan@test.com' })` (sin rolId)
- THEN `success: true`

---

## API Contract Reference (delta)

**EditUsuarioRequest.java** (campos verificados):
```java
@NotBlank @Size String nombre;      // REQUIRED — no es opcional
@NotBlank @Email @Size String correo; // REQUIRED — no es opcional
UUID rolId;                          // sin @NotNull — opcional
@Size String keycloakId;             // sin @NotNull — opcional (no en este change)
```

---

## Out of Scope (este delta)

- `keycloakId` en `usuarioUpdateSchema` — diferido a Change 2 (NEW-B).
