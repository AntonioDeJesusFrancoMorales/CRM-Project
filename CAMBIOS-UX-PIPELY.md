# Mejoras de UX en Pipely — resumen para probar

Se hicieron 3 bloques de mejoras para que Pipely sea más fácil de usar por cualquier
persona del equipo, incluso desde el celular. Ya está todo en `main` (pusheado).

## Bloque A — Responsive / móvil
- El menú lateral (Sidebar) ahora es un panel deslizable en pantallas chicas, con botón
  de hamburguesa en la barra superior. En pantallas grandes sigue fijo como antes.

**Cómo probarlo:** abre Pipely desde el celular o achica la ventana del navegador.

## Bloque B — Claridad y guía
- **Estados vacíos con acción:** en Contactos, cuando no hay
  nada, ahora se ve un mensaje claro + un botón para crear/importar (antes solo decía
  "no hay datos").
- **Dashboard de bienvenida:** si todavía no tienes contactos ni tratos, aparece una
  tarjeta "Primeros pasos" con 3 botones (Crear empresa → Agregar contactos → Crear
  oportunidad).
- **Campos opcionales marcados:** en los formularios de Contacto, Empresa y Trato, los
  campos que no son obligatorios ahora dicen "(opcional)" junto a la etiqueta (antes
  solo se marcaban los obligatorios con *).

**Cómo probarlo:** entra a Contactos sin filtros aplicados (o filtra algo que no
exista), revisa el Dashboard con una cuenta nueva, y abre/crea un Contacto o Trato
para revisar las etiquetas.

## Bloque C — Pulido fino
- **Tooltips en botones deshabilitados:** por ejemplo, el botón "Exportar CSV" en
  Contactos o "Exportar tratos (CSV)" en el Dashboard, cuando no hay datos, ahora
  muestra al pasar el mouse (o enfocar con teclado) un mensaje como "Agrega contactos
  primero para poder exportarlos".

**Cómo probarlo:** sin contactos/tratos creados, pasa el mouse sobre esos botones
deshabilitados.

---

## Validación técnica hecha
- `tsc --noEmit`: limpio, sin errores de tipos.
- `vitest run` (986 tests): todos pasan, salvo 1 test (`useDeleteTrato.test.tsx`) que
  ya fallaba de forma intermitente en `main` antes de estos cambios (se confirmó
  corriéndolo contra el código sin mis cambios) — no es algo nuevo ni relacionado.
- Commit: `d340218 — feat(ux): claridad/guia en estados vacios y formularios + pulido fino`
  (ya pusheado a `origin/main`).
