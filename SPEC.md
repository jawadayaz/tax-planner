# Family Tax Planner — SPEC.md
**Ayaz Family · India–US Cross-Border · Last updated: 2026-04-28**

---

## Current State

**Phase:** Phase 1 complete · Deployed at `https://jawadayaz.github.io/tax-planner/`
**Version:** v1.01
**Last deployed:** 2026-04-29

### What is live
- Dashboard — all obligations per selected year with filed/not-filed status badges; pending items at top, filed at bottom
- Year selector: 2022, 2023, 2024, 2025, 2026 (no 2025 removed — present but 2026 default)
- Seed status data for all years (confirmed from Drive scan 2026-04-28):
  - 2022/2023/2024: all obligations filed
  - 2025: Sakina ✅, Aliza ✅, Salar Trust ✅ filed; Jawad & Chhaya 1040/FBAR in_progress
  - 2026: Form 709 filed; all else not started
- Checklists — per-taxpayer, per-year obligation table with status dropdowns (localStorage-persisted)
- Gift Registry — all 4 Form 709s (2012, 2022, 2023, 2026) with cumulative credit ledger
- Drive Scan — connects via Google OAuth (GIS), scans `US taxes/{year} Taxes/` per-taxpayer subfolder, matches expected documents per member
- Settings — family/entity table, trust beneficiary percentages, Reset All Status
- Auth: Drive OAuth token persisted in localStorage (55 min expiry); silent auto-reconnect on load
- Playwright test suite: 32 tests, all passing (`app-deploy tax-planner test`)

---

## Change Log

**2026-04-28 — Phase 1 built and deployed**
- Initial build: dashboard, checklists, gift registry, drive scan, settings
- Fixed Tailwind CDN @apply incompatibility → plain CSS throughout
- Fixed Drive scan: per-subfolder scan with FOLDER_MAP → keyword matching scoped per member
- Fixed Drive OAuth: localStorage persistence + silent GIS auto-connect on init
- Hardcoded Google client ID from centralized credentials.json; removed manual Settings entry
- STATUS_VER versioning to prevent stale localStorage overriding seed data
- Seed status updated from actual Drive scan (2025: Sakina/Aliza/Salar filed)
- Playwright test suite written; fix loop resolved all failures (32/32)

**2026-04-28 — Project initiated**
- Family tax structure documented from Jawad's requirements
- Phases 1–6 designed
- Integration plan with tax-agent (FBAR) noted for Phase 5 merge

---

## 1. Family Tax Structure

### 1.1 Taxpayers & Obligations

#### Jawad & Chhaya Ayaz (Joint US / Separate India)
| Return | Jurisdiction | Filing status | Key income sources |
|---|---|---|---|
| Form 1040 | US | Married Filing Jointly | US investment income; India income (investment + rental + Mariam Trust K-1); FTC claimed for India taxes paid |
| ITR (Jawad) | India | Individual | India investment + rental + Mariam Trust K-1 distributions; US investment income reported; tax credit claimed for US taxes paid |
| ITR (Chhaya) | India | Individual | India investment + rental + Mariam Trust K-1 distributions; US investment income reported; tax credit claimed for US taxes paid |

#### Sakina Ayaz *(obligations start 2027)*
| Return | Jurisdiction | Filing status | Key income sources |
|---|---|---|---|
| ITR | India (resident) | Individual | India K-1 from Mariam Ayaz Trust; US investment income + Salar Trust K-1 reported with US tax credit claimed |
| Form 1040 | US | Individual | US investment income; Salar Trust K-1; Mariam Ayaz Trust K-1 (India income) with India tax credit (FTC) |

#### Aliza Ayaz *(obligations start 2027)*
| Return | Jurisdiction | Residency | Key income sources |
|---|---|---|---|
| ITR | India (non-resident) | NRI | India K-1 from Mariam Ayaz Trust |
| Form 1040 | US | Individual | US earned income; US investment income; Salar Trust K-1; Mariam Ayaz Trust K-1 (India income) with India FTC |

---

### 1.2 Trusts

#### Salar Holdings Trust — US Trust
| Attribute | Detail |
|---|---|
| Jurisdiction | US |
| Income | US investment income only |
| Beneficiaries | Chhaya 50%, Sakina 25%, Aliza 25% |
| On Chhaya's death | Sakina 50%, Aliza 50% |
| US Return | Filed; nil tax (all income distributed to beneficiaries via K-1) |
| India Return | None — US-only income |
| K-1 recipients | Chhaya (Form 1040), Sakina (Form 1040 + India FTC), Aliza (Form 1040 + India FTC) |

#### Mariam Ayaz Trust — US Trust with India Income
| Attribute | Detail |
|---|---|
| Jurisdiction | US |
| Income | India investment income (starting 2027) |
| Beneficiaries | Jawad 50%, Chhaya 25%, Sakina 12.5%, Aliza 12.5% |
| On Jawad's death | Chhaya 50%, Sakina 25%, Aliza 25% |
| On Chhaya's death (post-Jawad) | Sakina 50%, Aliza 50% |
| US Return | Filed; nil (all income distributed to beneficiaries) |
| India Return | Filed; nil (income distributed on K-1; beneficiaries pay India tax individually) |
| K-1 recipients | Jawad & Chhaya (1040 + India ITR), Sakina (1040 + India ITR), Aliza (1040 + India ITR) |

---

### 1.3 Cross-Border Tax Credit Flow

```
                    ┌─────────────────────────────────────────────────────┐
                    │          DTAA: India–US Tax Treaty                   │
                    └─────────────────────────────────────────────────────┘

India Income Sources                         US Income Sources
────────────────────                         ─────────────────
• Investments (div, cap gain)                • Investments (div, cap gain)
• Rental income                              • Earned income (Aliza)
• Mariam Trust K-1                           • Salar Trust K-1
                                             • Mariam Trust K-1 (India income)
        │                                              │
        ▼                                              ▼
  India ITR                                    US Form 1040
  (Jawad, Chhaya,                              (Jawad & Chhaya joint,
   Sakina, Aliza)                               Sakina, Aliza)
        │                                              │
        │  India taxes paid ──────────────────────────┤
        │  → FTC claimed on 1040 (Form 1116)          │
        │                                             │
        │  US taxes paid ◄────────────────────────────┘
        └► → Tax credit claimed on India ITR

Key principle: Same income is reported in BOTH jurisdictions.
Tax paid in one jurisdiction creates a credit against the other.
```

---

### 1.4 Gift & Estate Documents (already filed)

| Document | Filed by | Location |
|---|---|---|
| Form 709 (2012) | Jawad & Chhaya | Google Drive: 2012 Taxes/Gift Tax/ |
| Form 709 (2022) | Jawad & Chhaya | Google Drive: 2022 Taxes/Jawad.& Chhaya/ |
| Form 709 (2023) | Jawad & Chhaya | Google Drive: 2023 Taxes/Jawad & Chhaya/ |
| Form 709 (2026) | Jawad & Chhaya | Google Drive: 2026 Taxes/Jawad & Chhaya/ |
| Form 3520 | Various | Google Drive: [year] Taxes/[taxpayer]/ |

---

## 2. Document Storage

All tax documents live in Google Drive:
```
My Drive/US taxes/
  {year} Taxes/                   ← e.g. "2024 Taxes"
    Jawad & Chhaya/               ← joint/shared docs
    Aliza/                        ← Aliza's individual docs
    Sakina/                       ← Sakina's individual docs
    Salar Trust/                  ← trust docs
    Mariam Ayaz Trust/            ← trust docs
    FBARs/                        ← FinCEN 114 filings
```

Centralized OAuth credentials: `~/Claude/projects/credentials.json` + `token.json`

---

## 3. Vision

A single dashboard that gives the Ayaz family a real-time view of:
1. **What is filed** — status of every return for every taxpayer for every year
2. **What is due** — upcoming deadlines with checklists
3. **What income flows where** — K-1 distributions, cross-border credits
4. **What is planned** — gift tax, trust distributions, estate changes

Starting point: a static checklist/dashboard. Progressive enhancement toward live document scanning and computation.

---

## 4. Product Phases

### Phase 1 — Dashboard & Checklist *(build first)*
**Goal:** Single-page view of all family tax obligations, status, and deadlines.

Features:
- Family tax map: all taxpayers + entities, relationships, obligations
- Annual checklist per taxpayer (what's filed, what's outstanding, due dates)
- Manual status update (filed / in progress / not started / N/A)
- Google Drive inventory: scan tax folders, detect known document types (1040, ITR, 709, 3520, FBAR, K-1, trust return)
- Document status: found / missing per expected document
- Year selector to navigate across tax years

**Deliverable:** Deployed GitHub Pages app. Static with localStorage persistence. No backend needed initially.

---

### Phase 2 — Income & K-1 Tracker
**Goal:** Track all income streams and K-1 distributions across taxpayers.

Features:
- K-1 register: record distributions from Salar Trust and Mariam Ayaz Trust by year and beneficiary
- Income summary per taxpayer per year (US income, India income, total)
- Cross-border credit tracker: India taxes paid → FTC amount on 1040; US taxes paid → India credit
- Trust distribution calculator: compute each beneficiary's share based on current percentages
- Beneficiary percentage manager (handles death-contingent restructuring)

---

### Phase 3 — Document Parser & Validator
**Goal:** Auto-read filed returns to populate the income tracker.

Features:
- Upload 1040 PDF → extract AGI, total income, FTC claimed, taxes paid
- Upload ITR PDF or XML → extract total income, tax paid, foreign tax credit claimed
- Upload K-1 → extract distributed amounts per beneficiary
- Cross-validate: does 1040 FTC match India ITR taxes paid? Flag discrepancies
- Google Drive scanner: auto-detect and parse new documents added to tax folders

---

### Phase 4 — Gift & Estate Registry
**Goal:** Complete gift and estate planning record integrated with the dashboard.

Features:
- Gift registry: all 709 forms with donee, date, amount, asset, annual exclusion used, taxable gift, cumulative
- Running unified credit ledger per donor (Jawad, Chhaya) showing credit used and remaining
- 3520 registry: gifts from foreign persons, reporting thresholds, filing status
- Trust structure viewer: beneficiary percentages, contingent changes, K-1 history
- Gift planner: "if I gift X to Y this year, what is the tax impact?" (integrates 709 generator built in prior session)

---

### Phase 5 — FBAR Integration & Unified View
**Goal:** Merge tax-agent FBAR functionality into the tax planner.

Features:
- FBAR tab added to dashboard with existing tax-agent match/export workflow
- Unified document store (all returns, FBARs, statements in one view)
- Annual filing timeline: all deadlines across all returns and FBARs in a single calendar
- FATCA threshold monitoring (Form 8938)

---

### Phase 6 — Tax Estimator *(future)*
**Goal:** Real-time estimated liability before filing.

Features:
- Build tax estimate from income tracker data
- DTAA optimization: which income is better sheltered in which jurisdiction
- What-if scenarios: trust distributions, asset sales, new gifts
- Compare estimate against filed return when available

---

## 5. Immediate Build Plan (Phase 1)

### 5.1 Pages / Screens

**Dashboard (home)**
- Family tree widget: boxes for each taxpayer/entity, colored by filing status (green=filed, amber=in progress, red=outstanding, gray=N/A)
- Clicking a box drills into that taxpayer's checklist
- Year selector in top bar

**Taxpayer Checklist**
- List of expected returns for the taxpayer for the selected year
- Each item: return type, jurisdiction, due date, status pill, notes field
- Document section: expected documents (K-1s, 1099s, broker statements, etc.) with found/missing status from Drive scan
- Back to dashboard

**Annual Summary**
- All taxpayers in a table: rows=taxpayers, columns=return types
- Traffic-light status grid
- Outstanding count, next due date

**Gift Registry**
- Table of all 709 forms filed: year, donor, donee, asset, FMV, taxable gift, credit used
- Running credit ledger per donor
- Button to generate a new 709 (links to 709 generator)

**Settings**
- Family member configuration (name, SSN, residency status by year)
- Trust beneficiary percentages with effective dates
- Google Drive folder mapping

### 5.2 Checklists by Taxpayer

#### Jawad & Chhaya — Annual Checklist
```
US Returns:
  □ Form 1040 (joint) — due Apr 15 (Oct 15 with extension)
  □ Form 1040 Schedule B — interest & dividends
  □ Form 1040 Schedule D — capital gains
  □ Form 1116 — Foreign Tax Credit (for India income)
  □ Form 8938 — FATCA (if thresholds met)
  □ FinCEN 114 (FBAR) — due Apr 15 (auto-extended to Oct 15)
  □ Form 3520 — if gifts received from foreign persons

India Returns:
  □ ITR-2 Jawad — due Jul 31 (Oct 31 with extension)
  □ ITR-2 Chhaya — due Jul 31 (Oct 31 with extension)

Gift Tax:
  □ Form 709 — if gifts made exceeding annual exclusion

Income Docs Needed:
  □ US brokerage 1099-CONS (Morgan Stanley)
  □ K-1 from Salar Holdings Trust
  □ K-1 from Mariam Ayaz Trust (starting 2027)
  □ India broker CAS (CDSL/NSDL)
  □ India bank interest certificates
  □ Rental income documentation
  □ India advance tax receipts
```

#### Sakina — Annual Checklist (2027+)
```
US Returns:
  □ Form 1040 — due Apr 15
  □ Schedule B, D — investment income
  □ Form 1116 — FTC for India taxes on Mariam Trust K-1
  □ FinCEN 114 (FBAR) — if India accounts exceed $10k

India Returns:
  □ ITR-2 (resident) — due Jul 31

Income Docs Needed:
  □ K-1 from Salar Holdings Trust (US)
  □ K-1 from Mariam Ayaz Trust (India income)
  □ India broker/bank statements
  □ US brokerage 1099
```

#### Aliza — Annual Checklist (2027+)
```
US Returns:
  □ Form 1040 — due Apr 15
  □ Schedule B, D, wages — all income
  □ Form 1116 — FTC for India taxes on Mariam Trust K-1
  □ FinCEN 114 (FBAR) — if India accounts exceed $10k

India Returns:
  □ ITR-2 (non-resident) — due Jul 31 or Nov 30 if audit required

Income Docs Needed:
  □ W-2 (earned income)
  □ K-1 from Salar Holdings Trust (US)
  □ K-1 from Mariam Ayaz Trust (India income)
  □ India broker statements (for NRI accounts if any)
```

#### Salar Holdings Trust — Annual Checklist
```
US Returns:
  □ Form 1041 — due Apr 15 (usually nil)
  □ Schedule K-1 × 3 — issue to Chhaya, Sakina, Aliza
```

#### Mariam Ayaz Trust — Annual Checklist (2027+)
```
US Returns:
  □ Form 1041 — due Apr 15 (nil; all income distributed)
  □ Schedule K-1 × 4 — issue to Jawad, Chhaya, Sakina, Aliza

India Returns:
  □ India trust return — filed with nil income (all distributed on K-1)
```

---

## 6. Technical Architecture

### Phase 1 — Static GitHub Pages
```
~/Claude/projects/tax-planner/
  index.html          ← single-page app (vanilla JS, no framework)
  CLAUDE.md
  SPEC.md
```

- No backend needed for Phase 1
- State persisted to localStorage
- Google Drive API (client-side GIS token) for folder scanning
- Same OAuth credentials as tax-agent: `~/Claude/projects/credentials.json`

### Phase 2+ — Add Cloudflare Worker
When document parsing is needed (PDF reading, AI extraction):
```
  worker.js           ← Cloudflare Worker
  wrangler.toml
```

Reuse patterns from tax-agent and stock-intel workers.

### Phase 5 — FBAR Integration
Move tax-agent FBAR app into a tab/module within tax-planner. At that point:
- tax-planner becomes the primary family tax app
- tax-agent repo archived or redirected

---

## 7. Data Model (localStorage, Phase 1)

```js
// family_config — one-time setup
{
  members: [
    { id: 'jawad', name: 'Jawad Ayaz', ssn: '...', type: 'individual',
      us_resident: true, india_resident: true },
    { id: 'chhaya', name: 'Chhaya Ayaz', ssn: '...', type: 'individual',
      us_resident: true, india_resident: true },
    { id: 'sakina', name: 'Sakina Ayaz', type: 'individual',
      us_resident: true, india_resident: true, obligations_start: 2027 },
    { id: 'aliza', name: 'Aliza Ayaz', type: 'individual',
      us_resident: true, india_resident_nri: true, obligations_start: 2027 },
    { id: 'salar_trust', name: 'Salar Holdings Trust', type: 'trust',
      jurisdiction: 'US' },
    { id: 'mariam_trust', name: 'Mariam Ayaz Trust', type: 'trust',
      jurisdiction: 'US_with_India_income', obligations_start: 2027 }
  ],
  trust_beneficiaries: {
    salar_trust: [
      { member: 'chhaya', pct: 50, contingent_on: null },
      { member: 'sakina', pct: 25, contingent_on: null },
      { member: 'aliza',  pct: 25, contingent_on: null }
    ],
    mariam_trust: [
      { member: 'jawad',  pct: 50, contingent_on: null },
      { member: 'chhaya', pct: 25, contingent_on: null },
      { member: 'sakina', pct: 12.5, contingent_on: null },
      { member: 'aliza',  pct: 12.5, contingent_on: null }
    ]
  }
}

// filing_status — per year, per member, per return type
{
  2024: {
    jawad_chhaya: {
      us_1040:  { status: 'filed', filed_date: '2025-04-12', notes: '' },
      us_fbar:  { status: 'filed', filed_date: '2025-04-12', notes: '' },
      in_itr_jawad: { status: 'filed', notes: '' },
      in_itr_chhaya: { status: 'filed', notes: '' },
      form_709: { status: 'not_required', notes: '' }
    },
    salar_trust: {
      us_1041: { status: 'filed', notes: 'nil return' }
    }
  }
}

// gift_registry — all Form 709 data
{
  gifts: [
    { year: 2012, donor: 'jawad', donee: 'mariam_trust', asset: 'cash',
      fmv: 975000, annual_excl: 13000, taxable: 962000, credit_used: 290800 },
    { year: 2022, donor: 'jawad', donee: 'sakina', asset: 'AAPL',
      fmv: 245050, split: true, jawad_taxable: 106525, chhaya_taxable: 106525 },
    // ... etc
  ]
}
```

---

## 8. Filing Deadlines Reference

| Return | Normal due date | Extension due date |
|---|---|---|
| Form 1040 (US individual) | April 15 | October 15 |
| FinCEN 114 (FBAR) | April 15 | October 15 (auto) |
| Form 709 (gift tax) | April 15 | October 15 (with 1040 extension) |
| Form 1041 (trust) | April 15 | September 30 |
| Form 3520 | April 15 | October 15 |
| India ITR (individual) | July 31 | October 31 |
| India ITR (audit required) | October 31 | November 30 |
| India Advance Tax Q1 | June 15 | — |
| India Advance Tax Q2 | September 15 | — |
| India Advance Tax Q3 | December 15 | — |
| India Advance Tax Q4 | March 15 | — |

---

## 9. Integration with Existing Tools

### Form 709 Generator (built this session)
- Python scripts in `/tmp/` generate Form 709 PDFs using PyMuPDF
- Phase 4 gift planner will expose a UI that invokes the same logic
- Script template: `fill_2026_corrected.py` (to be versioned into tax-planner)

### FBAR Assistant (tax-agent, v1.03/1.12)
- Currently deployed at `https://jawadayaz.github.io/tax-agent`
- Phase 5 merges this into tax-planner as a tab
- Shared OAuth credentials already at `~/Claude/projects/`
- KV learning data stays in Cloudflare; will be remapped to tax-planner worker namespace at merge time

### CLAUDE.md in Google Drive US taxes folder
- `/My Drive/US taxes/CLAUDE.md` — contains Form 709 conventions, filed return summary, SSNs
- Tax planner reads this as configuration for pre-populating gift registry and taxpayer info

---

## 10. Open Questions (resolve before building Phase 2+)

1. **Mariam Ayaz Trust India income structure** — what type of India income? Rental, equity dividends, or MF? Determines which India tax rules apply and how K-1 should characterize it.
2. **Aliza residency** — NRI for India purposes from which year? Determines ITR form (ITR-2 NRI) and DTAA applicability.
3. **Sakina India residency test** — confirm she meets resident criteria for 2027 (183-day rule) for ITR-2 resident filing.
4. **Mariam Trust India return** — who prepares the India trust return? CA in India or same US CPA?
5. **Form 3520 details** — which gifts and from whom? Needed to pre-populate the registry.
6. **Joint filing vs. separate for India** — India has no joint filing; each spouse files individually. Confirm split of rental income between Jawad and Chhaya on their respective ITRs.
