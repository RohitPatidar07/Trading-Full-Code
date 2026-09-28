const fs = require('fs');
const path = require('path');

/**
 * Source Analyzer
 * Inspects target modules, extracts exported functions, signatures, parameters, and dependencies.
 */
class SourceAnalyzer {
    analyzeModule(moduleRelativePath, projectRoot) {
        const fullPath = path.isAbsolute(moduleRelativePath) 
            ? moduleRelativePath 
            : path.join(projectRoot, moduleRelativePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Target module not found at: ${fullPath}`);
        }

        const code = fs.readFileSync(fullPath, 'utf8');
        const exportsList = this._extractExports(code, fullPath);
        const dependencies = this._extractDependencies(code);
        const functions = this._extractFunctions(code, exportsList);

        return {
            filePath: fullPath,
            relativePath: path.relative(projectRoot, fullPath).replace(/\\/g, '/'),
            rawCode: code,
            exportsList,
            dependencies,
            functions,
            isCommonJS: code.includes('module.exports') || code.includes('exports.'),
            isESM: code.includes('export default') || code.includes('export const')
        };
    }

    _extractExports(code, fullPath) {
        const exportsFound = [];
        
        // Try require if safe
        try {
            const mod = require(fullPath);
            if (typeof mod === 'function') {
                exportsFound.push({ name: mod.name || 'defaultExport', type: 'function' });
            } else if (typeof mod === 'object' && mod !== null) {
                for (const [key, val] of Object.entries(mod)) {
                    exportsFound.push({
                        name: key,
                        type: typeof val,
                        isFunction: typeof val === 'function'
                    });
                }
            }
        } catch (err) {
            // Fallback to static code parsing if runtime require fails
            const moduleExportMatch = code.match(/module\.exports\s*=\s*\{([^}]+)\}/);
            if (moduleExportMatch) {
                const names = moduleExportMatch[1].split(',').map(s => s.trim()).filter(Boolean);
                names.forEach(n => exportsFound.push({ name: n, type: 'function', isFunction: true }));
            }
        }
        return exportsFound;
    }

    _extractDependencies(code) {
        const deps = [];
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        let match;
        while ((match = requireRegex.exec(code)) !== null) {
            deps.push(match[1]);
        }
        return deps;
    }

    _extractFunctions(code, exportsList) {
        const funcs = [];
        for (const exp of exportsList) {
            if (exp.isFunction !== false) {
                const funcRegex = new RegExp(`(?:function\\s+${exp.name}|const\\s+${exp.name}\\s*=\\s*(?:async\\s*)?\\(([^)]*)\\)|async\\s+function\\s+${exp.name})`, 'm');
                const match = code.match(funcRegex);
                funcs.push({
                    name: exp.name,
                    rawSignature: match ? match[0] : `function ${exp.name}()`
                });
            }
        }
        return funcs;
    }
}

module.exports = new SourceAnalyzer();
