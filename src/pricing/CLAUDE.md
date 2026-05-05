Cost is ALWAYS estimated. Never claim "matches provider billing."
Snapshot the rates in pricingSnapshot at compute time so historical
totals stay stable when the catalog updates.

Confidence: high if catalog verifiedAt <= 30d OR user override; medium if
<= 90d; low otherwise. No catalog match -> cost 0, confidence low.
