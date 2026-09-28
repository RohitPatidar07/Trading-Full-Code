const config = require('../config/instrumentSyncConfig');

/**
 * Instrument Sync Alert Dispatcher
 * Dispatches pre-market alerts if CRITICAL or HIGH instrument discrepancies are found.
 */
class InstrumentSyncAlert {
    async dispatchAlert({ status, issues = [], runId = '', reportPath = '' }) {
        const actionableIssues = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
        
        if (actionableIssues.length === 0 && status === 'SYNC_COMPLETED_CLEAN') {
            return { alerted: false, reason: 'CLEAN_SYNC' };
        }

        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const highCount = issues.filter(i => i.severity === 'HIGH').length;

        console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ 🚨 PRE-MARKET INSTRUMENT SYNC ALERT [${status}]
║ Run ID: ${runId}
║ CRITICAL Issues: ${criticalCount} | HIGH Issues: ${highCount}
║ Report: ${reportPath}
╠══════════════════════════════════════════════════════════════════════════════╣`);

        actionableIssues.slice(0, 10).forEach(issue => {
            console.error(`║ [${issue.severity}] ${issue.symbol} (${issue.type}): ${issue.description}`);
        });

        if (actionableIssues.length > 10) {
            console.error(`║ ...and ${actionableIssues.length - 10} more issues documented in report.`);
        }

        console.error(`╚══════════════════════════════════════════════════════════════════════════════╝\n`);

        // Safe integration with internal system audit logger if available
        try {
            const { logAction } = require('../../src/controllers/systemController');
            if (typeof logAction === 'function') {
                const logMessage = `[PRE-MARKET SYNC ALERT] Status: ${status}, Critical: ${criticalCount}, High: ${highCount}. Report: ${reportPath}`;
                await logAction(0, 'INSTRUMENT_SYNC_ALERT', 'system', logMessage);
            }
        } catch (_) { }

        return {
            alerted: true,
            criticalCount,
            highCount,
            actionableCount: actionableIssues.length
        };
    }
}

module.exports = new InstrumentSyncAlert();
