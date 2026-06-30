# list-filter-presets delta

## ADDED Requirements

### Requirement: Empresas local filter presets

The Empresas page SHALL allow saving, applying and deleting local advanced filter presets without backend persistence.

#### Scenario: Save and apply an Empresas preset

- **GIVEN** the user has active Empresas filters
- **WHEN** the user saves a named view
- **THEN** the preset is stored in localStorage under the Empresas presets key
- **AND** applying it restores the saved filter state.

### Requirement: Empresas page-level filtering

The Empresas page SHALL own filtering before rendering `EmpresasTable`.

#### Scenario: Filter companies by sector

- **GIVEN** the Empresas page has loaded companies
- **WHEN** the user selects a sector filter
- **THEN** only companies in that sector are shown.
