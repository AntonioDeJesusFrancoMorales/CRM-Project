# Spec: customer-360

## Requirements

### R1 — Resumen 360 de Contacto

The system MUST show a `Resumen 360` tab in the contact detail page.

#### Scenarios

- WHEN the user opens a valid contact detail page, THEN the tabs SHALL include `Resumen 360`.
- WHEN the tab is active, THEN the system SHALL show commercial KPIs for that contact.
- WHEN the contact has a linked company, THEN the tab SHALL show a link to the company detail.

### R2 — Relaciones de Contacto

The system MUST derive contact relationships client-side from existing lists.

#### Scenarios

- WHEN a contact has deals, THEN the tab SHALL show those deals and link to each deal detail.
- WHEN a contact's deals have tasks, THEN the tab SHALL show those tasks and link to each task detail.
- WHEN there are no deals or tasks, THEN the tab SHALL show neutral empty states.

### R3 — Resumen 360 de Empresa

The system MUST show a `Resumen 360` tab in the company detail page.

#### Scenarios

- WHEN the user opens a valid company detail page, THEN the tabs SHALL include `Resumen 360`.
- WHEN the tab is active, THEN the system SHALL show commercial KPIs for that company.

### R4 — Relaciones de Empresa

The system MUST derive company relationships client-side from existing lists.

#### Scenarios

- WHEN a company has contacts, THEN the tab SHALL show those contacts and link to each contact detail.
- WHEN those contacts have deals, THEN the tab SHALL show those deals and link to each deal detail.
- WHEN those deals have tasks, THEN the tab SHALL show those tasks and link to each task detail.
- WHEN any relation is empty, THEN the tab SHALL show neutral empty states.

### R5 — KPIs derivados

The system MUST compute basic KPIs from the derived relations.

#### Scenarios

- WHEN deals exist, THEN the system SHALL compute total deals and open pipeline value using `estado === 'ABIERTO'`.
- WHEN tasks exist, THEN the system SHALL compute pending tasks using `fechaCompletada === null`.
- WHEN values are null, THEN the system SHALL treat them as zero for aggregate currency.

### R6 — Navegación

The system MUST use real links/buttons to navigate related records.

#### Scenarios

- WHEN the user activates a related company, contact, deal or task link, THEN the app SHALL navigate to its detail route.
