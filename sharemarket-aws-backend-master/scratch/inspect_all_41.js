const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const FRONTEND_ROOT = path.resolve(__dirname, '../../Trading_Frontend-main');
const WEBVIEW_ROOT = path.resolve(__dirname, '../../Trading_Webview-main');
const APK_ROOT = path.resolve(__dirname, '../../trading-updated-apk-main');

function searchInFile(filePath, regex) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = [];
    lines.forEach((l, i) => {
        if (regex.test(l)) {
            results.push({ line: i + 1, text: l.trim() });
        }
    });
    return results;
}

console.log('=== DEEP VERIFICATION OF REMAINING AUDIT ITEMS ===');

// DB-001: trades.qty INT vs DECIMAL
const migrateContent = fs.readFileSync(path.join(BACKEND_ROOT, 'src/config/migrate.js'), 'utf8');
const tradesTableMatch = migrateContent.match(/CREATE TABLE IF NOT EXISTS trades \([\s\S]*?\);/);
if (tradesTableMatch) {
    const qtyLine = tradesTableMatch[0].split('\n').filter(l => l.includes('qty'));
    console.log('\n[DB-001] trades table qty definition:', qtyLine);
}

// DB-002: Indexes in migrate.js
const addIndexLines = searchInFile(path.join(BACKEND_ROOT, 'src/config/migrate.js'), /addIndex/);
console.log('\n[DB-002] addIndex calls:', addIndexLines.slice(0, 15));

// PERF-001: getUsers pagination & correlated subqueries
const getUsersContent = fs.readFileSync(path.join(BACKEND_ROOT, 'src/controllers/userController.js'), 'utf8');
console.log('\n[PERF-001] getUsers has LIMIT / OFFSET pagination:', /LIMIT|OFFSET/i.test(getUsersContent.slice(0, 3000)));

// PERF-002: Polling intervals in server.js
const pollIntervals = searchInFile(path.join(BACKEND_ROOT, 'src/server.js'), /rmsService\.start|startTargetSLMonitoring|startAlertMonitoring|startPendingOrderMonitoring/);
console.log('\n[PERF-002] Polling services in server.js:', pollIntervals);

// ERR-001: Error leakage err.message
const errLeaks = searchInFile(path.join(BACKEND_ROOT, 'src/controllers/tradeController.js'), /res\.status\(\d+\)\.json\(\{[\s\S]*?error:\s*err\.message/);
console.log('\n[ERR-001] tradeController err.message leakage count:', errLeaks.length, errLeaks.slice(0, 3));

// DASH-001: Silent stale-price fallback
const stalePriceRMS = searchInFile(path.join(BACKEND_ROOT, 'src/services/RMSService.js'), /entry_price|last_market_price/);
console.log('\n[DASH-001] RMSService price fallback:', stalePriceRMS.slice(0, 5));

// FE-001: Frontend token storage & dist.zip / .env
const feEnvExists = fs.existsSync(path.join(FRONTEND_ROOT, '.env'));
const feDistZip = fs.existsSync(path.join(FRONTEND_ROOT, 'dist.zip'));
const feLocalStorage = searchInFile(path.join(FRONTEND_ROOT, 'src/context/AuthContext.jsx'), /localStorage\.setItem\('token'/);
console.log('\n[FE-001] Frontend .env exists:', feEnvExists, 'dist.zip exists:', feDistZip, 'localStorage token:', feLocalStorage);

// APK-001: Mobile permissions in app.json & client-sent prices
const apkAppJson = path.join(APK_ROOT, 'app.json');
let apkPerms = [];
if (fs.existsSync(apkAppJson)) {
    const appJsonObj = JSON.parse(fs.readFileSync(apkAppJson, 'utf8'));
    apkPerms = appJsonObj.expo?.android?.permissions || [];
}
console.log('\n[APK-001] APK Android permissions:', apkPerms);

// REL-004: Backup / monitoring / CI
const gitWorkflowDir = path.join(path.resolve(__dirname, '../../'), '.github');
console.log('\n[REL-004] .github exists:', fs.existsSync(gitWorkflowDir));

// CQ-001: tradeController line count & recalculateBrokerage market_type
const tcLines = fs.readFileSync(path.join(BACKEND_ROOT, 'src/controllers/tradeController.js'), 'utf8').split('\n').length;
const krLines = fs.readFileSync(path.join(BACKEND_ROOT, 'src/routes/kiteRoutes.js'), 'utf8').split('\n').length;
const recalcBrokerage = searchInFile(path.join(BACKEND_ROOT, 'src/controllers/userController.js'), /calculateTradeBrokerage/);
console.log('\n[CQ-001] tradeController lines:', tcLines, 'kiteRoutes lines:', krLines, 'recalcBrokerage:', recalcBrokerage);

// CQ-002: Duplicated lot size tables
const mcxLotsKite = searchInFile(path.join(BACKEND_ROOT, 'src/controllers/kiteController.js'), /MCX_LOT_SIZES/);
const mcxLotsSymbolHelper = searchInFile(path.join(BACKEND_ROOT, 'src/utils/symbolHelper.js'), /DEFAULT_LOT_SIZES|MCX_LOT_SIZES/);
console.log('\n[CQ-002] MCX_LOT_SIZES in kiteController:', mcxLotsKite, 'in symbolHelper:', mcxLotsSymbolHelper);
