Append-only JSONL per month. NEVER edit a previous line. Dedup at append-time
via the in-memory id index. Atomic writes only (fs.appendFile with flag 'a').

The store schema is the source of truth in schema.ts. Bump schemaVersion
in meta.json and add a migration in migrations.ts when changing event shape.
