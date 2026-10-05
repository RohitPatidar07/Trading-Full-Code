const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = path.resolve(__dirname, '../../Reports');
if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const htmlFilePath = path.join(REPORTS_DIR, 'Trading_Platform_Code_Audit_Verification_Report.html');
const pdfFilePath = path.join(REPORTS_DIR, 'Trading_Platform_Code_Audit_Verification_Report.pdf');
const mdFilePath = path.join(REPORTS_DIR, 'Trading_Platform_Code_Audit_Verification_Report.md');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Generating comprehensive audit verification report...');

// We will construct the complete HTML with executive styling
const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Trading Platform — Production Code Audit Verification & Gap Analysis</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 12mm 14mm 12mm;
    @bottom-right {
      content: counter(page);
    }
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    font-size: 11px;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }
  .header-card {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .header-card h1 {
    margin: 0 0 6px 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: #f8fafc;
  }
  .header-card .subtitle {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 14px;
  }
  .header-card .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    border-top: 1px solid #334155;
    padding-top: 12px;
    font-size: 11px;
  }
  .meta-grid div strong {
    display: block;
    color: #cbd5e1;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .meta-grid div span {
    color: #ffffff;
    font-weight: 600;
  }
  
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .kpi-box {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px;
    background: #f8fafc;
    text-align: center;
  }
  .kpi-box .val {
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 4px;
  }
  .kpi-box .lbl {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.5px;
  }
  .kpi-box.danger .val { color: #dc2626; }
  .kpi-box.warning .val { color: #d97706; }
  .kpi-box.success .val { color: #16a34a; }
  .kpi-box.info .val { color: #2563eb; }

  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin: 22px 0 12px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-p0 { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
  .badge-p1 { background: #fef3c7; color: #92400e; border: 1px solid #fbbf24; }
  .badge-p2 { background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc; }
  .badge-p3 { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
  
  .badge-open { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
  .badge-fixed { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
  .badge-partial { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 10px;
  }
  th {
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  td {
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }
  
  .code-snippet {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 9px;
    background: #0f172a;
    color: #e2e8f0;
    padding: 8px 10px;
    border-radius: 5px;
    margin: 6px 0;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.4;
  }
  .code-ref {
    font-family: monospace;
    font-weight: bold;
    color: #0369a1;
    background: #f0f9ff;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 9.5px;
  }
  
  .callout-box {
    border-left: 4px solid #ef4444;
    background: #fff5f5;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 14px;
  }
  .callout-box.success {
    border-left-color: #22c55e;
    background: #f0fdf4;
  }
  .callout-box.warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }
  .callout-box h4 {
    margin: 0 0 4px 0;
    font-size: 11px;
    font-weight: 700;
  }
  .page-break {
    page-break-after: always;
    break-after: page;
  }
  .no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .text-muted { color: #64748b; }
  .text-danger { color: #dc2626; font-weight: 600; }
  .text-success { color: #16a34a; font-weight: 600; }
  .text-warning { color: #d97706; font-weight: 600; }
</style>
</head>
<body>

  <!-- PAGE 1: COVER & EXECUTIVE SUMMARY -->
  <div class="header-card">
    <h1>Production Code Audit Verification & Gap Analysis</h1>
    <div class="subtitle">Comprehensive Codebase Re-Assessment Against the 41-Issue Security & Trading Integrity Audit</div>
    <div class="meta-grid">
      <div><strong>Audit Target</strong><span>Backend + Admin Web + WebView + APK</span></div>
      <div><strong>Verification Date</strong><span>October 05, 2026</span></div>
      <div><strong>Original Verdict</strong><span>NOT safe for real money</span></div>
      <div><strong>Current Verdict</strong><span style="color:#ef4444;">NOT SAFE YET (P0 Gaps Remain)</span></div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-box danger">
      <div class="val">32</div>
      <div class="lbl">Still Vulnerable (Open)</div>
    </div>
    <div class="kpi-box success">
      <div class="val">5</div>
      <div class="lbl">Fully Resolved</div>
    </div>
    <div class="kpi-box warning">
      <div class="val">4</div>
      <div class="lbl">Partially Mitigated</div>
    </div>
    <div class="kpi-box info">
      <div class="val">41</div>
      <div class="lbl">Total Issues Tracked</div>
    </div>
  </div>

  <div class="callout-box warning">
    <h4 style="color:#92400e;">Executive Assessment: Progress Achieved vs Critical Blockers Remaining</h4>
    Significant, high-quality progress has been made in the core trading engine: <strong>Race conditions on balance updates and trade square-offs (CON-001 / Bug #8 &amp; Bug #7) have been rigorously solved</strong> using in-memory mutexes (<code>Set</code>) and MySQL row locks (<code>FOR UPDATE</code>). Client-controlled execution prices (<strong>FIN-001</strong>), client P&amp;L forging (<strong>FIN-002</strong>), client lot-size tampering (<strong>FIN-005</strong>), and fractional quantity precision (<strong>DB-001</strong>) are now successfully enforced server-side.
    <br><br>
    <strong>However, critical security perimeter vulnerabilities remain 100% active</strong>:
    Four root AI routes run without login (<strong>SEC-001</strong>); the AI mediator has full LLM-to-SQL execution privileges (<strong>SEC-002</strong>); user listings leak password hashes and plaintext tokens (<strong>SEC-003</strong>); anyone can reset passwords and alter limits due to missing role guards (<strong>SEC-004, SEC-005</strong>); SQL injection exists in user date filters (<strong>SEC-006</strong>); voice audio downloads allow directory traversal to backend <code>.env</code> (<strong>SEC-007</strong>); and the KYC uploads folder is served publicly (<strong>SEC-016</strong>).
  </div>

  <div class="section-title">
    <span>Audit Status Matrix by Priority (Original Audit vs Current Codebase)</span>
    <span style="font-size:10px;color:#64748b;">41 Verified Findings</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 70px;">Priority</th>
        <th style="width: 60px;">Total</th>
        <th style="width: 100px;">Resolved (Fixed)</th>
        <th style="width: 110px;">Partially Fixed</th>
        <th style="width: 110px;">Still Open (Vulnerable)</th>
        <th>Current Risk Profile</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-p0">P0 (Critical)</span></td>
        <td><strong>16</strong></td>
        <td><span class="text-success">4 Fixed (25%)</span></td>
        <td><span class="text-warning">1 Partial (6%)</span></td>
        <td><span class="text-danger">11 Open (69%)</span></td>
        <td>Severe capital theft, unauthorized database execution, credential compromise</td>
      </tr>
      <tr>
        <td><span class="badge badge-p1">P1 (High)</span></td>
        <td><strong>15</strong></td>
        <td><span class="text-success">0 Fixed (0%)</span></td>
        <td><span class="text-warning">1 Partial (7%)</span></td>
        <td><span class="text-danger">14 Open (93%)</span></td>
        <td>Socket spoofing, unauthenticated admin actions, lack of rate limits, IDOR</td>
      </tr>
      <tr>
        <td><span class="badge badge-p2">P2 (Medium)</span></td>
        <td><strong>8</strong></td>
        <td><span class="text-success">1 Fixed (12%)</span></td>
        <td><span class="text-warning">2 Partial (25%)</span></td>
        <td><span class="text-danger">5 Open (63%)</span></td>
        <td>N+1 list queries, unindexed writes, error leakage, public static uploads</td>
      </tr>
      <tr>
        <td><span class="badge badge-p3">P3 (Low)</span></td>
        <td><strong>2</strong></td>
        <td><span class="text-success">0 Fixed (0%)</span></td>
        <td><span class="text-warning">0 Partial (0%)</span></td>
        <td><span class="text-danger">2 Open (100%)</span></td>
        <td>Monolithic controller file sizes, duplicated lot-size lookup dictionaries</td>
      </tr>
      <tr style="font-weight:bold;background:#f1f5f9;">
        <td>TOTAL</td>
        <td>41</td>
        <td><span class="text-success">5 (12.2%)</span></td>
        <td><span class="text-warning">4 (9.8%)</span></td>
        <td><span class="text-danger">32 (78.0%)</span></td>
        <td>Production deployment blocked pending Phase 1 security remediation</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">
    <span>Audit Status Matrix by Category</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th style="width:50px;">Total</th>
        <th style="width:70px;">Fixed</th>
        <th style="width:70px;">Partial</th>
        <th style="width:70px;">Open</th>
        <th>Category Health Verdict</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Security</strong></td>
        <td>21</td>
        <td>0</td>
        <td>0</td>
        <td><span class="text-danger">21</span></td>
        <td><span class="badge badge-open">CRITICAL ATTACK SURFACE</span> — Immediate remediation required</td>
      </tr>
      <tr>
        <td><strong>Trading / Money Correctness</strong></td>
        <td>8</td>
        <td>3</td>
        <td>2</td>
        <td><span class="text-warning">3</span></td>
        <td><span class="badge badge-partial">SUBSTANTIALLY IMPROVED</span> — Core pricing safe; ledger/delete gaps remain</td>
      </tr>
      <tr>
        <td><strong>Reliability</strong></td>
        <td>6</td>
        <td>1</td>
        <td>0</td>
        <td><span class="text-warning">5</span></td>
        <td><span class="badge badge-partial">MODERATE STABILITY</span> — Concurrency safe; fragile crons &amp; single session</td>
      </tr>
      <tr>
        <td><strong>Database</strong></td>
        <td>2</td>
        <td>1</td>
        <td>1</td>
        <td>0</td>
        <td><span class="badge badge-fixed">HEALTHY</span> — Decimal quantities implemented; index hygiene in progress</td>
      </tr>
      <tr>
        <td><strong>Performance</strong></td>
        <td>2</td>
        <td>0</td>
        <td>0</td>
        <td><span class="text-warning">2</span></td>
        <td><span class="badge badge-open">HIGH DB LATENCY</span> — N+1 queries, correlated subqueries, 50MB body limit</td>
      </tr>
      <tr>
        <td><strong>Code Quality</strong></td>
        <td>2</td>
        <td>0</td>
        <td>0</td>
        <td><span class="text-muted">2</span></td>
        <td><span class="badge badge-p3">TECHNICAL DEBT</span> — 3k+ line controllers, hardcoded dictionaries</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- PAGE 2: FULL ISSUE REGISTER - PART 1 (P0 ISSUES) -->
  <div class="section-title">
    <span>Detailed Verification Register: P0 Critical Issues (16 Issues)</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:65px;">ID &amp; Pri</th>
        <th style="width:130px;">Audit Title</th>
        <th style="width:140px;">Code Location</th>
        <th style="width:80px;">Status</th>
        <th>Current Codebase Behavior &amp; Verification Evidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SEC-001</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Four AI routes open with no login</td>
        <td><span class="code-ref">server.js:147-150</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Routes <code>/ai-parse</code>, <code>/execute-command</code>, <code>/smart-command</code>, <code>/master-command</code> are explicitly bound directly on <code>app.post()</code> at root with comment: <em>"// no /api prefix, no auth required for direct access"</em>. Anyone on the internet can invoke voice/master AI without credentials.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-002</strong><br><span class="badge badge-p0">P0</span></td>
        <td>LLM writes &amp; runs raw SQL; no role checks</td>
        <td><span class="code-ref">aiMediator.js:32-95</span><br><span class="code-ref">aiMasterExecutor.js</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>aiMediator.js</code> provides OpenAI Function Calling tools: <code>db_read</code>, <code>db_write</code>, <code>db_transaction</code>, accepting arbitrary raw SQL strings and parameters. A prompt injection via chat or voice command can execute unauthorized <code>UPDATE</code>, <code>DELETE</code>, or <code>DROP</code> statements.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-003</strong><br><span class="badge badge-p0">P0</span></td>
        <td>User endpoints leak password hashes &amp; tokens</td>
        <td><span class="code-ref">userController.js:44</span><br><span class="code-ref">userController:154</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>getUsers</code> runs <code>SELECT u.*</code> which dumps the entire user record, including bcrypt password hashes, <code>transaction_password</code>, and <code>session_token</code>. In addition, <code>getUserProfile</code> (<code>GET /users/:id</code>) performs no ownership or hierarchy check.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-004</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Anyone can change/reset anyone's password</td>
        <td><span class="code-ref">userRoutes.js:21</span><br><span class="code-ref">userController:250</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>router.put('/:id/passwords')</code> uses <code>brokerPermission('createClientsAllowed')</code> which immediately calls <code>next()</code> for any non-BROKER role (e.g. TRADER). Thus any client trader can change passwords on any account. <code>resetPassword</code> executes without current-password verification.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-005</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Any user can edit limits/KYC/brokerage</td>
        <td><span class="code-ref">userRoutes.js:27,28,33</span><br><span class="code-ref">userController.js</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>PUT /:id</code>, <code>PUT /:id/settings</code>, and <code>PUT /:id/documents</code> lack <code>roleMiddleware</code>. Client TRADERS bypass the broker check and can update their own credit limit, modify trading segment permissions, or self-verify KYC status.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-006</strong><br><span class="badge badge-p0">P0</span></td>
        <td>SQL injection in user-list date filter</td>
        <td><span class="code-ref">userController.js:22-29</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Unanchored regex <code>/^\d{4}-\d{2}-\d{2}/.test(fromDate)</code> validates only the date prefix. The raw string is directly concatenated: <code>tradeDateFilter += ' AND ... &gt;= ' + fromDate</code>. An input like <code>2026-01-01' OR 1=1 --</code> injects raw SQL syntax directly.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-007</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Path traversal in voice-audio download</td>
        <td><span class="code-ref">voiceRecordingController.js:216</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>getAudio</code> executes: <code>path.join(__dirname, '../uploads/recordings', filename)</code> without stripping directory traversals or calling <code>path.basename()</code>. An attacker can request <code>/api/ai/voice/audio/..%2F..%2F.env</code> and download all server credentials.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-008</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Any user controls company Zerodha session</td>
        <td><span class="code-ref">kiteRoutes.js:47,50,56</span><br><span class="code-ref">kiteController:139</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>/set-token</code>, <code>/auto-login</code>, and <code>/disconnect</code> have no role checks (any TRADER can call them). In <code>kiteController.callback</code>, the generated Zerodha <code>access_token</code> is echoed directly into public browser HTML inside a <code>&lt;textarea&gt;</code> element.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-009</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Secrets &amp; PII committed; TOTP logged</td>
        <td><span class="code-ref">src/data/kite_session.json</span><br><span class="code-ref">KiteAutoLoginService:202</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Live user credentials (name, email, user_id, active tokens) are committed in <code>src/data/kite_session.json</code>. In <code>KiteAutoLoginService.js:202</code>, the live 6-digit TOTP code is explicitly printed to standard console logs: <code>console.log('[KiteAutoLogin] Generated 6-digit TOTP code: ' + totpCode)</code>.
        </td>
      </tr>
      <tr>
        <td><strong>FIN-001</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Client chooses the execution price</td>
        <td><span class="code-ref">tradeController.js:604-608</span></td>
        <td><span class="badge badge-fixed">RESOLVED</span></td>
        <td>
          <strong>FIXED:</strong> For MARKET orders, client-supplied price is strictly ignored: <code>executionPrice = parseFloat(liveMarketPrice);</code>. If live market data is unavailable from the tick feed, the order is strictly rejected with HTTP 400.
        </td>
      </tr>
      <tr>
        <td><strong>FIN-002</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Client sets PnL &amp; exit price on close</td>
        <td><span class="code-ref">tradeController:2505,2608</span><br><span class="code-ref">TradeService:208,370</span></td>
        <td><span class="badge badge-fixed">RESOLVED</span></td>
        <td>
          <strong>FIXED:</strong> Ownership check prevents closing other users' trades. <code>tradeController</code> passes <code>null</code> for P&amp;L to <code>TradeService.closeTrade</code>. For TRADER requesters, client-sent exit price is discarded and P&amp;L is strictly computed server-side via formula helpers.
        </td>
      </tr>
      <tr>
        <td><strong>FIN-003</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Internal transfer can steal money</td>
        <td><span class="code-ref">portfolioController.js:23-130</span></td>
        <td><span class="badge badge-partial">PARTIALLY FIXED</span></td>
        <td>
          <strong>PARTIALLY FIXED:</strong> Negative amounts, zero amounts, and self-transfers are strictly blocked. Sender and receiver are locked <code>FOR UPDATE</code> in deterministic order. <strong>Remaining:</strong> No hierarchy check prevents transferring funds across unrelated broker hierarchies.
        </td>
      </tr>
      <tr>
        <td><strong>FIN-004</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Broken ledger model creates/destroys money</td>
        <td><span class="code-ref">tradeController.js:2670-2681</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          When an OPEN trade is deleted via <code>deleteTrade</code>, <code>balanceRefund = marginToRefund + pnlToRefund</code> executes <code>UPDATE users SET balance = balance + balanceRefund</code>. Because margin was never debited upon entry, deleting an open trade creates money from nothing with zero ledger row.
        </td>
      </tr>
      <tr>
        <td><strong>FIN-005</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Client-controlled lot size / leverage</td>
        <td><span class="code-ref">tradeController.js:270-279, 1395</span></td>
        <td><span class="badge badge-fixed">RESOLVED</span></td>
        <td>
          <strong>FIXED:</strong> Security guard deletes <code>lot_size_at_entry</code>, <code>leverage_used</code>, <code>margin_used</code>, and <code>exposure</code> from <code>req.body</code>. Lot size is strictly derived from <code>scrip_data</code> / DB cache, and leverage is derived from <code>clientConfig</code>.
        </td>
      </tr>
      <tr>
        <td><strong>CON-001</strong><br><span class="badge badge-p0">P0</span></td>
        <td>Race conditions on balance &amp; close</td>
        <td><span class="code-ref">TradeService.js:90-114</span><br><span class="code-ref">tradeController:1505</span></td>
        <td><span class="badge badge-fixed">RESOLVED</span></td>
        <td>
          <strong>FIXED:</strong> Verified resolved in Bug #7 &amp; Bug #8 audit. Uses fast in-memory mutex <code>this.closingLocks = new Set()</code> to reject concurrent close requests in 0-9ms. Uses MySQL <code>SELECT ... FOR UPDATE</code> with atomic status update guard (<code>affectedRows === 1</code>).
        </td>
      </tr>
      <tr>
        <td><strong>SEC-018</strong><br><span class="badge badge-p0">P0</span></td>
        <td>AI write routes under /api/ai reachable by TRADER</td>
        <td><span class="code-ref">aiRoutes.js:30-36</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Endpoints <code>/api/ai/smart-command</code>, <code>/api/ai/master-command</code>, and <code>/api/ai/mediate</code> require only <code>authMiddleware</code> without <code>roleMiddleware(['ADMIN', 'SUPERADMIN'])</code>. Any trader can execute administrative state changes via the LLM agent.
        </td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- PAGE 3: FULL ISSUE REGISTER - PART 2 (P1 ISSUES) -->
  <div class="section-title">
    <span>Detailed Verification Register: P1 High Priority Issues (15 Issues)</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:65px;">ID &amp; Pri</th>
        <th style="width:130px;">Audit Title</th>
        <th style="width:140px;">Code Location</th>
        <th style="width:80px;">Status</th>
        <th>Current Codebase Behavior &amp; Verification Evidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>REL-005</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Pending/Target-SL monitors can double-execute</td>
        <td><span class="code-ref">PendingOrderService.js:90</span><br><span class="code-ref">TradeService.js:856-909</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>executePendingOrderNetting</code> selects pending trade via <code>SELECT t.* FROM trades t WHERE t.id = ?</code> WITHOUT <code>FOR UPDATE</code> and without an atomic status condition guard (<code>WHERE is_pending = 1</code>). If two ticks trigger concurrently, duplicate executions occur.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-010</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Socket.IO: unauthenticated connect; trusted identity</td>
        <td><span class="code-ref">SocketManager.js:26-48</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          In <code>SocketManager.init()</code>, missing or invalid JWT tokens simply assign <code>socket.user = null</code> and call <code>next()</code>, permitting unauthenticated WebSockets. <code>socket.on('join', ({ userId, role }) =&gt; ...)</code> blindly trusts client input to join arbitrary user/role rooms.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-011</strong><br><span class="badge badge-p1">P1</span></td>
        <td>No rate limiting; login user-enumeration</td>
        <td><span class="code-ref">authController.js:19,25</span><br><span class="code-ref">server.js</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          No <code>express-rate-limit</code> middleware is registered on authentication, order placement, or AI routes. <code>authController.login</code> explicitly returns <code>"User not found"</code> vs <code>"Invalid password"</code>, enabling rapid brute-force username enumeration.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-012</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Weak token lifecycle</td>
        <td><span class="code-ref">auth.js:4</span><br><span class="code-ref">authController.js:77,81</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>authMiddleware</code> accepts tokens from query strings (<code>req.query?.token</code>), leaking credentials into server access logs. JWTs are valid for a fixed 24 hours without rotation, refresh tokens, or revocation blacklists. <code>session_token</code> is stored as plaintext in DB.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-013</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Admin actions with weak/no protection</td>
        <td><span class="code-ref">systemRoutes.js:18</span><br><span class="code-ref">scripTickRoutes.js:22</span><br><span class="code-ref">contractRoutes.js:22-26</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>GET /api/system/debug/refresh-market-data</code> has no auth. <code>POST /api/scrip-ticks/cleanup</code> (spawns 4GB purge worker) has no role check. <code>POST /api/contracts/rollover/*</code> (suggestion &amp; enable next) is completely unauthenticated.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-014</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Missing hierarchy checks (IDOR) across endpoints</td>
        <td><span class="code-ref">userController.js:154</span><br><span class="code-ref">fundRoutes.js</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Endpoints accepting <code>:id</code> (such as <code>GET /users/:id</code>, <code>GET /users/:id/documents</code>, <code>GET /users/:id/weekly-balance</code>) fail to verify that the requesting user owns the resource or has an authorized parent/broker hierarchy relationship.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-015</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Transaction password optional where it matters</td>
        <td><span class="code-ref">tradeController.js:2655,2749</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          In <code>deleteTrade</code> and <code>updateTrade</code>, password validation executes: <code>if (req.user.role !== 'TRADER' &amp;&amp; req.body &amp;&amp; req.body.transactionPassword)</code>. If the admin or attacker simply omits <code>transactionPassword</code> from the JSON body, the check is bypassed entirely.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-016</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Public file serving; KYC stored publicly</td>
        <td><span class="code-ref">server.js:105</span><br><span class="code-ref">utils/imagekit.js</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>app.use('/uploads', express.static(path.join(__dirname, '../uploads')))</code> mounts the entire uploads directory publicly. User Aadhaar cards, PAN cards, and bank statements uploaded locally or via fallback can be downloaded directly via predictable URLs.
        </td>
      </tr>
      <tr>
        <td><strong>SEC-017</strong><br><span class="badge badge-p1">P1</span></td>
        <td>IP spoofing; broken IP logging</td>
        <td><span class="code-ref">server.js:45, 101</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>app.set('trust proxy', true)</code> trusts client-forged <code>X-Forwarded-For</code> headers without hop limits. In line 101, <code>app.use(logIp)</code> is executed before route authentication, where <code>req.user</code> is undefined, leaving IP audit logs incomplete.
        </td>
      </tr>
      <tr>
        <td><strong>FIN-006</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Ledger integrity &amp; absolute balance updates</td>
        <td><span class="code-ref">WeeklySettlementService:383</span><br><span class="code-ref">fundController.js</span></td>
        <td><span class="badge badge-partial">PARTIALLY FIXED</span></td>
        <td>
          <strong>PARTIALLY FIXED:</strong> Weekly settlement overwrite was updated to delta-based update: <code>balance = balance + ?</code>. However, manual admin fund adjustments and trade deletions update balances without creating corresponding double-entry ledger records.
        </td>
      </tr>
      <tr>
        <td><strong>REL-001</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Fragile schedulers</td>
        <td><span class="code-ref">server.js:216-235</span><br><span class="code-ref">KiteAutoLoginService:51</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Independent cron schedules and polling intervals run inside the main process without distributed locking (e.g. Redis or MySQL <code>GET_LOCK</code>). In a clustered or multi-container environment, weekly settlements and auto-logins run simultaneously across instances.
        </td>
      </tr>
      <tr>
        <td><strong>REL-002</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Crash handling &amp; health checks</td>
        <td><span class="code-ref">server.js:8-10, 157-159</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>process.on('uncaughtException')</code> logs errors to console without exiting, leaving node memory and database connection states corrupted. The <code>/health</code> endpoint returns static <code>200 OK</code> without pinging MySQL or validating WebSocket health.
        </td>
      </tr>
      <tr>
        <td><strong>REL-003</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Single global Zerodha session; cross-user fallback</td>
        <td><span class="code-ref">KiteAuthService.js:64-70</span><br><span class="code-ref">kiteService.js</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>kiteService</code> holds a single global token in memory. <code>KiteAuthService.getStatus</code> falls back to <code>getLatestSession()</code>, showing another user's active session state if the querying user has not connected Zerodha.
        </td>
      </tr>
      <tr>
        <td><strong>LOG-001</strong><br><span class="badge badge-p1">P1</span></td>
        <td>Sensitive logging</td>
        <td><span class="code-ref">KiteAutoLoginService:202</span><br><span class="code-ref">authController.js:11</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Live 2FA TOTP codes are printed to stdout on line 202. Login attempt messages print usernames and password lengths. Order execution routes log user balances and full trade request payloads without redaction.
        </td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- PAGE 4: FULL ISSUE REGISTER - PART 3 (P2 & P3 ISSUES) -->
  <div class="section-title">
    <span>Detailed Verification Register: P2 Medium &amp; P3 Low Issues (10 Issues)</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:65px;">ID &amp; Pri</th>
        <th style="width:130px;">Audit Title</th>
        <th style="width:140px;">Code Location</th>
        <th style="width:80px;">Status</th>
        <th>Current Codebase Behavior &amp; Verification Evidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>DB-001</strong><br><span class="badge badge-p2">P2</span></td>
        <td>trades.qty INT vs fractional netting</td>
        <td><span class="code-ref">migrate.js:110</span></td>
        <td><span class="badge badge-fixed">RESOLVED</span></td>
        <td>
          <strong>FIXED:</strong> In <code>migrate.js</code>, <code>trades.qty</code> is defined as <code>DECIMAL(18,4) NOT NULL DEFAULT 0.0000</code>. Fractional quantities from FIFO netting ratios are stored accurately without silent MySQL integer truncation.
        </td>
      </tr>
      <tr>
        <td><strong>DB-002</strong><br><span class="badge badge-p2">P2</span></td>
        <td>Index hygiene</td>
        <td><span class="code-ref">migrate.js:1130-1136</span></td>
        <td><span class="badge badge-partial">PARTIALLY FIXED</span></td>
        <td>
          <strong>PARTIALLY FIXED:</strong> Composite indexes (<code>idx_trades_user_status</code> on <code>user_id, status</code> and <code>idx_users_role_status</code>) have been added. However, redundant single-column indexes on high-write tables still cause unnecessary I/O overhead.
        </td>
      </tr>
      <tr>
        <td><strong>PERF-001</strong><br><span class="badge badge-p2">P2</span></td>
        <td>Heavy list queries; no pagination</td>
        <td><span class="code-ref">userController.js:42-63</span><br><span class="code-ref">requestController:39-49</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>getUsers</code> executes 6 correlated subqueries for every single row returned. <code>getRequests</code> runs N+1 queries in loops to compute withdrawable balances. Neither endpoint supports SQL pagination (<code>LIMIT / OFFSET</code>). Body limit is 50MB.
        </td>
      </tr>
      <tr>
        <td><strong>PERF-002</strong><br><span class="badge badge-p2">P2</span></td>
        <td>Polling load</td>
        <td><span class="code-ref">server.js:217-220</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          The server maintains 4 active polling intervals (RMS 10s, Target/SL 5s, Alerts 3s, Pending 3s), querying MySQL repeatedly instead of triggering price checks on incoming WebSocket tick streams.
        </td>
      </tr>
      <tr>
        <td><strong>ERR-001</strong><br><span class="badge badge-p2">P2</span></td>
        <td>Error leakage</td>
        <td><span class="code-ref">tradeController.js:1760,2645</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Multiple error handlers return <code>{ error: err.message }</code> directly to API clients. When MySQL errors occur, internal table schema, constraint names, and query fragments are leaked to the caller.
        </td>
      </tr>
      <tr>
        <td><strong>DASH-001</strong><br><span class="badge badge-p2">P2</span></td>
        <td>Silent stale-price valuation</td>
        <td><span class="code-ref">RMSService.js:99-110</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          In <code>RMSService.js</code>, if live market price is missing, trade valuation silently falls back to <code>last_market_price</code> or <code>entry_price</code>. This masks feed failures from risk managers and risks incorrect auto-squareoffs.
        </td>
      </tr>
      <tr>
        <td><strong>FE-001</strong><br><span class="badge badge-p2">P2</span></td>
        <td>Frontend token storage &amp; artifacts</td>
        <td><span class="code-ref">Trading_Frontend-main/.env</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          JWT tokens are stored in browser <code>localStorage</code>. The production backend URL (<code>https://trading-backend-production-72ac.up.railway.app</code>) is committed in <code>Trading_Frontend-main/.env</code>. Large build zip files (<code>Trading Frontend.zip</code>, <code>froted.zip</code>) remain committed in git.
        </td>
      </tr>
      <tr>
        <td><strong>APK-001</strong><br><span class="badge badge-p2">P2</span></td>
        <td>Mobile permissions &amp; old-client contract</td>
        <td><span class="code-ref">trading-updated-apk-main/app.json</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          The mobile APK requests excessive Android permissions (<code>RECORD_AUDIO</code>, <code>READ_EXTERNAL_STORAGE</code>, <code>WRITE_EXTERNAL_STORAGE</code>, <code>READ_MEDIA_IMAGES</code>, <code>READ_MEDIA_VIDEO</code>, <code>READ_MEDIA_AUDIO</code>).
        </td>
      </tr>
      <tr>
        <td><strong>REL-004</strong><br><span class="badge badge-p2">P2</span></td>
        <td>No backup/monitoring/deploy config; no tests</td>
        <td><span class="code-ref">tests/unit</span><br><span class="code-ref">sharemarket-aws-backend-master</span></td>
        <td><span class="badge badge-partial">PARTIALLY FIXED</span></td>
        <td>
          <strong>PARTIALLY FIXED:</strong> Unit tests have been introduced for settlement, brokerage, and P&amp;L helpers. <strong>Remaining:</strong> No CI/CD pipelines (<code>.github</code> directory absent), no automated database backup scripts, and no containerization config in repo.
        </td>
      </tr>
      <tr>
        <td><strong>CQ-001</strong><br><span class="badge badge-p3">P3</span></td>
        <td>Huge controllers; junk files; wrong query</td>
        <td><span class="code-ref">tradeController.js:3262 lines</span><br><span class="code-ref">userController.js:840</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          <code>tradeController.js</code> exceeds 3,260 lines; <code>kiteRoutes.js</code> exceeds 2,400 lines. In <code>userController.js:840</code>, <code>recalculateBrokerage</code> treats all fallback trades as MCX using <code>config.mcxBrokerageType</code>. Crash stack dumps (<code>grep.exe.stackdump</code>) exist in repos.
        </td>
      </tr>
      <tr>
        <td><strong>CQ-002</strong><br><span class="badge badge-p3">P3</span></td>
        <td>Duplicated lot-size tables</td>
        <td><span class="code-ref">kiteController.js:4-19</span><br><span class="code-ref">symbolHelper.js:144-190</span></td>
        <td><span class="badge badge-open">STILL OPEN</span></td>
        <td>
          Hardcoded <code>MCX_LOT_SIZES</code> and <code>NFO_LOT_SIZES</code> maps are duplicated across <code>kiteController.js</code>, <code>symbolHelper.js</code>, and frontend code rather than referencing the authoritative <code>scrip_data</code> table.
        </td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- PAGE 5: ARCHITECTURAL DEEP DIVES & RESOLUTION ROADMAP -->
  <div class="section-title">
    <span>Technical Deep Dive on Resolved Items vs Remaining Critical Gaps</span>
  </div>

  <div class="no-break">
    <div class="callout-box success">
      <h4 style="color:#15803d;">✅ Major Milestones Successfully Verified</h4>
      <ul>
        <li><strong>Trading Price Authority (FIN-001):</strong> Verified that MARKET orders in <code>tradeController.js:604-608</code> strictly enforce server-side prices (<code>executionPrice = parseFloat(liveMarketPrice)</code>). Client-supplied pricing is stripped, preventing artificial low-price buys and instant profits.</li>
        <li><strong>P&amp;L Authority &amp; Square-Off Ownership (FIN-002):</strong> Verified that <code>tradeController.closeTrade</code> rejects requests if a TRADER attempts to close a trade owned by another user. Furthermore, P&amp;L is strictly computed by server-side financial engines (<code>commodityLotService</code>, <code>calculateMcxPnL</code>, <code>calculateEquityPnL</code>), ignoring client-supplied P&amp;L values.</li>
        <li><strong>Server-Side Lot Size &amp; Leverage Guard (FIN-005):</strong> Verified that <code>tradeController.js:270-279</code> explicitly strips client-submitted <code>lot_size_at_entry</code>, <code>leverage_used</code>, and <code>exposure</code>, calculating margin requirements strictly from authoritative database settings.</li>
        <li><strong>Concurrency Mutex &amp; Row-Level Locks (CON-001):</strong> Verified that <code>TradeService.js:90-102</code> utilizes an in-memory <code>Set</code> lock (<code>this.closingLocks</code>) to reject concurrent square-off double-clicks in 0-9ms, combined with <code>SELECT ... FOR UPDATE</code> and <code>affectedRows === 1</code> guards at the database layer.</li>
        <li><strong>Fractional Netting Precision (DB-001):</strong> Verified that <code>trades.qty</code> is configured as <code>DECIMAL(18,4)</code> in <code>migrate.js</code>, eliminating silent MySQL integer truncations on partial FIFO closures.</li>
      </ul>
    </div>
  </div>

  <div class="no-break">
    <div class="callout-box" style="border-left-color:#ef4444;background:#fef2f2;">
      <h4 style="color:#b91c1c;">🚨 Urgent Action Items (Must Fix Before Any Real-Money Launch)</h4>
      <ul>
        <li><strong>Disable / Authenticate Root AI Routes (SEC-001, SEC-002, SEC-018):</strong> Remove lines 147-150 in <code>src/server.js</code> (<code>/ai-parse</code>, <code>/execute-command</code>, <code>/smart-command</code>, <code>/master-command</code>). Enforce <code>roleMiddleware(['SUPERADMIN'])</code> on all AI endpoints under <code>/api/ai/*</code> and eliminate raw SQL execution from LLM mediator tools.</li>
        <li><strong>Sanitize User Endpoints &amp; Enforce IDOR Checks (SEC-003, SEC-004, SEC-005, SEC-014):</strong> Replace <code>SELECT u.*</code> in <code>userController.getUsers</code> with explicit column selections (excluding <code>password</code>, <code>transaction_password</code>, and <code>session_token</code>). Add <code>roleMiddleware(['ADMIN', 'SUPERADMIN'])</code> to <code>PUT /:id/passwords</code> and <code>PUT /:id/settings</code> to prevent trader privilege escalation.</li>
        <li><strong>Fix SQL Injection in Date Filters (SEC-006):</strong> In <code>userController.js:22-29</code>, replace string concatenation with parameterized SQL bindings (<code>?</code>) and anchor the date regex: <code>/^\d{4}-\d{2}-\d{2}$/</code>.</li>
        <li><strong>Patch Path Traversal &amp; Protect File Uploads (SEC-007, SEC-016):</strong> In <code>voiceRecordingController.js:216</code>, sanitize filenames using <code>path.basename(filename)</code>. Remove public static serving of <code>/uploads</code> in <code>server.js:105</code> and serve KYC documents only via authenticated endpoints with ownership checks.</li>
        <li><strong>Lock Down Zerodha Admin Endpoints &amp; Remove Committed Secrets (SEC-008, SEC-009):</strong> Restrict <code>/api/kite/set-token</code>, <code>/auto-login</code>, and <code>/disconnect</code> strictly to <code>SUPERADMIN</code>. Remove <code>src/data/kite_session.json</code> from git tracking, rotate API keys, and eliminate TOTP console logging.</li>
        <li><strong>Correct Ledger Invariants on Trade Deletion (FIN-004):</strong> Remove free-money margin refunds in <code>tradeController.deleteTrade</code>, ensuring that balance mutations occur exclusively through immutable, auditable ledger entries.</li>
      </ul>
    </div>
  </div>

  <div class="section-title">
    <span>Phased Remediation Roadmap</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:100px;">Phase</th>
        <th style="width:160px;">Target Items</th>
        <th>Key Actions &amp; Deliverables</th>
        <th style="width:80px;">Estimated Time</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Phase 1: Urgent Security Perimeter</strong></td>
        <td>SEC-001, SEC-002, SEC-003, SEC-004, SEC-005, SEC-006, SEC-007, SEC-008, SEC-009, SEC-018</td>
        <td>
          Delete root AI routes; add role checks on user management routes; parameterize SQL date filters; sanitize audio path traversal; restrict Kite admin routes; rotate secrets and remove TOTP logging.
        </td>
        <td>1 - 2 Days</td>
      </tr>
      <tr>
        <td><strong>Phase 2: Money &amp; Ledger Integrity</strong></td>
        <td>FIN-003, FIN-004, FIN-006, SEC-015, REL-005</td>
        <td>
          Add hierarchy checks to internal transfers; eliminate bogus margin refunds in <code>deleteTrade</code>; make transaction passwords mandatory; lock pending trade netting transitions.
        </td>
        <td>2 - 3 Days</td>
      </tr>
      <tr>
        <td><strong>Phase 3: Network &amp; Session Lockdown</strong></td>
        <td>SEC-010, SEC-011, SEC-012, SEC-013, SEC-016, SEC-017</td>
        <td>
          Enforce token verification on Socket.IO connect; add <code>express-rate-limit</code> to login and orders; implement refresh token rotation; protect <code>/uploads</code> static files; configure trust proxy hop counts.
        </td>
        <td>2 - 3 Days</td>
      </tr>
      <tr>
        <td><strong>Phase 4: Reliability &amp; Performance</strong></td>
        <td>PERF-001, PERF-002, REL-001, REL-002, REL-003, DASH-001, CQ-001, CQ-002</td>
        <td>
          Add SQL pagination to <code>getUsers</code>; decouple polling into tick stream listeners; add MySQL <code>GET_LOCK</code> to schedulers; centralize lot size lookup into single source of truth.
        </td>
        <td>3 - 4 Days</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 24px; text-align: center; color: #64748b; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    <strong>Share Market Simulation Platform</strong> — Independent Codebase Audit &amp; Technical Gap Analysis Report &bull; Generated for Technical Management &bull; Confidential
  </div>

</body>
</html>
`;

fs.writeFileSync(htmlFilePath, reportHTML, 'utf8');
console.log('HTML report generated at:', htmlFilePath);

// Compile markdown summary report as well
const reportMD = `# 🛡️ Production Code Audit Verification & Gap Analysis Report
**Share Market Simulation Platform** — Comprehensive Codebase Audit against 41 Architectural & Security Findings
*Backend (Node/Express/MySQL) · Admin Web (React) · Trader WebView · Mobile APK (React Native/Expo)*
*Date: October 05, 2026*
*Audit Status: 41 Issues Tracked | 5 Resolved | 4 Partially Fixed | 32 Still Open*
*Production Verdict: 🔴 NOT SAFE FOR REAL MONEY YET*

---

## 1. Executive Summary & Comparative Matrix

During this comprehensive code audit verification, all 41 defect items from the production code audit were tested and cross-referenced against the current active codebase across the backend, frontend, webview, and mobile repositories.

### Priority Breakdown
| Priority | Total Issues | Fully Resolved | Partially Mitigated | Still Open / Vulnerable |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Critical)** | 16 | **4 (25%)** | **1 (6%)** | **11 (69%)** |
| **P1 (High)** | 15 | **0 (0%)** | **1 (7%)** | **14 (93%)** |
| **P2 (Medium)** | 8 | **1 (12%)** | **2 (25%)** | **5 (63%)** |
| **P3 (Low)** | 2 | **0 (0%)** | **0 (0%)** | **2 (100%)** |
| **TOTAL** | **41** | **5 (12.2%)** | **4 (9.8%)** | **32 (78.0%)** |

### Category Breakdown
* **Security (21 issues):** 0 Fixed, 21 Still Open 🔴 (Primary attack surface remains exposed)
* **Trading / Money Correctness (8 issues):** 3 Fixed, 2 Partial, 3 Open 🟡 (Core pricing & PnL safe; ledger deletion gaps remain)
* **Reliability (6 issues):** 1 Fixed, 0 Partial, 5 Open 🟡 (Close race condition solved; schedulers & single Kite session open)
* **Database (2 issues):** 1 Fixed, 1 Partial, 0 Open 🟢 (Decimal quantities implemented; composite indexing added)
* **Performance (2 issues):** 0 Fixed, 0 Partial, 2 Open 🔴 (Correlated subqueries, N+1 queries, 50MB body limit)
* **Code Quality (2 issues):** 0 Fixed, 0 Partial, 2 Open ⚪ (Monolithic controllers, duplicate dictionaries)

---

## 2. Verified Resolutions (What Has Been Successfully Fixed)

1. **FIN-001 (Server-Authoritative MARKET Execution Price):**
   * *File:* \`sharemarket-aws-backend-master/src/controllers/tradeController.js:604-608\`
   * *Status:* 🟢 **RESOLVED**
   * *Verification:* MARKET orders strictly enforce \`executionPrice = parseFloat(liveMarketPrice)\`. Client prices are ignored. If live market data is unavailable, orders are strictly rejected with HTTP 400.

2. **FIN-002 (P&L Authority & Square-Off Ownership):**
   * *File:* \`sharemarket-aws-backend-master/src/controllers/tradeController.js:2505-2538, 2608\` and \`src/services/TradeService.js:208, 370\`
   * *Status:* 🟢 **RESOLVED**
   * *Verification:* Strict ownership checks prevent traders from closing trades of other users. Client-sent PnL is passed as \`null\` and computed exclusively on the server via mathematical formula services (\`commodityLotService\`, \`calculateMcxPnL\`, \`calculateEquityPnL\`). Client exit prices are ignored for TRADER roles.

3. **FIN-005 (Client Lot Size & Leverage Stripped):**
   * *File:* \`sharemarket-aws-backend-master/src/controllers/tradeController.js:270-279, 1395\`
   * *Status:* 🟢 **RESOLVED**
   * *Verification:* A security payload guard strips \`lot_size_at_entry\`, \`leverage_used\`, \`exposure\`, and \`margin_used\` from \`req.body\`. Lot size is derived from \`scrip_data\` / DB cache, and leverage is derived from database \`clientConfig\`.

4. **CON-001 (Balance & Trade Close Race Condition):**
   * *File:* \`sharemarket-aws-backend-master/src/services/TradeService.js:90-114\` and \`src/controllers/tradeController.js:1505\`
   * *Status:* 🟢 **RESOLVED**
   * *Verification:* In-memory fast mutex (\`this.closingLocks = new Set()\`) rejects duplicate square-offs in 0-9ms. Pessimistic row locking (\`SELECT ... FOR UPDATE\`) and atomic update validation (\`affectedRows === 1\`) prevent balance duplication and double margin release.

5. **DB-001 (Decimal Quantity Precision):**
   * *File:* \`sharemarket-aws-backend-master/src/config/migrate.js:110\`
   * *Status:* 🟢 **RESOLVED**
   * *Verification:* \`trades.qty\` is defined as \`DECIMAL(18,4) NOT NULL DEFAULT 0.0000\`, preventing silent MySQL integer truncation on fractional netting.

---

## 3. High-Risk Open Findings (Critical Vulnerabilities Remaining)

### 🔴 P0 Security Vulnerabilities:
* **SEC-001 (Unauthenticated Root AI Endpoints):** \`server.js:147-150\` exposes \`/ai-parse\`, \`/execute-command\`, \`/smart-command\`, and \`/master-command\` with zero authentication. Anyone on the internet can call these endpoints.
* **SEC-002 & SEC-018 (LLM Raw SQL Execution):** \`aiMediator.js:32-95\` provides OpenAI tools for \`db_read\`, \`db_write\`, and \`db_transaction\`. \`/api/ai/smart-command\` and \`/mediate\` have no role checks, enabling any trader to run arbitrary SQL against the database.
* **SEC-003 (Credential & Token Leaks):** \`userController.js:44\` executes \`SELECT u.*\`, returning bcrypt password hashes, transaction passwords, and plaintext session tokens to API callers. \`GET /users/:id\` has no ownership checks.
* **SEC-004 & SEC-005 (Unrestricted Password & Setting Resets):** \`userRoutes.js:21, 27, 28, 33\` allows TRADERS to bypass broker permissions, enabling any client to reset any user's password, elevate credit limits, and modify KYC statuses.
* **SEC-006 (SQL Injection in Date Filter):** \`userController.js:22-29\` concatenates unanchored date strings directly into raw SQL queries without parameter binding (\`?\`).
* **SEC-007 (Path Traversal to .env):** \`voiceRecordingController.js:216\` joins unsanitized filenames directly. Requesting \`/api/ai/voice/audio/..%2F..%2F.env\` reads server secrets.
* **SEC-008 & SEC-009 (Zerodha Session Hijack & Committed Secrets):** \`/api/kite/set-token\`, \`/auto-login\`, and \`/disconnect\` are open to traders without \`SUPERADMIN\` guards. Live user session tokens are committed in \`src/data/kite_session.json\`, and live TOTP codes are logged to console.
* **FIN-004 (Money Creation on Trade Delete):** \`tradeController.deleteTrade\` refunds unspent margin on deleted OPEN trades, directly adding fake money to \`users.balance\` without a ledger record.

### 🟠 P1 High-Priority Findings:
* **SEC-010 (Socket.IO Trusted Identity):** Socket connections accept missing/invalid tokens, and client-supplied \`userId\` and \`role\` are blindly trusted for room joining.
* **SEC-011 (No Rate Limiting & User Enumeration):** Login endpoint has no rate limits and returns distinct messages (\`User not found\` vs \`Invalid password\`).
* **SEC-012 (Weak Token Lifecycle):** Accepts tokens in query strings; static 24h JWT with no refresh/revocation; plaintext tokens in DB.
* **SEC-013 (Unprotected Admin Actions):** \`/debug/refresh-market-data\`, \`/api/scrip-ticks/cleanup\`, and \`/api/contracts/rollover/*\` lack proper auth/role guards.
* **SEC-014 (IDOR across Endpoints):** Missing hierarchy verification when accessing user documents, balances, and records.
* **SEC-015 (Optional Transaction Passwords):** \`deleteTrade\` and \`updateTrade\` only check transaction passwords if supplied in the request body.
* **SEC-016 & SEC-017 (Public KYC Uploads & Spoofed IPs):** \`/uploads\` is statically served to the public; \`trust proxy: true\` allows spoofed client IPs.

---

## 4. Prioritized Action Plan

* **Phase 1 (Days 1–2):** Shut down root AI routes (\`server.js\`), enforce \`roleMiddleware\` on user/password routes, anchor and bind SQL date filters, sanitize audio path traversal, and rotate Zerodha credentials.
* **Phase 2 (Days 3–4):** Add hierarchy checks to internal transfers, eliminate bogus margin refunds in \`deleteTrade\`, and mandate transaction passwords on admin adjustments.
* **Phase 3 (Days 5–6):** Implement Socket.IO JWT authentication, add \`express-rate-limit\` on login/order routes, and protect static uploads.
* **Phase 4 (Days 7–8):** Add pagination to \`getUsers\`, unify market data polling with tick feeds, and centralize lot sizes.

---
*Report stored in:* \`Reports/Trading_Platform_Code_Audit_Verification_Report.pdf\` and \`Reports/Trading_Platform_Code_Audit_Verification_Report.md\`
`;

fs.writeFileSync(mdFilePath, reportMD, 'utf8');
console.log('Markdown report generated at:', mdFilePath);

// Now execute Chrome headless to produce the PDF
console.log('Rendering PDF via Headless Chrome...');
const chromeCmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${htmlFilePath}"`;
execSync(chromeCmd);

if (fs.existsSync(pdfFilePath)) {
    const stats = fs.statSync(pdfFilePath);
    console.log(`\n🎉 PDF successfully generated!\nPath: ${pdfFilePath}\nSize: ${stats.size} bytes`);
} else {
    console.error('❌ Failed to generate PDF file.');
}
