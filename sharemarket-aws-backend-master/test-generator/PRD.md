# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Agent: `test-generator` (Automated Financial & Calculation QA Agent)

---

## 1. Executive Overview & Mission
The **`test-generator`** agent is an automated testing and mathematical QA engine specifically designed for the Share Market & Multi-Segment Derivatives Trading Platform.

### Core Mission:
Automatically inspect backend calculation modules, extract trading business rules, generate independent non-circular test matrices (covering Happy Path, Boundaries, Decimal Precision, Lot/Unit Modes, and Regressions), execute tests in an isolated in-memory environment, and generate detailed diagnostic audit reports without modifying production code.

---

## 2. System Architecture & Component Breakdown

```
test-generator/
│
├── index.js                           # Master CLI Orchestrator
├── PRD.md                             # Agent Product Requirement Document
│
├── analyzers/
│   ├── sourceAnalyzer.js              # Module AST & CommonJS Export/Parameter Parser
│   └── failureAnalyzer.js             # Root Cause & Defect Categorization Engine
│
├── extractors/
│   └── businessRuleExtractor.js       # Trading Domain Rules (P&L, Brokerage, Margin, Settlements)
│
├── planners/
│   └── testPlanner.js                 # Multi-Dimensional Test Matrix Planner
│
├── generators/
│   └── testCaseGenerator.js           # Independent Mathematical Derivations & Test Specs
│
├── writers/
│   └── testWriter.js                  # Clean Jest Test Emitter (into tests/unit/*.test.js)
│
├── runners/
│   └── testRunner.js                  # Programmatic Isolated Jest Execution Engine
│
└── reporters/
    └── reportGenerator.js             # Markdown QA Audit Report Generator (into reports/*.md)
```

---

## 3. End-to-End Workflow Pipeline

```text
1. Target Module Ingestion (e.g., src/utils/equityPnL.js)
            │
            ▼
2. Source Analysis (sourceAnalyzer.js)
   - Inspect exports, function signatures, and dependencies
            │
            ▼
3. Business Rule Extraction (businessRuleExtractor.js)
   - Extract domain rules (Turnover vs Lot fees, Leverage divisors, Lot multipliers)
            │
            ▼
4. Test Matrix Planning (testPlanner.js)
   - Generate test categories: Happy Path, Boundary, Precision, Lot/Unit, Regression
            │
            ▼
5. Independent Expected Value Generation (testCaseGenerator.js)
   - Compute independent mathematical values (Zero circular assertions)
            │
            ▼
6. Jest Test Suite Generation (testWriter.js)
   - Write to tests/unit/<module>.test.js
            │
            ▼
7. In-Memory Execution (testRunner.js)
   - Execute npx jest with JSON output capture
            │
            ▼
8. Failure Diagnosis (failureAnalyzer.js)
   - Categorize failures: IMPLEMENTATION_BUG, FINANCIAL_CALCULATION_DISCREPANCY, etc.
            │
            ▼
9. QA Report Generation (reportGenerator.js)
   - Save to test-generator/reports/<module>_report.md
```

---

## 4. Target Modules & Mathematical Formulas

### Priority 1: Indian Equities & Derivatives P&L (`src/utils/equityPnL.js`)
- **NSE Cash / Equities:**
  $$\text{PriceDiff} = \begin{cases} \text{Exit} - \text{Entry} & \text{BUY} \\ \text{Entry} - \text{Exit} & \text{SELL} \end{cases}$$
  $$\text{PnL} = \text{PriceDiff} \times \text{TotalShares}$$
- **MCX Commodities:**
  $$\text{TotalUnits} = \text{LotsCount} \times \text{LotSize}$$
  $$\text{PnL} = \text{PriceDiff} \times \text{TotalUnits}$$

### Priority 2: USD International Segments P&L (`src/utils/usdPnL.js`)
- **Foreign Pairs (XAU/USD, EUR/USD, BTC/USDT):**
  $$\text{PnL}_{\text{USD}} = \text{PriceDiff} \times \text{LotSize} \times \text{Quantity}$$
  $$\text{USD/INR Rate} = \begin{cases} \text{LiveAsk (or Fallback} \times 0.90) & \text{Profit } (\ge 0) \\ \text{LiveBid (or Fallback} \times 1.10) & \text{Loss } (< 0) \end{cases}$$
  $$\text{PnL}_{\text{INR}} = \text{PnL}_{\text{USD}} \times \text{USD/INR Rate}$$
- **Direct Currency Pair (USD/INR):**
  $$\text{PnL}_{\text{INR}} = \text{PriceDiff} \times \text{LotSize} \times \text{Quantity} \quad (\text{USD/INR Rate} = 1)$$

### Priority 3: Centralized Brokerage (`src/utils/brokerageHelper.js`)
- **Turnover Mode (`PER_CRORE`):**
  $$\text{Turnover} = (\text{EntryPrice} + \text{ExitPrice}) \times \text{TotalShares}$$
  $$\text{Brokerage} = \left(\frac{\text{Turnover}}{10,000,000}\right) \times \text{Rate}$$
- **Lot Mode (`PER_LOT`):**
  $$\text{Brokerage} = \text{LotsCount} \times \text{Rate}$$
- **Unit Mode Proportional Fraction:**
  $$\text{Brokerage} = \left(\frac{\text{ActualQty}}{\text{LotSize}}\right) \times \text{Rate}$$

### Priority 4: Segment Margin & Exposure (`src/utils/segmentMargin.js`)
- **Turnover Margin:** $\text{RequiredMargin} = \frac{\text{Price} \times \text{ActualQty}}{\text{ExposureDivisor}}$  
  *(Intraday default: 500x divisor, Holding default: 100x divisor)*
- **Per Lot Margin:** $\text{RequiredMargin} = \text{LotCount} \times \text{LotMargin}[\text{Symbol}][\text{TradeType}]$

### Priority 5: Weekly Settlement Dates (`src/services/WeeklySettlementService.js`)
- Evaluates Monday 00:00:00 (`week_start`) to Sunday 23:59:59 (`week_end`).

---

## 5. Failure Classification Taxonomy

1. **`FINANCIAL_CALCULATION_DISCREPANCY`:** Expected math diverges from function output (e.g. wrong turnover multiplier or missing decimals).
2. **`INTERFACE_MISMATCH`:** Parameter missing or function signature altered.
3. **`BUSINESS_RULE_AMBIGUITY`:** Config precedence conflicts (e.g. scrip rate vs user segment rate).
4. **`REGRESSION_RISK`:** Potential double lot-size multiplication or stock symbol option misclassification.

---

## 6. CLI Usage & Operations

```powershell
# Run against a specific module
node test-generator/index.js --target=src/utils/equityPnL.js

# Run across all calculation targets
node test-generator/index.js --all

# Run generated Jest test suites
npm test
```

---

## 7. Security & Safety Rules

- **Zero Production DB Writes:** Operates in pure unit memory.
- **Zero Real Orders:** Never calls Kite order placement or broker write APIs.
- **No Silent Auto-Fixes:** Failures are reported with evidence in `reports/*.md`, leaving production code unchanged for human review.
