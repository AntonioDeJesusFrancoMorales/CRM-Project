# list-filter-presets delta

## ADDED Requirements

### Requirement: Contactos local filter presets

The Contactos page SHALL allow saving, applying and deleting local advanced filter presets without backend persistence.

#### Scenario: Save and apply a Contactos preset

- **GIVEN** the user has active Contactos filters
- **WHEN** the user saves a named view
- **THEN** the preset is stored in localStorage under the Contactos presets key
- **AND** applying it restores the saved filter state.

### Requirement: Contactos page-level filtering

The Contactos page SHALL own filtering before rendering `ContactosTable`.

#### Scenario: Filter contacts by empresa

- **GIVEN** the Contactos page has loaded contacts and companies
- **WHEN** the user selects an empresa filter
- **THEN** only contacts belonging to that empresa and current estado tab are shown.
