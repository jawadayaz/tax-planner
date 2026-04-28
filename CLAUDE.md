# tax-planner — CLAUDE.md

## Specification
Read `SPEC.md` before starting any task. It is the authoritative reference for the family tax structure, phase plan, and build sequence.

After every deploy, update `SPEC.md`:
- `## Current State` — what is live, what phase, current version
- `## Change Log` — dated entry per deploy
- Keep built vs planned clearly separated

## Purpose
Comprehensive family tax planner for the Ayaz family (Jawad, Chhaya, Sakina, Aliza) covering:
- US and India cross-border tax obligations
- Salar Holdings Trust and Mariam Ayaz Trust
- Gift tax (Form 709), FBAR, and foreign trust (Form 3520) tracking
- Filing status dashboard, checklists, and K-1/income tracking

## Build Sequence
1. Phase 1 — Static GitHub Pages dashboard + checklist (no backend)
2. Phase 2 — Income & K-1 tracker (still static, localStorage)
3. Phase 3 — Document parser (add Cloudflare Worker for PDF/AI)
4. Phase 4 — Gift & estate registry (integrate 709 generator)
5. Phase 5 — FBAR merge (absorb tax-agent functionality)
6. Phase 6 — Tax estimator (DTAA optimization)

## Related Projects
- `tax-agent` — FBAR assistant (separate for now; merge at Phase 5)
  - Deployed: `https://jawadayaz.github.io/tax-agent`
  - Worker: `tax-agent-worker.jawadayaz.workers.dev`
- Form 709 generator: Python/PyMuPDF scripts — see `/My Drive/US taxes/CLAUDE.md`

## OAuth / Credentials
- Centralized credentials: `~/Claude/projects/credentials.json` + `token.json`
- Same client used by tax-agent Gmail scanner — do NOT create a separate OAuth client
- Scopes needed for Phase 1+: `drive.readonly` (file listing + metadata)
- Scopes needed for Phase 3+: `drive.readonly` + `gmail.readonly`

## Document Locations
- Google Drive: `My Drive/US taxes/{year} Taxes/{taxpayer}/`
- Tax year folder naming varies slightly:
  - "Jawad.& Chhaya" (2022), "Jawad & Chhaya" (2023+)
  - "Aliza", "Sakina", "Salar Trust", "Mariam Ayaz Trust", "FBARs"

## Key Family Facts (for context — authoritative source is SPEC.md)
- Jawad SSN: 465-85-0134 / Chhaya SSN: 466-99-9530
- Address: 84 3rd Main, Defence Colony, Indiranagar, Bengaluru 560038, India
- Salar Holdings Trust: Chhaya 50%, Sakina 25%, Aliza 25%
- Mariam Ayaz Trust: Jawad 50%, Chhaya 25%, Sakina 12.5%, Aliza 12.5%
- Prior taxable gifts (cumulative through 2023): Jawad $548,350 / Chhaya $548,350
- Sakina and Aliza obligations start: 2027
- Mariam Ayaz Trust India income obligations start: 2027

## Deployment
```bash
app-deploy tax-planner          # GitHub Pages deploy
app-deploy tax-planner test     # deploy + Playwright tests
```

Phase 3+ (when Worker added):
```bash
npx wrangler deploy             # production Worker
npx wrangler deploy --env preview  # preview Worker
```

## secure flag
app-deploy does NOT need `secure` flag — this is a private family tool accessed directly, not publicly indexed.
