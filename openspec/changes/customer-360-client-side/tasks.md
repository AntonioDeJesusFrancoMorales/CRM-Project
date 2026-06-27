# Tasks: customer-360-client-side

## 1. Lógica pura

- [x] 1.1 Crear `src/features/customer-360/lib/customer360.ts`.
- [x] 1.2 Implementar derivación contacto → tratos.
- [x] 1.3 Implementar derivación tratos → tareas.
- [x] 1.4 Implementar derivación empresa → contactos.
- [x] 1.5 Implementar derivación empresa → tratos.
- [x] 1.6 Implementar KPIs derivados.

## 2. Tests unitarios

- [x] 2.1 Crear `src/features/customer-360/__tests__/customer360.test.ts`.
- [x] 2.2 Cubrir relaciones de contacto.
- [x] 2.3 Cubrir relaciones de empresa.
- [x] 2.4 Cubrir KPIs con valores null y estados abiertos/cerrados.

## 3. Componentes UI

- [x] 3.1 Crear `Contacto360Tab.tsx`.
- [x] 3.2 Crear `Empresa360Tab.tsx`.
- [x] 3.3 Renderizar KPIs.
- [x] 3.4 Renderizar relaciones con links.
- [x] 3.5 Renderizar loading/error/empty states simples.

## 4. Integración páginas

- [x] 4.1 Integrar `Resumen 360` en `ContactoDetailPage`.
- [x] 4.2 Integrar `Resumen 360` en `EmpresaDetailPage`.
- [x] 4.3 Mantener tabs existentes `Info/Tratos` y `Información/Contactos`.

## 5. Tests integración

- [x] 5.1 Actualizar `ContactoDetailPage.test.tsx`.
- [x] 5.2 Actualizar `EmpresaDetailPage.test.tsx`.
- [x] 5.3 Verificar render básico del tab 360.

## 6. Verificación

- [x] 6.1 Ejecutar tests focales customer-360/contacto/empresa.
- [x] 6.2 Ejecutar `pnpm type-check`.
- [x] 6.3 No ejecutar build.
