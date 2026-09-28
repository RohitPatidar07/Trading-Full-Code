---
name: instrument-mapping-agent
description: Audits, maps, and reconciles provider instruments (Zerodha Kite Connect and AllTick) to build a canonical Master Instrument Registry with unique internal identifiers. Use when diagnosing symbol mismatches, duplicate contracts, or option/future symbol drift.
---

# Instrument Mapping Agent Skill

## Overview
This skill guides the inspection and reconciliation of trading instruments across disparate feeds:
- **Zerodha Kite Connect**: Instruments dump with `instrument_token`, `tradingsymbol`, `exchange`, `segment`, `expiry`, `strike`, `lot_size`, `tick_size`.
- **AllTick (Alti)**: Forex, Crypto, and Global Commodities via `code` or ticker string (e.g. `GOLD`, `XAU/USD`, `EURUSD`, `BTCUSDT`).
- **Internal System**: Internal Canonical Instrument ID representing contract reality.

## The Core Problem to Solve
When instruments are matched only by string (e.g. searching `WHERE symbol = 'GOLD'`), options contracts, weekly/monthly futures, and commodities collide. For instance:
- `GOLD` in MCX (1 kg lot) vs `GOLDM` (100g mini) vs `GOLD` on AllTick (spot USD 100oz).
- `NIFTY26MAR22000CE` vs `NIFTY26MAR22000PE` colliding if strike or type is ignored.

## Canonical Identity Specification
Every instrument must be identified by:
$$\text{Canonical Key} = \text{exchange} + \text{segment} + \text{tradingsymbol} + \text{expiry} + \text{strike} + \text{option\_type}$$

### Internal Registry Schema (`master_instruments`)
```sql
CREATE TABLE IF NOT EXISTS master_instruments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internal_symbol VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    exchange VARCHAR(20) NOT NULL,        -- MCX, NSE, NFO, FOREX, CRYPTO, COMEX
    segment VARCHAR(20) NOT NULL,         -- EQUITY, FUTURES, OPTIONS, COMMODITY, FOREX, CRYPTO
    underlying VARCHAR(50) NOT NULL,      -- e.g. NIFTY, BANKNIFTY, GOLD, CRUDEOIL
    expiry_date DATE NULL,
    strike_price DECIMAL(18,4) DEFAULT 0.0000,
    option_type ENUM('CE', 'PE', 'XX') DEFAULT 'XX',
    instrument_type VARCHAR(20) NOT NULL, -- EQ, FUT, OPT, SPOT
    lot_size INT NOT NULL DEFAULT 1,
    multiplier DECIMAL(18,6) NOT NULL DEFAULT 1.000000,
    tick_size DECIMAL(18,4) NOT NULL DEFAULT 0.0500,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inst_lookup (exchange, segment, underlying, expiry_date, strike_price, option_type)
);

CREATE TABLE IF NOT EXISTS provider_instrument_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_instrument_id INT NOT NULL,
    provider ENUM('ZERODHA', 'ALLTICK', 'CUSTOM') NOT NULL,
    provider_token VARCHAR(100) NOT NULL,   -- e.g. Zerodha instrument_token '256265'
    provider_symbol VARCHAR(100) NOT NULL,  -- e.g. 'NIFTY24OCTFUT', 'XAU/USD'
    feed_mode VARCHAR(20) DEFAULT 'WEBSOCKET',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (master_instrument_id) REFERENCES master_instruments(id) ON DELETE CASCADE,
    UNIQUE KEY uk_provider_token (provider, provider_token),
    INDEX idx_prov_sym (provider, provider_symbol)
);
```

## Step-by-Step Audit Workflow

1. **Extract Distinct Provider Symbols**:
   - Query `market_group_items` to list base symbols configured for client watchlists.
   - Query active Zerodha instrument cache and AllTick symbol lists.
2. **Detect Name-Collision Mismatches**:
   - Run duplicate detection query:
     ```sql
     SELECT symbol, COUNT(*) as cnt FROM scrip_data GROUP BY symbol HAVING cnt > 1;
     ```
   - Check for contracts where `lot_size` varies across same ticker name (e.g. different expiries or mini vs full).
3. **Generate Resolution Map**:
   - Map each row to a canonical internal ID.
   - Map provider-specific feeds to `provider_instrument_mappings`.
4. **Produce Verification Report**:
   - Total instruments cataloged.
   - Ambiguous or conflicting symbols found.
   - Recommended mapping entries for database migration.
