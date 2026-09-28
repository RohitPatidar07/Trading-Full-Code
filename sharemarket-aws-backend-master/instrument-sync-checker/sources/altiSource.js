const altiNormalizer = require('../normalizers/altiNormalizer');

/**
 * Alti Source Reader
 * Loads AllTick / Foreign market configurations from DB or memory cache.
 */
class AltiSource {
    async fetchInstruments(customList = null) {
        if (Array.isArray(customList)) {
            return {
                success: true,
                source: 'ALTI_CUSTOM',
                count: customList.length,
                normalized: altiNormalizer.normalizeBatch(customList)
            };
        }

        try {
            const db = require('../../src/config/db');
            const [rows] = await db.execute(`
                SELECT symbol, category, lot_size, usdinr_value 
                FROM commodity_forex_crypto_lot_sizes
            `);

            console.log(`✅ [AltiSource] Loaded ${rows.length} Alti / Foreign scrips from database`);
            const normalized = altiNormalizer.normalizeBatch(rows);
            return {
                success: true,
                source: 'ALTI_DATABASE',
                count: rows.length,
                normalized
            };
        } catch (err) {
            console.warn('⚠️ [AltiSource] DB fetch failed, using fallback static commodity list:', err.message);
            const fallbackScrips = [
                { symbol: 'XAU/USD', category: 'COMMODITY', lot_size: 100, exchange: 'COMEX' },
                { symbol: 'XAG/USD', category: 'COMMODITY', lot_size: 5000, exchange: 'COMEX' },
                { symbol: 'USOIL', category: 'COMMODITY', lot_size: 1000, exchange: 'COMEX' },
                { symbol: 'NGAS', category: 'COMMODITY', lot_size: 10000, exchange: 'COMEX' },
                { symbol: 'EUR/USD', category: 'FOREX', lot_size: 100000, exchange: 'FOREX' },
                { symbol: 'GBP/USD', category: 'FOREX', lot_size: 100000, exchange: 'FOREX' },
                { symbol: 'USD/INR', category: 'FOREX', lot_size: 1000, exchange: 'FOREX' },
                { symbol: 'BTCUSDT', category: 'CRYPTO', lot_size: 1, exchange: 'CRYPTO' },
                { symbol: 'ETHUSDT', category: 'CRYPTO', lot_size: 1, exchange: 'CRYPTO' }
            ];
            return {
                success: true,
                source: 'ALTI_FALLBACK',
                count: fallbackScrips.length,
                normalized: altiNormalizer.normalizeBatch(fallbackScrips)
            };
        }
    }
}

module.exports = new AltiSource();
