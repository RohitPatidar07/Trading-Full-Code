# 📱 MaintenX OS – Complete UI/UX Wireframe & Design Architecture
**Document Version:** 2.0 (Exhaustive UI Specification)  
**Target Platforms:** Desktop Web Admin, Mobile Trader APK (React Native), Responsive Webview  
**Design Standards:** Dark Theme First, High-Contrast Financial Typography, Sub-Second Micro-Animations  

---

## 1. Web Admin Portal Wireframes (`Trading_Frontend-main`)

### 1.1 Master Dashboard & Live M2M Matrix (`LiveM2MPage.jsx`)
```
+-----------------------------------------------------------------------------------------------------------------------+
| [LOGO] MAINTENX OS | [Q Search Client / Scrip...] | Market Status: OPEN 🟢 | IST: 14:32:10 | User: superadmin | [Logout] |
+-----------------------------------------------------------------------------------------------------------------------+
| SIDEBAR                    | MAIN VIEWPORT: REAL-TIME LIVE M2M MONITOR                                                |
|                            |                                                                                          |
| 📊 DASHBOARDS              | +--------------------------------------------------------------------------------------+ |
|   • Live M2M Matrix        | | SUMMARY METRICS                                                                      | |
|   • Broker M2M Summary     | | [ Active Traders: 184 ]  [ Total Margin: ₹1.42 Cr ]  [ Net Server M2M: +₹2,48,120 🟢 ] | |
|   • Kite Status (Connected)| +--------------------------------------------------------------------------------------+ |
|                            |                                                                                          |
| 👥 CLIENT MANAGEMENT       | +--------------------------------------------------------------------------------------+ |
|   • Trading Clients (142)  | | FILTERS: [ Broker: All v ] [ Segment: All v ] [ Status: Active v ] [ Refresh: AUTO ]| |
|   • Create Client          | +--------------------------------------------------------------------------------------+ |
|   • KYC Approvals (4)      | | LIVE TRADER MATRIX TABLE                                                             | |
|                            | | Client ID | Trader Name | Broker   | Open Pos | Margin Used | Balance  | Live M2M   | Act | |
| 📈 TRADES & POSITIONS      | |-----------+-------------+----------+----------+-------------+----------+------------+-----| |
|   • Active Positions (82)  | | #16       | rohit_trade | Alpha_Br | 2 Lots   | ₹90,000     | ₹1,45,000| +₹12,450 🟢| [x] | |
|   • Closed Trades          | | #41       | ankit_inv   | Beta_Br  | 1 Lot    | ₹45,000     | ₹82,000  | -₹4,200  🔴| [x] | |
|   • Pending Limit Orders   | | #58       | sumit_mcx   | Direct   | 4 Lots   | ₹1,80,000   | ₹1,95,000| -₹18,500 🔴| [!] | |
|                            | +--------------------------------------------------------------------------------------+ |
| 💳 FUND LEDGER             |                                                                                          |
|   • Deposit Requests (2)   | * Note: Row #58 is highlighted in RED [!] due to Margin Utilization reaching 88.4%.      |
|   • Withdrawals (1)        | [ Action Buttons: [ EMERGENCY SQUARE-OFF ALL POSITIONS ]  [ EXPORT TO EXCEL / PDF ] ]    |
|   • Double-Entry Ledger    +------------------------------------------------------------------------------------------+
|                            | AUDIT TRAIL TICKER                                                                       |
| ⚙️ SYSTEM SETTINGS         | [14:31:50] Trader #16 placed BUY 1 Lot GOLD @ 72,540                                     |
|   • Expiry Rules           | [14:30:12] Admin approved deposit ₹50,000 for Trader #41                                 |
+----------------------------+------------------------------------------------------------------------------------------+
```

---

### 1.2 Client Management & Detail View (`TradingClientsPage.jsx`)
```
+-----------------------------------------------------------------------------------------------------------------------+
| CLIENT MANAGEMENT > CLIENT DETAILS (#16: rohit_trader)                                                                |
+-----------------------------------------------------------------------------------------------------------------------+
| [ PROFILE TAB ]   [ SEGMENT RULES TAB ]   [ FINANCIAL LEDGER TAB ]   [ AUDIT LOG TAB ]                                |
+-----------------------------------------------------------------------------------------------------------------------+
| CLIENT GENERAL INFORMATION                                                                                            |
| Full Name:      Rohit Patidar                     Username:       rohit_trader                                        |
| Mobile:         +91 9876543210                    Email:          rohit@trading.com                                   |
| Parent Broker:  Alpha Broker (#12)                Account Status: [ Active 🟢 ]                                        |
| Available Cash: ₹1,45,000.00                      Credit Limit:   ₹50,000.00                                          |
| Total Margin:   ₹90,000.00 (In 2 Open Trades)     Exposure Factor: 500x                                               |
+-----------------------------------------------------------------------------------------------------------------------+
| SEGMENT PERMISSIONS & BROKERAGE CONFIGURATION                                                                         |
| Segment  | Status  | Brokerage Type | Rate Value | Max Lot/Order | Intraday Leverage | Holding Margin | Auto-Squareoff |
|----------+---------+----------------+------------+---------------+-------------------+----------------+----------------|
| MCX      | [x] ON  | PER_LOT        | ₹20.00     | 10 Lots       | 500x              | 100x           | 23:15 IST      |
| EQUITY   | [x] ON  | PER_CRORE      | ₹800.00    | 500 Shares    | 500x              | 100x           | 15:15 IST      |
| OPTIONS  | [x] ON  | PER_LOT        | ₹50.00     | 20 Lots       | 100x              | 50x            | 15:15 IST      |
| CRYPTO   | [ ] OFF | PER_CRORE      | ₹800.00    | 2 Lots        | 50x               | 20x            | 23:59 IST      |
+-----------------------------------------------------------------------------------------------------------------------+
| [ BUTTONS: [ SAVE SETTINGS ]   [ RESET ACCOUNT ]   [ RECALCULATE BROKERAGE ]   [ SUSPEND TRADING ] ]                  |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Mobile Trader App Wireframes (`trading-updated-apk-main`)

### 2.1 Tab 1: Watchlist Screen (`DashboardScreen.js`)
```
+--------------------------------------------------+
|  MaintenX Trader              [⚡ Search] [🔔 2] |
+--------------------------------------------------+
|  [ ALL ]  [ MCX ]  [ NIFTY 50 ]  [ CRYPTO ]  [ + ]|
+--------------------------------------------------+
|  GOLD 26MAY FUT                             MCX  |
|  ₹72,540.00                               +1.2%  |
|  Bid: 72,538.00 | Ask: 72,542.00        🟢 Vol:14k|
|  H: 72,800.00   | L: 72,100.00          C: 72,450|
+--------------------------------------------------+
|  CRUDEOIL 19JUN FUT                         MCX  |
|  ₹6,540.00                                -0.4%  |
|  Bid: 6,539.00  | Ask: 6,541.00         🔴 Vol:84k|
|  H: 6,610.00    | L: 6,480.00           C: 6,510 |
+--------------------------------------------------+
|  RELIANCE                                   NSE  |
|  ₹2,845.50                                +0.8%  |
|  Bid: 2,845.00  | Ask: 2,846.00         🟢 Vol:1.2M|
|  H: 2,860.00    | L: 2,820.00           C: 2,830 |
+--------------------------------------------------+
|  BTC/USD                                 CRYPTO  |
|  $85,578.00                               +2.4%  |
|  Bid: 85,575.00 | Ask: 85,580.00        🟢 Vol:4.8k|
+--------------------------------------------------+
|                                                  |
|                   [ 🎙️ Speak Order ]             |
+--------------------------------------------------+
|  [ Watchlist ]   [ Trades ]   [ Portfolio ] [Acc]|
+--------------------------------------------------+
```

---

### 2.2 Order Placement Modal (Bottom Sheet Slide-Up)
```
+--------------------------------------------------+
|  BUY GOLD 26MAY FUT                        [ X ] |
|  Exchange: MCX | Lot Size: 100 Multiplier        |
+--------------------------------------------------+
|  ACTION TYPE:                                    |
|  [  (•) BUY (Selected)  ]   [   ( ) SELL      ]  |
+--------------------------------------------------+
|  ORDER TYPE:                                     |
|  [ (•) MARKET ]     [ ( ) LIMIT ]     [ ( ) SL ]  |
+--------------------------------------------------+
|  LOT QUANTITY:                                   |
|  [ - ]               [   1   ]            [ + ]   |
|  (Total Units: 100 Shares / Units)               |
+--------------------------------------------------+
|  EXECUTION PRICE:                                |
|  [ 72,540.00 (Current Live Ask Rate)           ] |
+--------------------------------------------------+
|  OPTIONAL TRIGGER TARGETS:                       |
|  Stop-Loss: [ 72,400.00 ]  Target: [ 72,800.00 ] |
+--------------------------------------------------+
|  MARGIN & BALANCE SUMMARY:                       |
|  Required Margin:    ₹14,508.00                  |
|  Available Cash:     ₹1,45,000.00                |
|  Remaining Free:     ₹1,30,492.00                |
+--------------------------------------------------+
|          [ >>> CONFIRM & PLACE BUY ORDER <<< ]   |
+--------------------------------------------------+
```

---

### 2.3 Tab 3: Live Portfolio & M2M Screen (`PortfolioScreen.js`)
```
+--------------------------------------------------+
|  PORTFOLIO OVERVIEW                              |
|  Total Net M2M:     +₹12,450.00 🟢               |
|  Realized P/L:       +₹4,200.00                  |
|  Margin Locked:      ₹90,000.00                  |
|  Available Balance:  ₹55,000.00                  |
+--------------------------------------------------+
|  OPEN POSITIONS (2)                              |
+--------------------------------------------------+
|  GOLD 26MAY                                  BUY |
|  1 Lot (100 Qty)   |  Entry: ₹72,450.00          |
|  Current LTP: ₹72,540.00 (+90.00)                |
|  M2M P/L: +₹9,000.00 🟢                          |
|  Margin Used: ₹45,000.00                         |
|  [ Square Off ]           [ Edit SL / Target ]   |
+--------------------------------------------------+
|  CRUDEOIL 19JUN                             SELL |
|  1 Lot (100 Qty)   |  Entry: ₹6,574.50           |
|  Current LTP: ₹6,540.00 (-34.50)                 |
|  M2M P/L: +₹3,450.00 🟢                          |
|  Margin Used: ₹45,000.00                         |
|  [ Square Off ]           [ Edit SL / Target ]   |
+--------------------------------------------------+
|  [ Watchlist ]   [ Trades ]   [ Portfolio ] [Acc]|
+--------------------------------------------------+
```

---

## 3. Responsive Webview Portal (`Trading_Webview-main`)

- **Desktop Viewport ($\ge 768\text{px}$):** Persistent left sidebar menu, expanding tables, multi-column market quote grid.
- **Mobile Viewport ($< 768\text{px}$):** Hides desktop sidebar; activates fixed bottom navigation tab bar mimicking native APK look and feel.
- **Micro-Animations:** Ticker cells pulse green on price uptick and red on downtick with CSS transition durations of $150\text{ms}$.
