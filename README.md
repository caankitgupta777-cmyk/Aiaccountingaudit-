# AI Tally Audit Agent

Production-oriented audit analytics application for Chartered Accountants. Upload Tally CSV/XLS/XLSX data, map columns, standardise the data, classify transactions, run a configurable statutory/tax audit rule engine, detect anomalies, assign risk, drill into findings, and export Excel/PDF reports.

## Rule coverage

The rule catalogue is intentionally configuration-driven (`backend/app/rules.yaml`). It currently provides screening coverage across:

- Income-tax / tax audit: cash expenditure, 269SS/269T/269ST indicators, TDS candidate identification, 40(a)(ia), 43B, 40A(7), 40A(9), 40(b), prohibited-expense indicators and related tax-audit areas.
- TDS: contractor, commission/brokerage, rent, professional/technical fees, 194Q purchase review, 194R benefits/perquisites and non-resident/section 195 review.
- GST: missing GSTIN, ITC blocked-credit indicators, reverse charge, import of services, e-way bill review and invoice-data completeness.
- Companies Act: director loans (s.185), inter-corporate loans/investments/guarantees (s.186), related parties (s.188), director-interest disclosure (s.184), statutory-audit enquiries (s.143), internal financial controls, Schedule III/accounting-standard review, deposits and CSR.
- CARO 2020: statutory-dues and loans/advances screening, with the architecture ready for the remaining CARO clauses.
- Other statutory areas: MSMED delayed-payment review, PF/ESI, bonus/gratuity, FEMA/foreign payments and accounting/ICFR anomaly tests.

### Important audit limitation

The engine is an **audit-screening assistant**, not a legal conclusion engine. Many statutory requirements depend on facts that are not present in a Tally ledger: entity type, turnover, registration status, PAN/residential status, contracts, board approvals, invoices, GST returns, TDS returns, bank statements, statutory registers, due dates and statutory exceptions. Such rules therefore generate a risk finding with an explicit evidence checklist rather than declaring a violation.

The rule pack also records the governing legal reference and applicability. For the income-tax transition, FY 2025-26 tax-audit reporting remains under the Income-tax Act, 1961/Form 3CA-3CD or 3CB-3CD, while the Income-tax Act, 2025 applies to transactions/tax years governed by the new framework from 1 April 2026. The application should therefore be run with the relevant financial/tax year selected in a future version.

## Architecture

```text
frontend/                    React + TypeScript
backend/app/data_import      CSV/XLS/XLSX ingestion + column detection
backend/app/data_cleaning    date/amount/ledger standardisation
backend/app/transaction_classifier
backend/app/rules_engine     YAML rule registry + evaluator
backend/app/anomaly_detection
backend/app/risk_engine
backend/app/reporting        PDF
backend/app/export           Excel
backend/app/core             models/config/logging
```

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Or:

```bash
docker compose up --build
```

## Test

```bash
cd backend
pytest -q
```

## Extending the rule engine

Add a YAML rule to `backend/app/rules.yaml`. Do not put compliance logic in the React UI. Every rule should contain:

- `id`
- `category`
- `title`
- `description`
- `risk`
- `check`
- `legal_reference`
- `source`
- `applicability`
- `evidence_required`
- `recommendation`
- `params`

For production, the next version should add effective-from/effective-to dates and a law-version field so the same transaction can be evaluated under the Income-tax Act 1961, Income-tax Act 2025 and historical GST/Companies Act amendments according to the financial year.

## FY-aware audit framework (v1.1)

The audit run now accepts:
- Financial year: FY2023-24, FY2024-25, FY2025-26, FY2026-27
- Entity type: company, firm, LLP, individual, HUF, trust, AOP/BOI
- Accounting basis: mercantile or cash

The engine carries a law-version context into rule execution. FY2025-26 / AY2026-27 continues to use the Income-tax Act, 1961 and Form 3CA/3CB + 3CD. FY2026-27 is exposed as Tax Year 2026-27 under the Income-tax Act, 2025 and Form 26. The application intentionally does not treat a new-Act run as an old-Act Form 3CD filing.

### Audit checklists

- `/api/audit/checklists` returns a structured Form 3CD clause-by-clause checklist and CARO 2020 clause-by-clause checklist.
- Form 3CD includes clauses 1-44, including 8A, 29A/29B, 30A/30B/30C and 36A/36B, with clause 36 marked obsolete in the checklist.
- CARO 2020 includes clauses 3(i) through 3(xxi).
- Each checklist item identifies whether the agent can automate it, needs reconciliation/semi-automation, or requires manual auditor evidence.

### Important audit design

This is a CA decision-support/screening engine. A Tally ledger alone cannot prove every statutory conclusion. Findings therefore retain legal reference, source, applicability, evidence required, and related Form 3CD/CARO clause metadata. Threshold rules that legally depend on aggregation are marked for aggregation/reconciliation before conclusion.

### Official framework references

The implementation is aligned to the Income Tax Department's current Form 3CD guidance and current tax-year transition guidance, and CARO 2020. Government guidance should always be checked for amendments before signing an audit report.
