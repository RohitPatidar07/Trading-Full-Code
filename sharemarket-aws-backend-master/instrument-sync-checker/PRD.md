# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Agent: `instrument-sync-checker` (Pre-Market Instrument Identity, Mapping & Drift Verification Agent)

---

## 1. Executive Overview & Mission
The **`instrument-sync-checker`** agent is an automated pre-market monitoring, validation, and drift detection engine for the Share Market Trading Platform.

### Core Mission:
Execute daily before market open (08:45 AM IST) to normalize Zerodha, Alti (AllTick), and internal `scrip_data` instruments into a canonical contract representation, match them with $O(1)$ indexed lookup algorithms, detect contract discrepancies (wrong lot sizes, expiries, strikes, exchanges, or collisions), track daily drift against reference snapshots, and alert operators with detailed audit reports before market opening.

---

## 2. System Architecture & Component Breakdown

```
instrument-sync-checker/
│
├── index.js                           # Master CLI Entry Point
├── PRD.md                             # Agent Product Requirement Document
│
├── config/
│   └── instrumentSyncConfig.js        # Environment, Cron (45 8 * * 1-5), Timezone, Thresholds
│
├── normalizers/
│   ├── canonicalInstrument.js         # Canonical Data Model (Standard fields across sources)
│   ├── zerodhaNormalizer.js           # Kite Dump & API Normalizer
│   └── altiNormalizer.js              # AllTick Foreign Commodity & Forex Normalizer
│
├── matching/
│   ├── identityBuilder.js             # Collision-Free Contract Identity Generator
│   ├── instrumentMatcher.js           # High-Performance O(1) Map Matching Engine
│   └── ambiguityDetector.js           # Duplicate & Ambiguous Mapping Detector
│
├── comparison/
│   ├── metadataComparator.js          # Attribute Comparator (Lot size, Strike, Expiry, Exchange, Tick)
│   └── driftDetector.js               # Overnight Drift Tracker vs Reference Snapshot
│
├── severity/
│   └── severityClassifier.js          # Financial Risk & Severity Rules (CRITICAL, HIGH, MEDIUM, LOW)
│
├── reporters/
│   └── syncReportGenerator.js         # Markdown & JSON Report Generator
│
├── alerts/
│   └── instrumentSyncAlert.js         # Visual Terminal Warning & System Audit Logger
│
├── sources/
│   ├── zerodhaSource.js               # Zerodha Dump (data/instruments.json) & Live Kite Loader
│   ├── altiSource.js                  # Foreign Scrips (commodity_forex_crypto_lot_sizes) Loader
│   └── internalSource.js              # Internal Scrips (scrip_data) Loader
│
├── runners/
│   └── syncRunner.js                  # Master Pipeline Orchestrator & Pre-Market Cron Service
│
├── tests/
│   └── instrumentSyncChecker.test.js  # Automated 16-Scenario Jest Test Suite
│
└── reports/
    ├── instrument-sync-report-YYYY-MM-DD.md
    ├── instrument-sync-report-YYYY-MM-DD.json
    └── snapshots/
        └── latest_snapshot.json       # Daily Baseline Reference Snapshot
```

---

## 3. End-to-End Execution Flow

```text
1. Trigger: Pre-Market Cron (08:45 AM IST) or Manual CLI
                        │
                        ▼
2. Load Sources in Parallel:
   - Zerodha Master (data/instruments.json -> ~105,650 instruments)
   - Alti Foreign Scrips (commodity_forex_crypto_lot_sizes)
   - Internal Tradable Scrips (scrip_data -> ~77,819 instruments)
                        │
                        ▼
3. Canonical Normalization:
   - Convert all feeds into CanonicalInstrument instances
   - Build Canonical ID: ${EXCHANGE}:${SEGMENT}:${UNDERLYING}:${EXPIRY}:${STRIKE}:${TYPE}
                        │
                        ▼
4. High-Speed O(1) Matching:
   - Match internal scrips against Zerodha and Alti Hash Maps
   - Categorize: Exact Match, Normalized Match, Missing, Ambiguous
                        │
                        ▼
5. Metadata & Attribute Comparison:
   - Compare Lot Size, Strike, Expiry, Exchange, Segment, Tick Size
                        │
                        ▼
6. Daily Drift Detection:
   - Compare today's dataset with reports/snapshots/latest_snapshot.json
   - Flag: New Active Contracts, Expired Contracts, Suspicious Lot-Size Drifts
                        │
                        ▼
7. Severity Classification:
   - Assign CRITICAL / HIGH / MEDIUM / LOW / INFO
                        │
                        ▼
8. Audit Report & Alert Dispatch:
   - Write Markdown & JSON reports to instrument-sync-checker/reports/
   - Update latest_snapshot.json
   - Display Pre-Market Warning Banner if CRITICAL or HIGH issues exist
```

---

## 4. Canonical Contract Identity Rules

| Instrument Type | Canonical Identity Format | Real-World Example |
| :--- | :--- | :--- |
| **Equity Cash** | `${EXCHANGE}:EQ:${CLEAN_SYMBOL}` | `NSE:EQ:RELIANCE` |
| **Index / Equity Option**| `${EXCHANGE}:OPT:${UNDERLYING}:${EXPIRY}:${STRIKE}:${TYPE}` | `NFO:OPT:BANKNIFTY:2026-03-26:50000:CE` |
| **Index / Equity Future**| `${EXCHANGE}:FUT:${UNDERLYING}:${EXPIRY}` | `NFO:FUT:NIFTY:2026-03-26` |
| **MCX Commodity Future** | `MCX:FUT:${MCX_BASE_SCRIP}:${EXPIRY}` | `MCX:FUT:CRUDEOIL:2026-03-19` |
| **Foreign COMEX / Forex**| `${EXCHANGE}:${SEGMENT}:${UNDERLYING}` | `COMEX:COMMODITY:XAUUSD` |

---

## 5. Severity & Risk Matrix

| Severity | Issue Type | Why It Matters |
| :--- | :--- | :--- |
| **CRITICAL** | `LOT_SIZE_MISMATCH` | Alters quantity conversion, causing 10x–2500x magnified P&L and Margin discrepancies. |
| **CRITICAL** | `EXPIRY_MISMATCH` | Premature or missed contract auto-square-off. |
| **CRITICAL** | `STRIKE_MISMATCH` / `OPTION_TYPE_MISMATCH` | Wrong market data pricing binds to user order. |
| **CRITICAL** | `DUPLICATE_MAPPING` | Duplicate mapping causes WebSocket broadcast collisions. |
| **HIGH** | `EXCHANGE_MISMATCH` / `SEGMENT_MISMATCH` | Applies incorrect leverage divisors (500x vs 100x) or brokerage mode. |
| **HIGH** | `MISSING_IN_EXTERNAL_SOURCE` | Active internal scrip cannot receive live broker quotes. |
| **MEDIUM** | `TICK_SIZE_MISMATCH` | Limit order rejections on non-standard price steps. |
| **INFO** | `NEW_CONTRACT_DISCOVERED` | Normal weekly/monthly derivative roll introduction. |

---

## 6. CLI Usage & Operations

```powershell
# 1. Run Pre-Market Verification (Manual Trigger):
node instrument-sync-checker/index.js

# 2. Run Safe Dry-Run:
node instrument-sync-checker/index.js --dry-run

# 3. Start Standalone Pre-Market Daemon Cron:
node instrument-sync-checker/index.js --cron

# 4. Run Automated Jest Test Suite:
npx jest instrument-sync-checker/tests/instrumentSyncChecker.test.js
```

---

## 7. Performance & Guardrails

1. **Sub-2-Second Execution:** Indexing ~183,000 combined instruments takes under **1.3 seconds** on standard server hardware.
2. **Strict Read-Only Guarantee:** Executes only `SELECT` queries. Never modifies `scrip_data`, `trades`, or `orders`.
3. **Zero Broker API Write Operations:** Never places real trades or alters remote broker states.
4. **Credential Protection:** All tokens and credentials are automatically redacted from logs and reports.
