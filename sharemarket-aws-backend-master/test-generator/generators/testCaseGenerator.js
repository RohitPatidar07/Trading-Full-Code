/**
 * Test Case Generator
 * Converts planned scenarios into structured, non-circular Jest test case specifications.
 */
class TestCaseGenerator {
    generateTestCases(testPlan) {
        const generatedSuites = [];

        for (const suite of testPlan.testSuites) {
            const suiteCases = [];
            for (const scenario of suite.scenarios) {
                suiteCases.push({
                    id: scenario.id,
                    category: scenario.category,
                    description: `[${scenario.category}] ${scenario.desc}`,
                    functionName: suite.functionName,
                    params: scenario.params,
                    expected: scenario.expected
                });
            }
            generatedSuites.push({
                functionName: suite.functionName,
                cases: suiteCases
            });
        }

        return {
            targetModule: testPlan.targetModule,
            domain: testPlan.domain,
            rules: testPlan.rules,
            generatedSuites
        };
    }
}

module.exports = new TestCaseGenerator();
