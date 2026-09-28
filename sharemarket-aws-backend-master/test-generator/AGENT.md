# AGENT SPECIFICATION: `test-generator`
**Role:** Automated Financial & Calculation QA Engineer Agent  
**Location:** `sharemarket-aws-backend-master/test-generator/`  
**PRD Document:** [`PRD.md`](./PRD.md)

---

## 🤖 Agent Purpose
The `test-generator` agent automatically analyzes source code in `src/utils/`, `src/services/`, and `src/controllers/`, extracts financial trading rules, and generates, executes, and audits independent Jest test suites for:
- Realized & Unrealized P&L (NSE Cash, NFO Derivatives, MCX, Forex/Crypto/COMEX)
- Brokerage Calculations (Per Crore Turnover, Per Lot, Unit Mode Proportions)
- Segment Margins & Exposure Divisors (Intraday 500x vs Holding 100x)
- Option Symbol & Contract Parsing (`parseOptionSymbol`, `isOptionsSymbol`)
- Weekly Settlement Date Boundaries (`getWeekBoundaries`)

---

## 📁 Agent Structure
```
test-generator/
├── AGENT.md                       # This Agent Specification File
├── PRD.md                         # Detailed Product Requirement Document
├── index.js                       # Master CLI Entry Point
│
├── analyzers/
│   ├── sourceAnalyzer.js          # Module AST / Signatures / Parameters Analyzer
│   └── failureAnalyzer.js         # Error & Defect Categorization Engine
│
├── extractors/
│   └── businessRuleExtractor.js   # Domain Rules Extractor
│
├── planners/
│   └── testPlanner.js             # Test Matrix Planner (5 categories)
│
├── generators/
│   └── testCaseGenerator.js       # Independent Mathematical Expected Value Derivations
│
├── writers/
│   └── testWriter.js              # Jest Unit Test File Emitter (writes to tests/unit/)
│
├── runners/
│   └── testRunner.js              # Programmatic In-Memory Jest Runner
│
└── reporters/
    └── reportGenerator.js         # Markdown Audit Report Emitter (writes to reports/)
```

---

## 🚀 How to Run This Agent

```powershell
# 1. Run against a specific module:
node test-generator/index.js --target=src/utils/equityPnL.js

# 2. Run against all calculation modules:
node test-generator/index.js --all

# 3. Run all unit tests with Jest:
npm test
```
