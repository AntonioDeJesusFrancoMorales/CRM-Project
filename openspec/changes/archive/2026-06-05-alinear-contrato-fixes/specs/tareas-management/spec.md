# tareas-management — delta spec

**Capability**: tareas-management
**Change**: alinear-contrato-fixes (Change 1)
**Delta tipo**: MODIFY (correccion de schema de edicion)
**Status**: implemented
**Fecha**: 2026-06-05

---

## Purpose

Corrige `tareaUpdateSchema` que usaba `.partial()` haciendo todos los campos opcionales. El back (`EditTareaRequest.java`) tiene 5 campos `@NotNull` que causan 400 si no se envian.

---

## Requirements modificados

---

### REQ-3 — tareaUpdateSchema: campos @NotNull requeridos, sin .partial()

**Modifica:** Requirement "Schema Zod de tarea alineado al back" en la spec canonica de `tareas-management`.

**REQ-3.1:** `tareaUpdateSchema` MUST requerir: `responsableId` (string min 1), `titulo` (string min 1 max 200), `tipo` (enum `GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE`), `prioridad` (enum `BAJA|MEDIA|ALTA|URGENTE`), `fechaLimite` (string ISO compatible con `LocalDateTime`).

**REQ-3.2:** `tareaUpdateSchema` MAY mantener `descripcion` como `z.string().nullable().optional()`.

**REQ-3.3:** `tareaUpdateSchema` MUST NOT incluir `tratoId` (inmutable — no existe en `EditTareaRequest`).

**REQ-3.4:** `tareaUpdateSchema` MUST NOT incluir `fechaCompletada` (no existe en `EditTareaRequest.java` — el back lo ignora; confunde al leer el schema).

**Nota sobre `fechaLimite`:** El back usa `LocalDateTime`, que Jackson parsea de ISO-8601. El front envia sin offset (ej. `"2026-06-10T10:00:00"`) o con `Z` — el back acepta ambos en practica. Se usa `z.string().min(1)` con comentario explicativo.

#### Scenario: tareaUpdateSchema requiere todos los campos @NotNull [unit test]

- GIVEN `tareaUpdateSchema.safeParse({ titulo: 'X', tipo: 'GENERAL', prioridad: 'MEDIA', fechaLimite: '2026-06-10T10:00:00', responsableId: 'uuid' })`
- THEN `success: true`

#### Scenario: tareaUpdateSchema falla si falta responsableId [unit test]

- GIVEN `tareaUpdateSchema.safeParse({ titulo: 'X', tipo: 'GENERAL', prioridad: 'MEDIA', fechaLimite: '2026-06-10T10:00:00' })` (sin responsableId)
- THEN `success: false` con error en `responsableId`

#### Scenario: tareaUpdateSchema falla si faltan 4 campos @NotNull [unit test]

- GIVEN `tareaUpdateSchema.safeParse({ responsableId: 'uuid' })` (solo responsableId)
- THEN `success: false` con errores en los 4 campos faltantes

#### Scenario: tareaUpdateSchema no incluye fechaCompletada [unit test]

- GIVEN `tareaUpdateSchema`
- WHEN se verifica la existencia del campo
- THEN `'fechaCompletada' in tareaUpdateSchema.shape` es `false`

---

## API Contract Reference (delta)

**EditTareaRequest.java** (campos @NotNull verificados):
```java
@NotNull UUID responsableId;
@NotBlank @Size String titulo;
// descripcion — sin anotacion, opcional
@NotNull TipoTarea tipo;
@NotNull PrioridadTarea prioridad;
@NotNull LocalDateTime fechaLimite;
// fechaCompletada — NO existe en EditTareaRequest
// tratoId — NO existe en EditTareaRequest (inmutable)
```

---

## Out of Scope (este delta)

- Cambio de `fechaLimite` a un tipo mas estricto (ej. `z.string().datetime()`): aceptable con `z.string().min(1)` por compatibilidad con el back.
- Campos adicionales del back no cubiertos en Change 1.
