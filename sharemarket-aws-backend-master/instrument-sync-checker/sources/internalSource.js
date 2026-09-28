const CanonicalInstrument = require('../normalizers/canonicalInstrument');
const identityBuilder = require('../matching/identityBuilder');
const { getMcxBaseScrip, parseOptionSymbol } = require('../../src/utils/symbolHelper');

/**
 * Internal Instrument Source Reader
 * Loads internal tradable instruments from scrip_data and commodity registry.
 */
class InternalSource {
    async fetchInstruments(customList = null) {
        if (Array.isArray(customList)) {
            return {
                success: true,
                source: 'INTERNAL_CUSTOM',
                count: customList.length,
                normalized: this.normalizeBatch(customList)
            };
        }

        try {
            const db = require('../../src/config/db');
            const [rows] = await db.execute(`
                SELECT symbol, lot_size, market_type, expiry_date 
                FROM scrip_data
            `);

            console.log(`✅ [InternalSource] Loaded ${rows.length} internal scrips from scrip_data`);
            const normalized = this.normalizeBatch(rows);
            return {
                success: true,
                source: 'INTERNAL_DATABASE',
                count: rows.length,
                normalized
            };
        } catch (err) {
            console.warn('⚠️ [InternalSource] DB fetch failed:', err.message);
            return {
                success: false,
                source: 'INTERNAL_DATABASE',
                error: err.message,
                normalized: []
            };
        }
    }

    normalize(row) {
        if (!row) return null;
        const rawSym = (row.symbol || '').toUpperCase().trim();
        const cleanSym = rawSym.includes(':') ? rawSym.split(':')[1] : rawSym;
        let mType = (row.market_type || 'EQUITY').toUpperCase();
        let exchange = mType;
        let segment = mType;

        if (mType === 'NSE' || mType === 'EQUITY') {
            exchange = 'NSE';
            segment = 'EQUITY';
        } else if (mType === 'NFO') {
            exchange = 'NFO';
            segment = cleanSym.endsWith('CE') || cleanSym.endsWith('PE') ? 'OPTIONS' : 'FUTURES';
        } else if (mType === 'MCX') {
            exchange = 'MCX';
            segment = cleanSym.endsWith('CE') || cleanSym.endsWith('PE') ? 'OPTIONS' : 'FUTURES';
        }

        let underlying = cleanSym;
        if (exchange === 'MCX') {
            underlying = getMcxBaseScrip(cleanSym) || cleanSym;
        } else if (segment === 'OPTIONS') {
            const opt = parseOptionSymbol(cleanSym);
            if (opt) underlying = opt.root;
        }

        const canonicalObj = new CanonicalInstrument({
            source: 'INTERNAL',
            exchange,
            segment,
            symbol: rawSym,
            cleanSymbol: cleanSym,
            underlying,
            instrumentType: segment === 'OPTIONS' ? (cleanSym.endsWith('PE') ? 'PE' : 'CE') : (segment === 'FUTURES' ? 'FUT' : 'EQ'),
            expiry: row.expiry_date || null,
            strike: 0,
            lotSize: parseInt(row.lot_size, 10) || 1,
            tickSize: 0.05,
            rawPayload: row
        });

        canonicalObj.canonicalId = identityBuilder.buildCanonicalId(canonicalObj);
        return canonicalObj;
    }

    normalizeBatch(rows = []) {
        return rows.map(r => this.normalize(r)).filter(Boolean);
    }
}

module.exports = new InternalSource();
