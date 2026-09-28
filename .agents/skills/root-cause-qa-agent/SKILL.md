---
name: root-cause-qa-agent
description: Synthesizes diagnostic findings from instrument mapping, contract metadata, calculation auditing, and tick data into a rigorous root-cause analysis report before proposing code changes.
---

# Root-Cause QA & Diagnosis Agent Skill

## Overview
Before modifying any mission-critical financial calculations or core order execution code, this skill mandates compiling a structured diagnosis report. This guarantees zero regression risk and preserves accounting integrity.

## Standard Diagnosis Report Schema

Every diagnostic review MUST produce findings using this exact schema:

```markdown
# 🩺 Root-Cause Diagnosis & Audit Report

## 1. Issue Summary
- **Identifier**: [e.g. BUG-LOT-001]
- **Severity**: [Critical / High / Medium / Low]
- **Impact Area**: [Order Quantity / P&L Math / MySQL Performance / Symbol Mapping]
- **Summary**: Concise description of observed behavior vs expected behavior.

## 2. Evidence & Audit Trail
- **Affected Files**: `path/to/file.js:L123-L145`
- **Database Table & Rows**: Table name and example offending row data
- **Sample Payload / Inputs**: The exact JSON or parameters reproducing the bug

## 3. Root Cause Analysis
- Explanation of WHY the fault occurred (e.g. string matching collision, hardcoded array precedence over DB, missing multiplier).

## 4. Proposed Architectural Fix
- Code diff or SQL migration resolving the root cause without side effects.

## 5. Regression Risk Assessment
- Analysis of potential side effects on related subsystems:
  - Impact on existing open trades
  - Impact on weekly settlement ledger
  - Impact on historical reports / statements

## 6. Verification & Test Case
- Automated or manual test verification steps with expected input and assertion.
```

## Report Execution Guidelines
- Prioritize money-impacting discrepancies first (e.g. inverted P&L, negative brokerage, incorrect lots).
- Second priority: MySQL hanging and lock wait timeouts on tick ingestion.
- Third priority: UI display formatting and label consistency.
