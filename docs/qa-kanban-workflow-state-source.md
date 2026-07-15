# QA checklist — Kanban workflow como fuente de estado

Fecha: 2026-07-14  
Cambio SDD: `kanban-workflow-state-source`

## Objetivo

Validar que:

- TAREAS usan la columna Kanban como estado operativo.
- TRATOS usan la columna Kanban como etapa de pipeline.
- `Trato.estado` sigue siendo resultado comercial (`ABIERTO`, `GANADO`, `PERDIDO`).
- El estado local de tareas en `localStorage` ya no participa.

---

## P0 — Flujo crítico de Tareas

- [ ] Entrar a `/tareas`.
  - Debe cargar lista y Kanban.
  - No debería aparecer nada roto por `localStorage`.

- [ ] Ver columna **Estado** en lista.
  - Debe mostrar el nombre de la columna Kanban.
  - Si una tarea no tiene ficha, debe mostrar `Sin columna`.

- [ ] Probar filtro **Estado**.
  - Debe listar columnas reales del tablero TAREAS.
  - Al elegir una columna, lista y Kanban deben filtrar coherentemente.

- [ ] Probar menú de estado de tarea.
  - Abrir los tres puntitos.
  - Debe mostrar opciones tipo `Mover a Pendiente`, `Mover a En Curso`, `Mover a Finalizada`.
  - Al elegir una, debe mover la ficha.
  - Refrescar la página: el estado debe seguir igual porque viene del backend/Kanban, no de `localStorage`.

- [ ] Mover tarea desde Kanban.
  - Arrastrar una tarea a otra columna.
  - Volver a lista.
  - La columna **Estado** debe reflejar el cambio.

---

## P0 — Validación backend Kanban

- [ ] Mover ficha TAREA a columna TAREAS.
  - Debe funcionar.

- [ ] Mover ficha TRATO a columna TRATOS.
  - Debe funcionar.

- [ ] Intentar mover ficha TAREA a columna TRATOS.
  - Debe fallar con error.
  - Probablemente requiere Postman/Insomnia si la UI no permite hacerlo.

- [ ] Intentar mover ficha TRATO a columna TAREAS.
  - Debe fallar con error.

---

## P1 — Tratos

- [ ] Entrar a `/tratos` y Kanban de tratos.
  - Mover un trato entre columnas NO debe cambiar `estado` comercial.

- [ ] Ganar trato.
  - Usar acción Ganar.
  - Debe cambiar `estado` a `GANADO`.

- [ ] Perder trato.
  - Usar acción Perder.
  - Debe pedir motivo.
  - Debe cambiar `estado` a `PERDIDO`.

- [ ] Mover trato ganado/perdido entre columnas.
  - No debería reabrir ni cambiar resultado comercial automáticamente.

---

## P1 — Detalles

- [ ] Detalle de tarea.
  - Debe mostrar badge de columna.
  - Menú debe mover la ficha.
  - Refrescar debe conservar estado.

- [ ] Detalle de trato.
  - Badge de tareas pendientes debe seguir funcionando.
  - Ya no debe depender de `localStorage`.

---

## P2 — Regresiones

- [ ] Crear tarea.
  - Debe crear tarea y ficha Kanban asociada.
  - Debe aparecer en la primera columna del tablero TAREAS.

- [ ] Eliminar tarea.
  - Debe borrar tarea.
  - Debe desaparecer del Kanban.

- [ ] Crear trato.
  - Debe crear trato y ficha Kanban asociada.
  - Debe aparecer en primera columna del tablero TRATOS.

- [ ] Eliminar trato.
  - Debe desaparecer de lista/Kanban.

---

## P3 — Casos borde

- [ ] Tarea sin ficha.
  - Debe mostrar `Sin columna`.
  - No debe crashear.
  - Menú debe estar deshabilitado o no permitir movimiento.

- [ ] Tablero TAREAS sin columnas.
  - El filtro Estado no debe romper.
  - Menú debe mostrar algo tipo `Sin columnas disponibles`.

- [ ] Recargar navegador después de mover.
  - Si vuelve al estado anterior, backend no persistió.
  - Si queda bien, el flujo está correcto.

---

## Orden recomendado

Empezar por los casos **1–5** del flujo crítico de Tareas.  
Si eso anda, seguir con validaciones backend mediante Postman/Insomnia.
