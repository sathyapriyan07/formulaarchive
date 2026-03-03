# Suggested Production Structure

```text
src/
  admin/
    forms/
      CircuitForm.tsx
      DriverForm.tsx
      RaceForm.tsx
      ResultForm.tsx
      SeasonForm.tsx
      TeamForm.tsx
    pages/
      AdminCrudPage.tsx
  components/
    common/
    ui/
      Badge.tsx
      Card.tsx
      DataTable.tsx
      Form.tsx
      Modal.tsx
      SkeletonLoader.tsx
      Tabs.tsx
  hooks/
    useAuth.jsx
    useCrudEntity.ts
  layouts/
  pages/
  services/
    f1Api.ts
    supabase.js
    supabaseClient.ts
  types/
    domain.ts
  App.tsx
  main.tsx
database/
  schema.sql
  example_queries.sql
```

Notes:
- Keep `pages/` for public pages.
- Keep `admin/` for all write operations and admin-only workflows.
- Keep all DB calls in `services/` and consume them via hooks.
