const CanonicalInstrument = require('./canonicalInstrument');
const identityBuilder = require('../matching/identityBuilder');

/**
 * Alti (AllTick) & Foreign Instrument Normalizer
 * Converts AllTick / Commodity / Forex scrips to CanonicalInstrument instances.
 */
class AltiNormalizer {
    normalize(raw) {
        if (!raw || typeof raw !== 'object') return null;

        const rawSym = (raw.symbol || raw.code || '').toUpperCase().trim();
        const cleanSym = rawSym.includes(':') ? rawSym.split(':')[1] : rawSym;

        let category = (raw.category || raw.segment || 'COMMODITY').toUpperCase();
        let exchange = (raw.exchange || category).toUpperCase();
        if (['XAU/USD', 'XAG/USD', 'USOIL', 'NGAS', 'GOLD', 'SILVER', 'COPPER'].includes(cleanSym)) {
            category = 'COMMODITY';
            exchange = 'COMEX';
        } else if (cleanSym.includes('USDT') || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].some(c => cleanSym.startsWith(c))) {
            category = 'CRYPTO';
            exchange = 'CRYPTO';
        } else if (cleanSym.includes('/') || ['EURUSD', 'GBPUSD', 'USDJPY', 'USDINR'].some(f => cleanSym.replace(/\//g, '').startsWith(f))) {
            category = 'FOREX';
            exchange = 'FOREX';
        }

        const canonicalObj = new CanonicalInstrument({
            source: 'ALTI',
            exchange,
            segment: category,
            symbol: rawSym,
            cleanSymbol: cleanSym,
            underlying: cleanSym.replace(/[\s\/\_\-]+/g, ''),
            instrumentType: 'SPOT',
            expiry: null,
            strike: 0,
            optionType: null,
            lotSize: parseInt(raw.lot_size, 10) || 1,
            tickSize: parseFloat(raw.tick_size) || 0.01,
            sourceToken: raw.code || raw.id || null,
            rawPayload: raw
        });

        canonicalObj.canonicalId = identityBuilder.buildCanonicalId(canonicalObj);
        return canonicalObj;
    }

    normalizeBatch(rawList = []) {
        if (!Array.isArray(rawList)) return [];
        return rawList.map(item => this.normalize(item)).filter(Boolean);
    }
}

module.exports = new AltiNormalizer();
