# 🗺️ MaintenX OS – Complete API Endpoint & Route Catalog
**Document Version:** 2.0 (Exhaustive API Directory)  
**Total Route Files:** 26 Modules in `sharemarket-aws-backend-master/src/routes/`  
**Host URL:** `http://localhost:5000`  

---

## 1. Authentication & Security Endpoints

### 1.1 `authRoutes.js` (`/api/auth`)
| Method | Route | Controller & Function | Auth & Middleware | Request Payload / Query | Success Response (200/201) |
| :---: | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/login` | `authController.login` | Public | `{ username, password, deviceInfo }` | `{ success: true, token, user }` |
| `POST` | `/api/auth/verify-otp` | `authController.verifyOtp` | Public | `{ userId, otp }` | `{ success: true, token }` |
| `POST` | `/api/auth/logout` | `authController.logout` | Authenticated | None | `{ success: true, message: "Logged out" }` |
| `GET` | `/api/auth/me` | `authController.getCurrentUser` | Authenticated | None (Bearer Token) | `{ success: true, user }` |
| `POST` | `/api/auth/change-password` | `authController.changePassword` | Authenticated | `{ oldPassword, newPassword }` | `{ success: true, message: "Updated" }` |
| `POST` | `/api/auth/change-transaction-password` | `authController.changeTxPassword`| Authenticated | `{ oldPin, newPin }` | `{ success: true, message: "PIN set" }` |

### 1.2 `securityRoutes.js` (`/api/security`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/security/ip-logs` | `securityController.getIpLogs` | Admin+ | Audits user IP login history, geo-locations, and user agents |
| `GET` | `/api/security/trade-ips` | `securityController.getTradeIps`| Admin+ | Inspects IP addresses recorded during trade execution |

---

## 2. Order Management & Trades Endpoints

### 2.1 `tradeRoutes.js` (`/api/trades`)
| Method | Route | Controller & Function | Auth & Middleware | Payload / Params | Response |
| :---: | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/trades` | `tradeController.getTrades` | Authenticated | Query: `?status=OPEN&limit=50` | `{ success: true, trades: [...] }` |
| `POST` | `/api/trades` | `tradeController.createTrade` | Authenticated | `{ symbol, type, qty, orderType, price, sl, target }` | `{ success: true, trade }` |
| `PUT` | `/api/trades/:id/close` | `tradeController.closeTrade` | Authenticated | Body: `{ exitPrice }` | `{ success: true, pnl, brokerage }` |
| `PUT` | `/api/trades/:id/cancel` | `tradeController.cancelTrade` | Authenticated | None | `{ success: true, message: "Cancelled" }` |
| `PUT` | `/api/trades/:id` | `tradeController.updateTrade` | Admin+ | `{ entry_price, qty, margin_used }` | `{ success: true, updatedTrade }` |
| `DELETE` | `/api/trades/:id` | `tradeController.deleteTrade` | SuperAdmin | None | `{ success: true, marginRefunded }` |
| `POST` | `/api/trades/:id/restore` | `tradeController.restoreTrade`| SuperAdmin | None | `{ success: true, restoredTrade }` |

---

## 3. Client, Broker & Admin Endpoints

### 3.1 `userRoutes.js` (`/api/users`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/users` | `userController.getAllUsers` | Admin+ | Paginated user list with hierarchy and role filters |
| `POST` | `/api/users` | `userController.createUser` | Admin+ | Registers new client/broker with segment configurations |
| `GET` | `/api/users/:id` | `userController.getUserById` | Admin+ | Fetches profile, broker share percentage, and documents |
| `PUT` | `/api/users/:id` | `userController.updateUser` | Admin+ | Updates credit limits, status (`Active`/`Inactive`), city |
| `DELETE` | `/api/users/:id` | `userController.deleteUser` | Admin+ | Deletes account if zero active open trades exist |
| `POST` | `/api/users/:id/reset` | `userController.resetAccount` | SuperAdmin | Full account wipe, refunds locked margins, purges trades |
| `POST` | `/api/users/:id/recalculate-brokerage`| `userController.recalcBrokerage`| SuperAdmin | Recomputes brokerage ledger across past trades |

---

## 4. Financial & Fund Requests Endpoints

### 4.1 `fundRoutes.js` (`/api/funds`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/funds/ledger/:userId` | `fundController.getLedger` | Authenticated | Returns double-entry ledger statement with running balance |
| `POST` | `/api/funds/entry` | `fundController.createFundEntry`| Admin+ | Manual balance credit/debit (`DEPOSIT` / `WITHDRAW`) |

### 4.2 `requestRoutes.js` (`/api/requests`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/requests/deposits` | `requestController.getDeposits` | Admin+ | Lists pending deposit requests with payment proof URLs |
| `PUT` | `/api/requests/deposits/:id` | `requestController.approveDeposit`| Admin+ | Approves deposit; credits user balance and ledger |
| `GET` | `/api/requests/withdrawals` | `requestController.getWithdrawals`| Admin+ | Lists pending withdrawal requests with trader bank info |
| `PUT` | `/api/requests/withdrawals/:id`| `requestController.approveWithdrawal`| Admin+ | Approves withdrawal; debits user balance and ledger |

---

## 5. Market Data & Kite Connect Endpoints

### 5.1 `kiteRoutes.js` (`/api/kite`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/kite/status` | `kiteController.getStatus` | Authenticated | Returns KiteTicker and session health status |
| `GET` | `/api/kite/instruments` | `kiteController.getInstruments` | Authenticated | Searches Master Instrument table for MCX, NSE, NFO |
| `POST` | `/api/kite/auto-login` | `kiteController.triggerAutoLogin`| SuperAdmin | Triggers headless Chromium 8:30 AM login workflow |

### 5.2 `marketDataRoutes.js` (`/api/market-data`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/market-data/groups` | `marketDataController.getGroups` | Authenticated | Returns watchlist categories (NIFTY 50, MCX, Crypto) |
| `GET` | `/api/market-data/quotes` | `marketDataController.getQuotes` | Authenticated | Snapshot quotes for requested comma-separated symbols |

---

## 6. Risk, Expiry & Weekly Settlements Endpoints

### 6.1 `weeklySettlementRoutes.js` (`/api/weekly-settlements`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/weekly-settlements` | `weeklyController.getHistory` | Admin+ | Historical weekly settlement archive reports |
| `POST` | `/api/weekly-settlements/run` | `weeklyController.runSettlement` | SuperAdmin | Manually executes weekly closing calculation job |
| `GET` | `/api/weekly-settlements/:id/pdf`| `weeklyController.exportPdf` | Admin+ | Downloads PDF settlement statement for broker/client |

### 6.2 `contractRoutes.js` (`/api/contracts`)
| Method | Route | Controller & Function | Auth & Middleware | Description |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/contracts/banned` | `contractController.getBanned` | Authenticated | Fetches permanently and temporarily banned scrips |
| `POST` | `/api/contracts/banned` | `contractController.banScrip` | Admin+ | Adds symbol to global banned trading list |
| `GET` | `/api/contracts/expiry-rules` | `contractController.getExpiryRules` | Admin+ | Fetches auto square-off cutoffs & away point rules |

---

## 7. Artificial Intelligence & Voice Endpoints

### 7.1 `aiRoutes.js` & Root AI Endpoints
| Method | Route | Controller & Function | Auth Status | Description |
| :---: | :--- | :--- | :---: | :--- |
| `POST` | `/ai-parse` | `aiController.aiParse` | Recommended Auth | Transcribes voice buffer and returns parsed order JSON |
| `POST` | `/execute-command` | `aiController.executeVoiceCommand`| Recommended Auth | Executes parsed spoken order directly via OMS |
| `POST` | `/smart-command` | `aiController.smartCommand` | Recommended Auth | Context-aware natural language trading query |
| `POST` | `/master-command` | `aiController.masterCommand` | SuperAdmin Auth | Voice-based administrative commands |
