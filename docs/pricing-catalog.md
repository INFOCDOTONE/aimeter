# Pricing Catalog

The bundled catalog lives in `src/pricing/catalog.ts`. All costs shown by AIMeter are estimated.

Provider model versions must be added as exact catalog entries when pricing can differ by minor model version. AIMeter should prefer a low-confidence zero estimate for an unknown model over silently falling back to a different price family.

## Billing basis

AIMeter separates token counting from billing basis. Token counts come from local JSONL logs. Estimated API cost is shown only for usage classified as `api-metered`.

Users who run agents through a subscription plan, such as Claude Max or Claude Pro, can mark that usage as `subscription-included`:

```json
{
  "aimeter.billing.agentOverrides": {
    "claude-code": "subscription-included"
  }
}
```

Model overrides are also supported and take precedence over agent overrides:

```json
{
  "aimeter.billing.modelOverrides": {
    "claude-sonnet-4-6": "subscription-included"
  }
}
```

Supported values are `api-metered`, `subscription-included`, and `unknown`.
