const path = require('path');
const fs = require('fs');
const sourceAnalyzer = require('./analyzers/sourceAnalyzer');
const businessRuleExtractor = require('./extractors/businessRuleExtractor');
const testPlanner = require('./planners/testPlanner');
const testCaseGenerator = require('./generators/testCaseGenerator');
const testWriter = require('./writers/testWriter');
const testRunner = require('./runners/testRunner');
const failureAnalyzer = require('./analyzers/failureAnalyzer');
const reportGenerator = require('./reporters/reportGenerator');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const DEFAULT_TARGETS = [
    'src/utils/equityPnL.js',
    'src/utils/usdPnL.js',
    'src/utils/brokerageHelper.js',
    'src/utils/segmentMargin.js',
    'src/utils/symbolHelper.js',
    'src/services/WeeklySettlementService.js'
];

async function runGeneratorForTarget(targetRelPath) {
    console.log(`\n======================================================`);
    console.log(`🤖 TEST-GENERATOR: Processing "${targetRelPath}"`);
    console.log(`======================================================`);

    // 1. Analyze Source
    console.log(`🔍 [1/6] Analyzing source module...`);
    const analysis = sourceAnalyzer.analyzeModule(targetRelPath, PROJECT_ROOT);

    // 2. Extract Business Rules
    console.log(`📐 [2/6] Extracting business calculation rules...`);
    const businessRules = businessRuleExtractor.extractRules(analysis);
    console.log(`   Domain: ${businessRules.domain} (${businessRules.rulesList.length} rules detected)`);

    // 3. Plan Tests
    console.log(`📋 [3/6] Generating comprehensive test plan & matrices...`);
    const testPlan = testPlanner.createPlan(analysis, businessRules);

    // 4. Generate Test Cases
    console.log(`⚙️  [4/6] Generating independent non-circular test cases...`);
    const testCases = testCaseGenerator.generateTestCases(testPlan);

    // 5. Write Test File
    console.log(`✍️  [5/6] Writing Jest test file...`);
    const writeResult = testWriter.writeTestSuite(testCases, PROJECT_ROOT);
    console.log(`   Created: ${writeResult.relativeTestPath}`);

    // 6. Execute Tests
    console.log(`🚀 [6/6] Executing Jest test suite...`);
    const runResults = testRunner.runTest(writeResult.testFilePath, PROJECT_ROOT);
    console.log(`   Results: Total: ${runResults.numTotalTests}, Passed: ${runResults.numPassedTests}, Failed: ${runResults.numFailedTests}`);

    // 7. Analyze Failures
    const failureAnalysis = failureAnalyzer.analyzeFailures(runResults, testPlan);

    // 8. Generate Report
    const reportMd = reportGenerator.generateReport({
        targetModule: targetRelPath,
        testPlan,
        testCases,
        writeResult,
        runResults,
        failureAnalysis
    });

    const reportsDir = path.join(PROJECT_ROOT, 'test-generator', 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    const reportFileName = `${path.basename(targetRelPath, '.js')}_report.md`;
    const reportPath = path.join(reportsDir, reportFileName);
    fs.writeFileSync(reportPath, reportMd, 'utf8');
    console.log(`📄 QA Report saved: ${path.relative(PROJECT_ROOT, reportPath).replace(/\\/g, '/')}`);

    return {
        targetRelPath,
        runResults,
        failureAnalysis,
        reportPath
    };
}

async function main() {
    const args = process.argv.slice(2);
    let targets = [];

    const targetArg = args.find(a => a.startsWith('--target='));
    if (targetArg) {
        targets.push(targetArg.split('=')[1]);
    } else if (args.includes('--all')) {
        targets = DEFAULT_TARGETS;
    } else {
        targets = ['src/utils/equityPnL.js']; // Default first demo target
    }

    const allResults = [];
    for (const t of targets) {
        try {
            const res = await runGeneratorForTarget(t);
            allResults.push(res);
        } catch (err) {
            console.error(`❌ Error processing target ${t}:`, err.message);
        }
    }

    console.log(`\n======================================================`);
    console.log(`🏁 TEST-GENERATOR: All runs completed!`);
    console.log(`======================================================`);
    allResults.forEach(r => {
        const icon = r.runResults.success ? '✅' : '❌';
        console.log(`${icon} ${r.targetRelPath}: ${r.runResults.numPassedTests}/${r.runResults.numTotalTests} passed`);
    });
}

if (require.main === module) {
    main();
}

module.exports = {
    runGeneratorForTarget,
    DEFAULT_TARGETS
};
