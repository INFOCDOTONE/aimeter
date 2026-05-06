# INFOC ONE AIMeter - Disclaimer & Terms of Use

**Effective: v0.1.0 onward - Last updated: 5 May 2026**

> Please read this document before installing or using INFOC ONE AIMeter (the "Extension"). By installing, enabling, or using the Extension, you agree to the terms below.

---

## 1. Pilot / early-stage software

INFOC ONE AIMeter is currently a **pilot release** offered free of charge for evaluation, feedback, and community testing.

- The Extension is marked `"preview": true` on the Visual Studio Code Marketplace and Open VSX during the pilot period.
- Functionality, settings, storage formats, and supported AI agents may change between releases without notice.
- **Use at your own risk.** Do not rely on the Extension as the sole source of truth for any decision involving cost, compliance, billing, budgeting, or personnel evaluation.
- We will publish breaking changes in `CHANGELOG.md` and version-bump appropriately, but the pilot label means no stability guarantees.

The "pilot" designation will be removed when the Extension reaches v1.0.

---

## 2. No warranty

THE EXTENSION IS PROVIDED **"AS IS"** AND **"AS AVAILABLE"**, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, NON-INFRINGEMENT, OR UNINTERRUPTED OPERATION.

WE MAKE NO REPRESENTATIONS THAT THE EXTENSION WILL MEET YOUR REQUIREMENTS, BE ERROR-FREE, OR OPERATE WITHOUT INTERRUPTION.

This Extension is licensed under the **MIT License** (see `LICENSE` file). The MIT License's "as is" warranty disclaimer governs.

---

## 3. Cost figures are estimates only

All cost figures shown by the Extension are **best-effort estimates** computed from a bundled pricing catalog at the time of measurement. They are NOT:

- Actual invoices or billable amounts
- Substitutes for the official billing or usage dashboards published by the underlying AI providers (Anthropic, OpenAI, Google, GitHub, etc.)
- A reconciliation against any provider's billing systems
- Guaranteed to match what you will be charged by any provider

You should always check your **official provider account** for authoritative billing information. We do not assume liability for any financial decision made on the basis of figures reported by the Extension.

Provider plan terms can materially change billed amounts compared with API-rate estimates. This includes subscription and bundle plans (for example Pro, Max, enterprise contracts, credits, or promotional allowances) where some usage may be included, discounted, or billed differently from standard API rate cards.

The Extension surfaces a **confidence indicator** (high / medium / low) on every cost figure. Treat anything below "high" with extra caution.

---

## 4. Third-party AI agents

The Extension reads the local session-log files written by third-party AI coding agents (Claude Code, OpenAI Codex CLI, Google Gemini CLI, GitHub Copilot, and others).

- We are **not affiliated with, endorsed by, or sponsored by** Anthropic, OpenAI, Google, GitHub/Microsoft, or any other AI provider.
- All product names, trademarks, and service marks are the property of their respective owners.
- The Extension is **read-only** with respect to those agents' log files. We do not modify, intercept, or re-route any communication to or from those agents.
- Third-party agents may change their log formats, file locations, or behavior at any time. The Extension may stop working for one or more agents without notice when this happens. We will release fixes when feasible but cannot guarantee continued compatibility.

---

## 5. Privacy and data handling

The Extension's privacy posture is documented in detail in `PRIVACY.md`. In summary:

- **Pure mode (default):** No data leaves your machine.
- **Connectors mode (opt-in, v0.2.0+):** The Extension may make outbound HTTP calls to specific allowlisted provider APIs (e.g., `api.github.com`) using credentials _you_ provide. We do not operate any servers; nothing is transmitted to us.

You are responsible for:

- Keeping any provider API tokens (Personal Access Tokens, etc.) you supply to the Extension secure.
- Reviewing and approving any network access the Extension performs (Connectors mode requires explicit two-step opt-in).
- Complying with the terms of service of any third-party API you connect to via Connectors mode (e.g., GitHub API rate limits, Anthropic / OpenAI account terms).

---

## 6. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL INFOCHOLA SOLUTIONS PTE LTD ("INFOC ONE"), ITS DIRECTORS, OFFICERS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR:

- Loss of profits, revenue, goodwill, or anticipated savings
- Loss of data, business information, or use of any service
- Costs incurred for substitute goods or services
- Any sums billed to you by any AI provider, regardless of whether the figures shown by the Extension agreed with those bills
- Any decision made on the basis of figures, charts, alerts, or summaries produced by the Extension
- Business interruption, personal injury, or any other commercial damage or loss

Our aggregate liability for any claim arising out of or relating to the Extension shall not exceed **the amount you paid for the Extension** (currently zero, as the Extension is provided free of charge during the pilot period).

This limitation applies regardless of the legal theory under which the claim is brought (contract, tort, statute, or otherwise) and even if we have been advised of the possibility of such damages.

---

## 7. No professional advice

The Extension does not provide financial, legal, tax, accounting, employment, performance-management, or compliance advice. Cost reports, usage summaries, and any other output from the Extension should not be used as the sole basis for:

- Performance reviews or personnel decisions
- Tax filings or expense claims
- Budgeting or forecasting that materially affects business outcomes
- Any decision with regulatory, contractual, or fiduciary implications

Always consult a qualified professional advisor for such decisions.

---

## 8. Accuracy, completeness, and "unknown billing"

The Extension may report a category labeled `unknown billing` or similar when it encounters AI usage events whose billing basis cannot be determined from local information alone (e.g., model not in catalog, ambiguous provider plan, subscription vs. metered API usage).

- Such categories represent **events the Extension could observe but cannot confidently price**.
- Their cost is reported as `0` with `low` confidence and should be **investigated using the provider's official billing dashboard** rather than treated as zero spend.

---

## 9. Open-source license

The Extension is open-source software licensed under the **MIT License**. The full license text is in the `LICENSE` file at the repository root. The MIT License grants you broad rights to use, modify, and redistribute the Extension, **subject to the same "as is" warranty disclaimer that governs this document**.

We use other open-source dependencies, all of which are listed with their licenses in `LICENSES.md` and verified at build time by our license-check pipeline. Each dependency retains its own license terms.

---

## 10. Changes to this disclaimer

We may update this disclaimer to reflect new features, regulatory requirements, or community feedback. Updates are tracked in the Changelog section at the bottom of this file.

If a change materially expands user obligations or reduces user rights, we will:

1. Bump the version of the Extension
2. Note the change in `CHANGELOG.md` under "Disclaimer changes"
3. Trigger the first-run banner again so users see the updated disclaimer

Continued use of the Extension after a disclaimer update constitutes acceptance of the updated terms.

---

## 11. Governing law and jurisdiction

This disclaimer is governed by the laws of **the Republic of Singapore**, without regard to its conflict-of-laws principles. Any dispute arising out of or relating to the Extension or this disclaimer shall be submitted to the **exclusive jurisdiction of the courts of Singapore**.

If any provision of this disclaimer is held to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.

---

## 12. Contact

| Purpose            | Contact                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Bug reports        | [github.com/infoc-one/aimeter-infoc-one/issues](https://github.com/infoc-one/aimeter-infoc-one/issues) |
| Privacy concerns   | `security@aimeter.infoc.one`                                                                           |
| Disclaimer / legal | `legal@aimeter.infoc.one`                                                                              |
| General            | `hello@aimeter.infoc.one`                                                                              |

**Publisher:** Infochola Solutions Pte Ltd, Singapore.  
**Marketplace publisher ID:** `infoc-one` - Display name: `INFOC ONE`

---

## Changelog

- **2026-05-05** - Initial disclaimer for v0.1.0 pilot release. Covers no-warranty, estimate-only cost figures, third-party agent attribution, no-affiliation, limitation of liability capped at fees paid (currently zero), Singapore governing law.

---

_This is the disclaimer for the AIMeter Extension only. The disclaimer may be replaced or supplemented when the Extension exits pilot status (v1.0+) or when the Extension is integrated into INFOC ONE's broader commercial product family._
