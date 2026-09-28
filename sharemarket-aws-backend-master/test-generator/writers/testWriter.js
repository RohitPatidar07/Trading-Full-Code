const fs = require('fs');
const path = require('path');

/**
 * Test Writer
 * Emits clean, deterministic Jest test files into tests/unit/ directory.
 */
class TestWriter {
    writeTestSuite(testCasesObj, projectRoot) {
        const testsDir = path.join(projectRoot, 'tests', 'unit');
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }

        const baseName = path.basename(testCasesObj.targetModule, '.js');
        const testFilePath = path.join(testsDir, `${baseName}.test.js`);

        // Compute relative require path from tests/unit/ to the target module
        const moduleAbsPath = path.join(projectRoot, testCasesObj.targetModule);
        let relRequirePath = path.relative(testsDir, moduleAbsPath).replace(/\\/g, '/');
        if (!relRequirePath.startsWith('.')) {
            relRequirePath = `./${relRequirePath}`;
        }

        let content = `/**
 * AUTO-GENERATED TEST SUITE BY test-generator
 * Target: ${testCasesObj.targetModule}
 * Domain: ${testCasesObj.domain}
 * Generated: ${new Date().toISOString()}
 */

const targetModule = require('${relRequirePath}');

describe('${baseName} Financial & Domain Unit Tests', () => {
`;

        for (const suite of testCasesObj.generatedSuites) {
            content += `
    describe('${suite.functionName}()', () => {
`;
            for (const tc of suite.cases) {
                const paramJson = JSON.stringify(tc.params, null, 8);
                content += `        test('${tc.id}: ${tc.description.replace(/'/g, "\\'")}', () => {
            const func = targetModule.${suite.functionName} || targetModule;
            const input = ${paramJson};
            const result = Array.isArray(input) ? func(...input) : func(input);
`;
                if (typeof tc.expected === 'object' && tc.expected !== null) {
                    for (const [k, v] of Object.entries(tc.expected)) {
                        if (typeof v === 'number') {
                            content += `            expect(result.${k}).toBeCloseTo(${v}, 2);\n`;
                        } else {
                            content += `            expect(result.${k}).toEqual(${JSON.stringify(v)});\n`;
                        }
                    }
                } else if (typeof tc.expected === 'number') {
                    content += `            expect(result).toBeCloseTo(${tc.expected}, 2);\n`;
                } else {
                    content += `            expect(result).toEqual(${JSON.stringify(tc.expected)});\n`;
                }

                content += `        });\n\n`;
            }
            content += `    });\n`;
        }

        content += `});\n`;

        fs.writeFileSync(testFilePath, content, 'utf8');
        return {
            testFilePath,
            relativeTestPath: path.relative(projectRoot, testFilePath).replace(/\\/g, '/')
        };
    }
}

module.exports = new TestWriter();
