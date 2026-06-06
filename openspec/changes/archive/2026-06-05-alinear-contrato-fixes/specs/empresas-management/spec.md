# empresas-management — delta spec

**Capability**: empresas-management
**Change**: alinear-contrato-fixes (Change 1)
**Delta tipo**: MODIFY (correccion de nombre de campo)
**Status**: implemented
**Fecha**: 2026-06-05

---

## Purpose

Corrige el nombre del campo de sitio web de `pagina_web` (snake_case) a `paginaWeb` (camelCase) en el schema Zod y el formulario de empresa.

`CreateEmpresaRequest.java` y `EditEmpresaRequest.java` declaran el campo como `String paginaWeb` (camelCase). El front usaba `pagina_web` (snake_case), lo que causaba que el dato se enviara bajo un nombre que el back ignora silenciosamente — la URL de la empresa nunca se guardaba.

---

## Requirements modificados

---

### REQ-2 — empresa: paginaWeb camelCase

**Modifica:** Requirement "Payload de create alineado al back" en la spec canonica de `empresas-management`.

**REQ-2.1:** `empresaCreateSchema` MUST declarar el campo como `paginaWeb` (camelCase).

**REQ-2.2:** `empresaUpdateSchema` MUST reflejar el mismo cambio de nombre (deriva de `empresaCreateSchema.partial()`).

**REQ-2.3:** `EmpresaForm.tsx` MUST usar `name="paginaWeb"` en el `FormField` del sitio web y actualizar `EMPTY_DEFAULTS` con `paginaWeb: ''`.

**REQ-2.4:** Cualquier fixture o test que haga referencia a `pagina_web` MUST ser actualizado a `paginaWeb`.

#### Scenario: Creacion de empresa envia paginaWeb (camelCase) [integration test]

- GIVEN el usuario completa el campo "Sitio Web" con `https://ejemplo.com`
- WHEN el formulario se envia
- THEN el body HTTP contiene `{ paginaWeb: "https://ejemplo.com" }`, NO `{ pagina_web: ... }`
- AND `empresaCreateSchema.safeParse({ nombre: 'X', paginaWeb: 'https://a.com' })` retorna `success: true`

#### Scenario: El campo pagina_web (snake_case) no existe en el schema [unit test]

- GIVEN `empresaCreateSchema.shape`
- WHEN se verifica la existencia del campo
- THEN `'pagina_web' in schema` es `false`
- AND `'paginaWeb' in schema` es `true`

#### Scenario: Form prefilled carga paginaWeb correctamente [component test]

- GIVEN empresa con `paginaWeb: 'https://acme.com'`
- WHEN se abre el dialog de edicion
- THEN el campo "Sitio Web" muestra `'https://acme.com'`
- AND al guardar, el body envia `paginaWeb: 'https://acme.com'`

---

## API Contract Reference (delta)

El campo `paginaWeb` ya estaba documentado en la spec canonica de `empresas-management`. Este delta solo corrige la implementacion del front para que el nombre coincida.

**CreateEmpresaRequest / EditEmpresaRequest** (campo relevante):
```java
String paginaWeb;  // camelCase — NO pagina_web
```

---

## Out of Scope (este delta)

- Campos nuevos del back no cubiertos en Change 1: `estadoRelacion`, `responsableId`, `notas` (diferidos a Change 2).
