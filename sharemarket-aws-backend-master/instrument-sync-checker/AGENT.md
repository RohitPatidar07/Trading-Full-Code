# AGENT SPECIFICATION: `instrument-sync-checker`
**Role:** Pre-Market Instrument Identity, Mapping & Drift Verification Agent  
**Location:** `sharemarket-aws-backend-master/instrument-sync-checker/`  
**PRD Document:** [`PRD.md`](./PRD.md)

---

## 🤖 Agent Purpose
The `instrument-sync-checker` agent runs automatically before the market opens (08:45 AM IST) to synchronize and verify all instruments across:
- **Zerodha / Kite Master Dump** (`data/instruments.json` -> 105,650 contracts)
- **Alti (AllTick) Foreign Scrips** (`commodity_forex_crypto_lot_sizes`)
- **Internal Tradable Registry** (`scrip_data` -> 77,819 scrips)

It detects:
- Lot Size Mismatches (CRITICAL)
- Expiry Date Mismatches (CRITICAL)
- Strike & CE/PE Option Mismatches (CRITICAL)
- Duplicate Contract Mappings (CRITICAL)
- Missing Tradable Scrips in Broker Feeds (HIGH)
- Exchange / Segment Classification Mismatches (HIGH)
- Daily Drift against Reference Snapshots

---

## 📁 Agent Structure
```
instrument-sync-checker/
├── AGENT.md                           # This Agent Specification File
├── PRD.md                             # Detailed Product Requirement Document
├── index.js                           # Master CLI Entry Point
│
├── config/
│   └── instrumentSyncConfig.js        # Environment, Cron (45 8 * * 1-5), Timezone, Thresholds
│
├── normalizers/
│   ├── canonicalInstrument.js         # Standard Canonical Data Model
│   ├── zerodhaNormalizer.js           # Kite Dump & API Normalizer
│   └── altiNormalizer.js              # AllTick Foreign Commodity & Forex Normalizer
│
├── matching/
│   ├── identityBuilder.js             # Contract Identity Key Generator (${EXCHANGE}:${SEGMENT}:...)
│   ├── instrumentMatcher.js           # High-Performance O(1) Map Matching Engine
│   └── ambiguityDetector.js           # Duplicate & Ambiguous Mapping Detector
│
├── comparison/
│   ├── metadataComparator.js          # Attribute Comparator (Lot size, Strike, Expiry, Exchange, Tick)
│   └── driftDetector.js               # Overnight Drift Tracker vs Reference Snapshot
│
├── severity/
│   └── severityClassifier.js          # Severity Classifier (CRITICAL, HIGH, MEDIUM, LOW)
│
├── reporters/
│   └── syncReportGenerator.js         # Markdown & JSON Report Generator (writes to reports/)
│
├── alerts/
│   └── instrumentSyncAlert.js         # Terminal Warning Banner & System Audit Logger
│
├── sources/
│   ├── zerodhaSource.js               # Zerodha Dump & Live Kite Loader
│   ├── altiSource.js                  # Foreign Scrips Loader
│   └── internalSource.js              # Internal scrip_data Loader
│
├── runners/
│   └── syncRunner.js                  # Master Orchestration Pipeline & Cron Service
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

## 🚀 How to Run This Agent

```powershell
# 1. Run Pre-Market Verification (Manual Trigger):
node instrument-sync-checker/index.js

# 2. Run Safe Dry-Run (No logging side-effects):
node instrument-sync-checker/index.js --dry-run

# 3. Start Standalone Pre-Market Daemon Cron:
node instrument-sync-checker/index.js --cron

# 4. Run Automated Jest Test Suite:
npx jest instrument-sync-checker/tests/instrumentSyncChecker.test.js
```
