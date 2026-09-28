const CanonicalInstrument = require('./canonicalInstrument');
const identityBuilder = require('../matching/identityBuilder');
const { getMcxBaseScrip } = require('../../src/utils/symbolHelper');

/**
 * Zerodha / Kite Instrument Normalizer
 * Converts raw Kite instrument dumps or API objects to CanonicalInstrument instances.
 */
class ZerodhaNormalizer {
    normalize(raw) {
        if (!raw || typeof raw !== 'object') return null;

        const exchange = (raw.exchange || 'NSE').toUpperCase();
        const symbol = (raw.tradingsymbol || raw.symbol || '').toUpperCase();
        let underlying = (raw.name || raw.underlying || '').toUpperCase();
        let segment = (raw.segment || 'EQUITY').toUpperCase();
        let instType = (raw.instrument_type || 'EQ').toUpperCase();
        
        // Map Kite Segment codes
        if (segment === 'NSE' || segment === 'BSE') {
            segment = 'EQUITY';
        } else if (segment.includes('FUT')) {
            segment = 'FUTURES';
        } else if (segment.includes('OPT')) {
            segment = 'OPTIONS';
        } else if (segment.includes('MCX')) {
            segment = instType === 'FUT' ? 'FUTURES' : (instType === 'CE' || instType === 'PE' ? 'OPTIONS' : 'COMMODITY');
        }

        if (exchange === 'MCX' && !underlying) {
            underlying = getMcxBaseScrip(symbol) || symbol;
        }

        const canonicalObj = new CanonicalInstrument({
            source: 'ZERODHA',
            exchange,
            segment,
            symbol,
            cleanSymbol: symbol,
            underlying: underlying || symbol,
            instrumentType: instType,
            expiry: raw.expiry || null,
            strike: parseFloat(raw.strike) || 0,
            optionType: (instType === 'CE' || instType === 'PE') ? instType : null,
            lotSize: parseInt(raw.lot_size, 10) || 1,
            tickSize: parseFloat(raw.tick_size) || 0.05,
            sourceToken: raw.instrument_token || raw.exchange_token || null,
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

module.exports = new ZerodhaNormalizer();
