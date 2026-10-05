const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const FRONTEND_ROOT = path.resolve(__dirname, '../../Trading_Frontend-main');
const WEBVIEW_ROOT = path.resolve(__dirname, '../../Trading_Webview-main');
const APK_ROOT = path.resolve(__dirname, '../../trading-updated-apk-main');

function fileContains(filePath, needle) {
    if (!fs.existsSync(filePath)) return { exists: false, matches: [] };
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];
    lines.forEach((line, idx) => {
        if (typeof needle === 'string') {
            if (line.includes(needle)) matches.push({ line: idx + 1, text: line.trim() });
        } else if (needle instanceof RegExp) {
            if (needle.test(line)) matches.push({ line: idx + 1, text: line.trim() });
        }
    });
    return { exists: true, matches, totalLines: lines.length };
}

console.log('=== VERIFYING AUDIT FINDINGS ===\n');

// SEC-001: Root AI routes
const srv = fileContains(path.join(BACKEND_ROOT, 'src/server.js'), /app\.post\('\/(ai-parse|execute-command|smart-command|master-command)'/);
console.log('SEC-001 Root AI routes in server.js:', srv.matches);

// SEC-002: aiMediator raw SQL
const mediator = fileContains(path.join(BACKEND_ROOT, 'src/services/aiMediator.js'), /db_write|db_read|db_transaction/);
console.log('SEC-002 aiMediator tools:', mediator.matches.slice(0, 5));

// SEC-003: getUsers SELECT u.*
const usersCtrl = fileContains(path.join(BACKEND_ROOT, 'src/controllers/userController.js'), /SELECT\s+u\.\*/i);
console.log('SEC-003 getUsers SELECT u.*:', usersCtrl.matches);

// SEC-004: updatePasswords / resetPassword
const userRoutes = fileContains(path.join(BACKEND_ROOT, 'src/routes/userRoutes.js'), /:id\/passwords|:id\/reset-password/);
console.log('SEC-004 userRoutes password routes:', userRoutes.matches);

// SEC-005: updateUser / settings / documents
const userPerms = fileContains(path.join(BACKEND_ROOT, 'src/routes/userRoutes.js'), /:id'|:id\/settings|:id\/documents/);
console.log('SEC-005 userRoutes client settings/docs:', userPerms.matches);

// SEC-006: SQL injection in user-list date filter
const sqlInj = fileContains(path.join(BACKEND_ROOT, 'src/controllers/userController.js'), /tradeDateFilter \+=/);
console.log('SEC-006 tradeDateFilter injection:', sqlInj.matches);

// SEC-007: Path traversal getAudio
const audioTraverse = fileContains(path.join(BACKEND_ROOT, 'src/controllers/voiceRecordingController.js'), /path\.join\(__dirname, '\.\.\/uploads\/recordings', filename\)/);
console.log('SEC-007 audio path traversal:', audioTraverse.matches);

// SEC-008: Kite session control
const kiteCtrl = fileContains(path.join(BACKEND_ROOT, 'src/routes/kiteRoutes.js'), /router\.post\('\/(set-token|disconnect|auto-login)'/);
console.log('SEC-008 kiteRoutes control endpoints:', kiteCtrl.matches);

// SEC-009: kite_session.json & TOTP log
const kiteJsonExists = fs.existsSync(path.join(BACKEND_ROOT, 'src/data/kite_session.json'));
const totpLog = fileContains(path.join(BACKEND_ROOT, 'src/services/KiteAutoLoginService.js'), /Generated 6-digit TOTP code/);
console.log('SEC-009 kite_session.json exists:', kiteJsonExists, 'TOTP log:', totpLog.matches);

// FIN-001: Execution price client chosen in placeOrder
const placeOrderPrice = fileContains(path.join(BACKEND_ROOT, 'src/controllers/tradeController.js'), /executionPrice/);
console.log('FIN-001 tradeController executionPrice:', placeOrderPrice.matches.slice(0, 5));

// FIN-002: Client sets PnL on close
const closePnl = fileContains(path.join(BACKEND_ROOT, 'src/services/TradeService.js'), /providedPnl|pnl/);
console.log('FIN-002 TradeService closeTrade providedPnl:', closePnl.matches.filter(m => m.text.includes('provided') || m.text.includes('pnl') && m.text.includes('body')).slice(0, 5));

// FIN-003: internalTransfer
const transfer = fileContains(path.join(BACKEND_ROOT, 'src/controllers/portfolioController.js'), /internalTransfer/);
console.log('FIN-003 portfolioController internalTransfer:', transfer.matches);

// CON-001 & Bug #8: Trade close race condition & mutex
const closeMutex = fileContains(path.join(BACKEND_ROOT, 'src/services/TradeService.js'), /closingLocks|FOR UPDATE/);
console.log('CON-001 / Bug #8 closeTrade mutex/FOR UPDATE:', closeMutex.matches);

// SEC-010: Socket.IO auth
const socketInit = fileContains(path.join(BACKEND_ROOT, 'src/websocket/SocketManager.js'), /socket\.on\('join'/);
console.log('SEC-010 Socket.IO join:', socketInit.matches);

// SEC-011: Rate limiting
const rateLimit = fileContains(path.join(BACKEND_ROOT, 'src/server.js'), /rate-limit|rateLimit/);
console.log('SEC-011 express-rate-limit in server.js:', rateLimit.matches);

// SEC-012: Token in query string
const queryToken = fileContains(path.join(BACKEND_ROOT, 'src/middleware/auth.js'), /req\.query\?\.token/);
console.log('SEC-012 token in req.query:', queryToken.matches);

// SEC-013: Unprotected admin endpoints
const debugRoute = fileContains(path.join(BACKEND_ROOT, 'src/routes/systemRoutes.js'), /refresh-market-data|cleanup/);
console.log('SEC-013 systemRoutes debug/refresh:', debugRoute.matches);

// FIN-006: Weekly settlement absolute balance
const weeklySettlement = fileContains(path.join(BACKEND_ROOT, 'src/services/WeeklySettlementService.js'), /UPDATE users SET balance =/);
console.log('FIN-006 WeeklySettlementService balance update:', weeklySettlement.matches);

// CQ-001: Controller sizes
const tcStats = fs.statSync(path.join(BACKEND_ROOT, 'src/controllers/tradeController.js'));
const krStats = fs.statSync(path.join(BACKEND_ROOT, 'src/routes/kiteRoutes.js'));
console.log('CQ-001 tradeController size:', tcStats.size, 'kiteRoutes size:', krStats.size);
