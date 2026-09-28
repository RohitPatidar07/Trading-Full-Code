/**
 * Failure Analyzer
 * Analyzes failed tests and categorizes root causes without modifying production code.
 */
class FailureAnalyzer {
    analyzeFailures(runResults, testPlan) {
        const issues = [];

        for (const tr of runResults.testResults || []) {
            if (tr.status === 'failed') {
                const failMsg = (tr.failureMessages || []).join('\n');
                let classification = 'IMPLEMENTATION_BUG';

                if (failMsg.includes('TypeError') || failMsg.includes('is not a function')) {
                    classification = 'INTERFACE_MISMATCH';
                } else if (failMsg.includes('received') && failMsg.includes('expected')) {
                    classification = 'FINANCIAL_CALCULATION_DISCREPANCY';
                }

                issues.push({
                    testTitle: tr.title,
                    ancestors: tr.ancestorTitles,
                    failureMessage: failMsg,
                    classification: classification,
                    recommendation: 'Verify business calculation formula against domain requirements'
                });
            }
        }

        return issues;
    }
}

module.exports = new FailureAnalyzer();
