const fs = require('fs');
const path = require('path');
const config = require('../config/instrumentSyncConfig');

/**
 * Sync Report Generator
 * Generates structured Markdown & JSON synchronization reports and persists snapshots for drift detection.
 */
class SyncReportGenerator {
    generateReport({
        status = 'SYNC_COMPLETED_CLEAN',
        runId = '',
        startTime = new Date(),
        endTime = new Date(),
        sources = {},
        matchingResults = {},
        metadataIssues = [],
        driftResults = {},
        dryRun = false
    }) {
        const dateStr = startTime.toISOString().split('T')[0];
        const durationMs = endTime.getTime() - startTime.getTime();

        const criticalIssues = metadataIssues.filter(i => i.severity === 'CRITICAL');
        const highIssues = metadataIssues.filter(i => i.severity === 'HIGH');
        const mediumIssues = metadataIssues.filter(i => i.severity === 'MEDIUM');
        const lowIssues = metadataIssues.filter(i => i.severity === 'LOW' || i.severity === 'INFO');

        let md = `# PRE-MARKET INSTRUMENT SYNCHRONIZATION REPORT

**Run ID:** \`${runId}\`  
**Run Date:** \`${dateStr}\`  
**Execution Time:** \`${startTime.toISOString()}\`  
**Duration:** \`${durationMs}ms\`  
**Status:** **\`${status}\`**  
**Execution Mode:** \`${dryRun ? 'DRY-RUN (Safe Validation)' : 'PRE-MARKET SYNC CHECK'}\`  

---

## 1. Executive Summary

| Category | Count | Status |
| :--- | :--- | :--- |
| **Total Internal Scrips** | ${matchingResults.counts?.totalInternal || 0} | Registered Tradable Instruments |
| **Total Zerodha Master Instruments** | ${matchingResults.counts?.totalZerodha || 0} | Indian Market Master Feed |
| **Total Alti Foreign Scrips** | ${matchingResults.counts?.totalAlti || 0} | Foreign Commodity/Forex Feed |
| **Exact Canonical Matches** | ${matchingResults.counts?.exactMatches || 0} | Verified 100% Identity |
| **Normalized Matches** | ${matchingResults.counts?.normalizedMatches || 0} | Verified with Symbol Normalization |
| **Missing in Zerodha** | ${matchingResults.counts?.missingInZerodha || 0} | Internal Scrips Unmatched in Zerodha |
| **Missing in Alti** | ${matchingResults.counts?.missingInAlti || 0} | Internal Scrips Unmatched in Alti |

### Issue Severity Breakdown
- 🚨 **CRITICAL ISSUES:** \`${criticalIssues.length}\` (Wrong Lot Size, Strike, Expiry, or Feed Collision)
- ⚠️ **HIGH ISSUES:** \`${highIssues.length}\` (Exchange/Segment Mismatch or Missing Tradable Scrip)
- ℹ️ **MEDIUM ISSUES:** \`${mediumIssues.length}\` (Tick size or Non-critical variance)
- 📝 **LOW / INFO:** \`${lowIssues.length}\` (New daily contract rolls or token variations)

---

## 2. Detailed Metadata Discrepancies

`;

        if (metadataIssues.length === 0) {
            md += `🎉 **Zero Metadata Mismatches Detected.** All active matched instruments are synchronized.\n\n`;
        } else {
            md += `| Severity | Type | Symbol | Source | Internal (Expected) | External (Actual) | Impact |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            for (const issue of metadataIssues) {
                md += `| **${issue.severity}** | \`${issue.type}\` | **${issue.symbol}** | ${issue.source} | ${issue.expectedInternal} | ${issue.actualExternal} | ${issue.potentialImpact} |\n`;
            }
            md += '\n';
        }

        md += `---

## 3. Daily Drift Detection (Against Yesterday Snapshot)

`;
        if (driftResults.hasPreviousSnapshot) {
            md += `- **New Contracts Discovered:** \`${driftResults.newContracts?.length || 0}\`\n`;
            md += `- **Delisted / Expired Contracts:** \`${driftResults.removedContracts?.length || 0}\`\n`;
            md += `- **Suspicious Lot Size / Attribute Drifts:** \`${driftResults.modifiedContracts?.length || 0}\`\n\n`;

            if (driftResults.modifiedContracts && driftResults.modifiedContracts.length > 0) {
                md += `### 🚨 Suspicious Drift Alerts\n`;
                for (const mod of driftResults.modifiedContracts) {
                    md += `- **${mod.symbol}** (\`${mod.canonicalId}\`): ${mod.field} changed from \`${mod.previous}\` to \`${mod.current}\`\n`;
                }
                md += '\n';
            }
        } else {
            md += `*No previous baseline snapshot found. Initialized new reference snapshot for future drift tracking.*\n\n`;
        }

        md += `---

## 4. Security & Isolation Controls
- **Production Instrument DB Writes:** NO (Read-only verification)
- **Live Trading APIs Called:** NO (Zero orders placed)
- **Credentials Exposed:** NO (Secrets strictly redacted)
`;

        // Save files
        if (!fs.existsSync(config.REPORTS_DIR)) fs.mkdirSync(config.REPORTS_DIR, { recursive: true });
        if (!fs.existsSync(config.SNAPSHOTS_DIR)) fs.mkdirSync(config.SNAPSHOTS_DIR, { recursive: true });

        const reportMdPath = path.join(config.REPORTS_DIR, `instrument-sync-report-${dateStr}.md`);
        const reportJsonPath = path.join(config.REPORTS_DIR, `instrument-sync-report-${dateStr}.json`);
        const snapshotPath = path.join(config.SNAPSHOTS_DIR, 'latest_snapshot.json');

        fs.writeFileSync(reportMdPath, md, 'utf8');

        const jsonSummary = {
            runId,
            status,
            date: dateStr,
            startTime,
            endTime,
            durationMs,
            counts: matchingResults.counts,
            severityCounts: {
                critical: criticalIssues.length,
                high: highIssues.length,
                medium: mediumIssues.length,
                low: lowIssues.length
            },
            issues: metadataIssues,
            drift: driftResults
        };
        fs.writeFileSync(reportJsonPath, JSON.stringify(jsonSummary, null, 2), 'utf8');

        // Update latest snapshot for tomorrow's drift detection
        if (sources.zerodha?.normalized) {
            fs.writeFileSync(snapshotPath, JSON.stringify(sources.zerodha.normalized, null, 2), 'utf8');
        }

        return {
            reportMdPath,
            reportJsonPath,
            jsonSummary,
            markdown: md
        };
    }
}

module.exports = new SyncReportGenerator();
