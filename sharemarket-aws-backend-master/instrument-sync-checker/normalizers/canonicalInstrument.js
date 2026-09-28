/**
 * Canonical Instrument Model
 * Standardized internal representation for instruments across all sources (Zerodha, Alti, Internal DB).
 */
class CanonicalInstrument {
    constructor({
        canonicalId = '',
        source = 'INTERNAL',
        exchange = 'NSE',
        segment = 'EQUITY',
        symbol = '',
        cleanSymbol = '',
        underlying = '',
        instrumentType = 'EQ',
        expiry = null,
        strike = 0,
        optionType = null,
        lotSize = 1,
        tickSize = 0.05,
        sourceToken = null,
        rawPayload = {}
    }) {
        this.canonicalId = canonicalId;
        this.source = source.toUpperCase();
        this.exchange = exchange.toUpperCase();
        this.segment = segment.toUpperCase();
        this.symbol = symbol;
        this.cleanSymbol = (cleanSymbol || symbol).toUpperCase().trim();
        this.underlying = (underlying || '').toUpperCase().trim();
        this.instrumentType = instrumentType.toUpperCase();
        this.expiry = expiry ? this._formatDate(expiry) : null;
        this.strike = parseFloat(strike) || 0;
        this.optionType = optionType ? optionType.toUpperCase() : null;
        this.lotSize = parseInt(lotSize, 10) || 1;
        this.tickSize = parseFloat(tickSize) || 0.05;
        this.sourceToken = sourceToken ? String(sourceToken) : null;
        this.rawPayload = rawPayload;
    }

    _formatDate(d) {
        if (!d) return null;
        try {
            const dateObj = new Date(d);
            if (isNaN(dateObj.getTime())) {
                const match = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
                return match ? match[0] : String(d).toUpperCase();
            }
            const y = dateObj.getUTCFullYear();
            const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        } catch (_) {
            return String(d);
        }
    }
}

module.exports = CanonicalInstrument;
