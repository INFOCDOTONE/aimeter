Each parser implements JsonlParser from base.ts. Add >=3 anonymized fixtures
in /fixtures/<agent>/ and tests asserting exact normalized output.

Forbidden-field policy is a P0 invariant: parsers MUST NEVER return
fields that could contain source code, prompts, or completions. The test
no-forbidden-fields.test.ts enforces this against the strict zod schema.

Tolerate missing optional fields by treating them as 0. Tolerate dated
model suffixes (-20251001) by stripping them before catalog lookup.
