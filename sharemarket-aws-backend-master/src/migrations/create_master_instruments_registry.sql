-- ============================================================================
-- Migration: Master Instrument Registry & Provider Mapping
-- Purpose: Decouple trading calculations and order execution from provider-specific
--          symbol names (Zerodha / AllTick). Ensure canonical identity.
-- ============================================================================

-- 1. Create master_instruments table
CREATE TABLE IF NOT EXISTS `master_instruments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `internal_symbol` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique canonical identifier e.g. MCX_GOLD_202610_FUT or NFO_NIFTY_26OCT24000CE',
    `display_name` VARCHAR(150) NOT NULL COMMENT 'Human readable label for UI displays',
    `exchange` VARCHAR(20) NOT NULL COMMENT 'MCX, NSE, NFO, FOREX, CRYPTO, COMEX',
    `segment` VARCHAR(30) NOT NULL COMMENT 'EQUITY, FUTURES, OPTIONS, COMMODITY, FOREX, CRYPTO',
    `underlying` VARCHAR(50) NOT NULL COMMENT 'e.g. NIFTY, BANKNIFTY, GOLD, CRUDEOIL, EURUSD',
    `expiry_date` DATE NULL COMMENT 'Contract expiry date',
    `strike_price` DECIMAL(18,4) DEFAULT 0.0000 COMMENT '0.0000 for Futures, Cash, FX, Crypto',
    `option_type` ENUM('CE', 'PE', 'XX') NOT NULL DEFAULT 'XX' COMMENT 'CE = Call, PE = Put, XX = Non-option',
    `instrument_type` VARCHAR(20) NOT NULL DEFAULT 'EQ' COMMENT 'EQ, FUT, OPT, SPOT',
    `lot_size` INT NOT NULL DEFAULT 1 COMMENT 'Mandatory contract unit multiplier for lots',
    `multiplier` DECIMAL(18,6) NOT NULL DEFAULT 1.000000 COMMENT 'Point multiplier or currency translation factor',
    `tick_size` DECIMAL(18,4) NOT NULL DEFAULT 0.0500 COMMENT 'Minimum price fluctuation increment',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_canonical_contract` (`exchange`, `segment`, `underlying`, `expiry_date`, `strike_price`, `option_type`),
    INDEX `idx_active_instruments` (`is_active`, `exchange`, `segment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Create provider_instrument_mappings table
CREATE TABLE IF NOT EXISTS `provider_instrument_mappings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `master_instrument_id` INT NOT NULL,
    `provider` ENUM('ZERODHA', 'ALLTICK', 'CUSTOM') NOT NULL,
    `provider_token` VARCHAR(100) NOT NULL COMMENT 'Zerodha instrument_token (e.g. 256265) or AllTick code',
    `provider_symbol` VARCHAR(100) NOT NULL COMMENT 'e.g. NIFTY24OCTFUT, XAU/USD, GOLD',
    `feed_mode` VARCHAR(30) DEFAULT 'WEBSOCKET' COMMENT 'WEBSOCKET, REST_POLL',
    `raw_metadata_json` JSON NULL COMMENT 'Raw dump from provider for audit trail',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`master_instrument_id`) REFERENCES `master_instruments`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_provider_token` (`provider`, `provider_token`),
    INDEX `idx_provider_symbol` (`provider`, `provider_symbol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Seed Initial Migration from existing scrip_data (idempotent insert)
INSERT IGNORE INTO `master_instruments` (
    `internal_symbol`, `display_name`, `exchange`, `segment`, `underlying`, 
    `expiry_date`, `strike_price`, `option_type`, `instrument_type`, `lot_size`, `tick_size`
)
SELECT 
    CONCAT(COALESCE(market_type, 'NSE'), '_', symbol) AS internal_symbol,
    symbol AS display_name,
    COALESCE(market_type, 'NSE') AS exchange,
    CASE 
        WHEN market_type = 'MCX' THEN 'COMMODITY'
        WHEN symbol LIKE '%CE' OR symbol LIKE '%PE' THEN 'OPTIONS'
        WHEN symbol LIKE '%FUT' THEN 'FUTURES'
        ELSE 'EQUITY'
    END AS segment,
    symbol AS underlying,
    expiry_date,
    0.0000 AS strike_price,
    CASE 
        WHEN symbol LIKE '%CE' THEN 'CE'
        WHEN symbol LIKE '%PE' THEN 'PE'
        ELSE 'XX'
    END AS option_type,
    CASE 
        WHEN symbol LIKE '%CE' OR symbol LIKE '%PE' THEN 'OPT'
        WHEN symbol LIKE '%FUT' THEN 'FUT'
        ELSE 'EQ'
    END AS instrument_type,
    COALESCE(lot_size, 1) AS lot_size,
    0.0500 AS tick_size
FROM `scrip_data`
WHERE symbol IS NOT NULL AND symbol != '';
