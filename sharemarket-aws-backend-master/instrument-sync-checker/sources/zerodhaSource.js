const fs = require('fs');
const config = require('../config/instrumentSyncConfig');
const zerodhaNormalizer = require('../normalizers/zerodhaNormalizer');

/**
 * Zerodha Source Reader
 * Loads instrument master data from local dump (data/instruments.json) or live Kite SDK.
 */
class ZerodhaSource {
    async fetchInstruments(customParam = null) {
        if (Array.isArray(customParam)) {
            return {
                success: true,
                source: 'ZERODHA_CUSTOM',
                count: customParam.length,
                normalized: zerodhaNormalizer.normalizeBatch(customParam)
            };
        }

        const filePath = (typeof customParam === 'string') ? customParam : config.ZERODHA_DUMP_PATH;
        
        console.log(`📡 [ZerodhaSource] Reading Zerodha instruments from: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            // Check if KiteService can fetch live
            try {
                const kiteService = require('../../src/utils/kiteService');
                if (kiteService && kiteService.isAuthenticated && kiteService.isAuthenticated()) {
                    console.log('📡 [ZerodhaSource] Fetching live instruments from Kite API...');
                    const rawList = await kiteService.getInstruments();
                    if (Array.isArray(rawList) && rawList.length > 0) {
                        return {
                            success: true,
                            source: 'ZERODHA_LIVE_API',
                            count: rawList.length,
                            normalized: zerodhaNormalizer.normalizeBatch(rawList)
                        };
                    }
                }
            } catch (liveErr) {
                console.warn('⚠️ [ZerodhaSource] Live Kite fetch failed:', liveErr.message);
            }

            return {
                success: false,
                source: 'ZERODHA',
                error: `Instruments dump file not found at: ${filePath}`,
                normalized: []
            };
        }

        try {
            const rawText = fs.readFileSync(filePath, 'utf8');
            const rawList = JSON.parse(rawText);
            if (!Array.isArray(rawList)) {
                return {
                    success: false,
                    source: 'ZERODHA',
                    error: 'Instruments JSON payload is not an array',
                    normalized: []
                };
            }

            console.log(`✅ [ZerodhaSource] Read ${rawList.length} raw Zerodha instruments`);
            const normalized = zerodhaNormalizer.normalizeBatch(rawList);
            return {
                success: true,
                source: 'ZERODHA_DUMP',
                count: rawList.length,
                normalized
            };
        } catch (err) {
            return {
                success: false,
                source: 'ZERODHA',
                error: err.message,
                normalized: []
            };
        }
    }
}

module.exports = new ZerodhaSource();
