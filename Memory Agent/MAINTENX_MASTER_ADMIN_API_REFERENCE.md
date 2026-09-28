# 📑 MaintenX OS – Master Admin API Reference Manual
**Document Version:** 2.0 (Comprehensive Specification)  
**Base URL:** `http://localhost:5000` / `https://api.yourdomain.com`  
**Authentication Scheme:** `Authorization: Bearer <JWT_TOKEN>`  
**Standard Response Formats:** JSON `{ "success": boolean, "message": string, "data": any }`  

---

## 1. Global Headers & Error Protocols

### Standard Request Headers:
```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Client-IP: 203.0.113.195
```

### Standard Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created (User, Trade, Fund Entry).
- `400 Bad Request`: Validation failure (insufficient margin, lot limit exceeded, invalid symbol).
- `401 Unauthorized`: Token missing, expired, or invalid.
- `403 Forbidden`: Insufficient role privileges (e.g. Trader attempting Admin endpoint).
- `404 Not Found`: Target entity ID does not exist.
- `500 Internal Server Error`: Unhandled database or system exception.

---

## 2. Authentication & Session Module (`/api/auth`)

### 2.1 User Login (`POST /api/auth/login`)
- **Access:** Public
- **Request Body:**
  ```json
  {
    "username": "rohit_trader",
    "password": "Password@123",
    "deviceInfo": "Samsung Galaxy S24 / Android 14"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 16,
      "username": "rohit_trader",
      "full_name": "Rohit Patidar",
      "role": "TRADER",
      "balance": "100000.0000",
      "credit_limit": "50000.0000",
      "exposure_multiplier": 500,
      "kyc_status": "VERIFIED"
    }
  }
  ```

### 2.2 Change Transaction Password (`POST /api/auth/change-transaction-password`)
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "currentPin": "1234",
    "newPin": "9876"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Transaction PIN updated successfully"
  }
  ```

---

## 3. Client & Hierarchy Management Module (`/api/users`)

### 3.1 Create Client / Sub-Broker (`POST /api/users`)
- **Access:** `SUPERADMIN`, `ADMIN`, `BROKER`
- **Request Body:**
  ```json
  {
    "username": "trader_demo_01",
    "password": "TempPassword@123",
    "full_name": "Ankit Sharma",
    "email": "ankit@gmail.com",
    "mobile": "9876543210",
    "role": "TRADER",
    "parentId": 12,
    "balance": 50000,
    "credit_limit": 10000,
    "exposure_multiplier": 500,
    "city": "Indore",
    "is_demo": 0,
    "segments": [
      { "segment": "MCX", "is_enabled": 1, "brokerage_type": "PER_LOT", "brokerage_value": 20, "max_lot_per_scrip": 10 },
      { "segment": "EQUITY", "is_enabled": 1, "brokerage_type": "PER_CRORE", "brokerage_value": 800, "max_lot_per_scrip": 500 }
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "userId": 58
  }
  ```

### 3.2 Reset Account (`POST /api/users/:id/reset`)
- **Access:** `SUPERADMIN`
- **Description:** Deletes all trades for user, squares off open positions, refunds locked margins, and resets balance.
- **Request Body:** `{ "adminPin": "9999", "notes": "Weekly Account Reset" }`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Account reset completed. 4 trades purged, ₹45,000 margin restored."
  }
  ```

### 3.3 Recalculate Brokerage (`POST /api/users/:id/recalculate-brokerage`)
- **Access:** `SUPERADMIN`
- **Description:** Re-evaluates commission on past closed trades if client's brokerage rate was updated retroactively.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Recalculated brokerage across 14 trades. Net adjustment: ₹320.00 debited."
  }
  ```

---

## 4. Order Management & Trades Module (`/api/trades`)

### 4.1 Place Order (`POST /api/trades`)
- **Access:** `TRADER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "symbol": "GOLD",
    "type": "BUY",
    "orderType": "MARKET",
    "qty": 1,
    "price": 72540.00,
    "stopLoss": 72400.00,
    "targetPrice": 72800.00,
    "tradeType": "INTRADAY"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Order placed successfully",
    "trade": {
      "id": 142,
      "symbol": "GOLD",
      "type": "BUY",
      "order_type": "MARKET",
      "qty": 1,
      "entry_price": "72540.0000",
      "margin_used": "45000.0000",
      "status": "OPEN",
      "entry_time": "2026-09-24T18:40:00.000Z"
    }
  }
  ```

### 4.2 Close Trade (`PUT /api/trades/:id/close`)
- **Access:** `TRADER`, `ADMIN`, `SUPERADMIN`
- **Request Body:** `{ "exitPrice": 72620.00 }`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Trade closed successfully",
    "trade": {
      "id": 142,
      "status": "CLOSED",
      "exit_price": "72620.0000",
      "pnl": "8000.0000",
      "brokerage": "40.0000",
      "margin_refunded": "45000.0000"
    }
  }
  ```

### 4.3 Delete Trade with Reversal (`DELETE /api/trades/:id`)
- **Access:** `SUPERADMIN`
- **Description:** Completely removes trade record, reverses any booked PnL from client ledger, and refunds margin.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Trade deleted. Margin refunded: ₹45,000, PnL reversed: ₹8,000"
  }
  ```

---

## 5. Live M2M & Risk Dashboard Module (`/api/dashboard`)

### 5.1 Real-Time Live M2M Matrix (`GET /api/dashboard/m2m`)
- **Access:** `ADMIN`, `SUPERADMIN`
- **Query Params:** `?brokerId=12&segment=MCX`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "summary": {
      "totalClients": 45,
      "activePositions": 18,
      "totalMarginUsed": 845000.00,
      "netM2M": 42150.00
    },
    "clients": [
      {
        "userId": 16,
        "username": "rohit_trader",
        "brokerName": "broker_alpha",
        "openPositionsCount": 2,
        "marginUsed": 90000.00,
        "balance": 145000.00,
        "m2m": 12450.00,
        "marginUtilizationPct": 54.2,
        "riskStatus": "NORMAL"
      }
    ]
  }
  ```

### 5.2 Emergency Square-off All (`POST /api/dashboard/square-off-all`)
- **Access:** `SUPERADMIN`
- **Description:** Liquidates all open positions across the entire server at current market prices.
- **Request Body:** `{ "superadminPassword": "RootPassword@123", "reason": "Market Emergency Cutoff" }`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Emergency square-off completed. Liquidated 84 positions across 32 traders."
  }
  ```

---

## 6. Financial Ledger & Fund Requests (`/api/funds` & `/api/requests`)

### 6.1 Get Running Ledger (`GET /api/funds/ledger/:userId`)
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "ledger": [
      {
        "id": 841,
        "type": "TRADE_PNL",
        "amount": "8000.0000",
        "balance_before": "100000.0000",
        "balance_after": "108000.0000",
        "reference_id": "TRADE_142",
        "remarks": "Realized Profit on GOLD BUY (1 Lot)",
        "created_at": "2026-09-24T18:41:00.000Z"
      },
      {
        "id": 842,
        "type": "BROKERAGE",
        "amount": "-40.0000",
        "balance_before": "108000.0000",
        "balance_after": "107960.0000",
        "reference_id": "TRADE_142",
        "remarks": "Brokerage debited for GOLD Trade #142",
        "created_at": "2026-09-24T18:41:01.000Z"
      }
    ]
  }
  ```

### 6.2 Approve Deposit Request (`PUT /api/requests/deposits/:id`)
- **Access:** `ADMIN`, `SUPERADMIN`
- **Request Body:** `{ "status": "APPROVED", "remarks": "Payment received via IMPS UTR: 93849102" }`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Deposit approved. ₹50,000 credited to user balance."
  }
  ```

---

## 7. Weekly Settlements & Expiry Rules (`/api/weekly-settlements`)

### 7.1 Run Manual Settlement (`POST /api/weekly-settlements/run`)
- **Access:** `SUPERADMIN`
- **Request Body:** `{ "weekEndDate": "2026-09-27" }`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Weekly settlement job completed.",
    "settlementSummary": {
      "settledUsersCount": 112,
      "totalRealizedPnl": "482010.0000",
      "totalBrokerageCollected": "38450.0000",
      "carriedForwardPositionsCount": 24
    }
  }
  ```
