const { execSync } = require('child_process');
const path = require('path');

/**
 * Test Runner
 * Executes Jest on the target test file and returns structured execution metrics.
 */
class TestRunner {
    runTest(testPath, projectRoot) {
        const fullTestPath = path.isAbsolute(testPath) ? testPath : path.join(projectRoot, testPath);
        const jestBin = path.join(projectRoot, 'node_modules', '.bin', 'jest');

        try {
            const cmd = `npx jest "${fullTestPath}" --json --runInBand --coverage=false`;
            const output = execSync(cmd, {
                cwd: projectRoot,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            const parsed = JSON.parse(output);
            return this._formatResults(parsed, true);
        } catch (err) {
            if (err.stdout) {
                try {
                    const parsed = JSON.parse(err.stdout);
                    return this._formatResults(parsed, false);
                } catch (_) { }
            }
            return {
                success: false,
                numTotalTests: 0,
                numPassedTests: 0,
                numFailedTests: 1,
                rawError: err.message || String(err),
                testResults: []
            };
        }
    }

    _formatResults(jestJson, isPass) {
        const result = {
            success: jestJson.numFailedTests === 0,
            numTotalTests: jestJson.numTotalTests || 0,
            numPassedTests: jestJson.numPassedTests || 0,
            numFailedTests: jestJson.numFailedTests || 0,
            testResults: []
        };

        if (Array.isArray(jestJson.testResults)) {
            for (const fileRes of jestJson.testResults) {
                for (const a of fileRes.assertionResults || []) {
                    result.testResults.push({
                        title: a.title,
                        status: a.status, // 'passed' or 'failed'
                        ancestorTitles: a.ancestorTitles,
                        failureMessages: a.failureMessages
                    });
                }
            }
        }
        return result;
    }
}

module.exports = new TestRunner();
