# Design: server-side-list-operations

## API contract
- Existing list hooks continue returning arrays by unwrapping `items` when the backend returns a page.
- New `use*Page` hooks return the full `PageResponse<T>`.

## UI migration
- This change prepares screens for server-driven paging/sorting without forcing a visual redesign in the same slice.
