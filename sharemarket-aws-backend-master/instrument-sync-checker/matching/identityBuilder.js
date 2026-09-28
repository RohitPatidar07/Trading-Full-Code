const { getMcxBaseScrip, parseOptionSymbol, parseFuturesBaseSymbol } = require('../../src/utils/symbolHelper');
const { isOptionsSymbol } = require('../../src/utils/segmentHelper');

/**
 * Canonical Identity Builder
 * Computes deterministic, collision-free contract identity keys.
 */
class IdentityBuilder {
    buildCanonicalId(inst) {
        const exchange = (inst.exchange || 'NSE').toUpperCase();
        const rawSym = (inst.symbol || inst.tradingsymbol || '').toUpperCase();
        const cleanSym = rawSym.includes(':') ? rawSym.split(':')[1] : rawSym;

        let instrumentType = (inst.instrumentType || inst.instrument_type || 'EQ').toUpperCase();
        let segment = (inst.segment || 'EQUITY').toUpperCase();
        let underlying = (inst.underlying || inst.name || '').toUpperCase();
        let expiry = inst.expiry || null;
        let strike = parseFloat(inst.strike) || 0;
        let optionType = inst.optionType || inst.option_type || null;

        const isOption = segment.includes('OPT') || instrumentType === 'CE' || instrumentType === 'PE' || isOptionsSymbol(cleanSym);

        if (isOption) {
            segment = 'OPTIONS';
            const parsedOpt = parseOptionSymbol(cleanSym);
            if (parsedOpt) {
                underlying = underlying || parsedOpt.root;
                strike = strike > 0 ? strike : parseFloat(parsedOpt.strike) || 0;
                optionType = optionType || parsedOpt.optionType;
                expiry = expiry || parsedOpt.expiry || 'DEFAULT_EXPIRY';
            }
            if (!optionType) {
                optionType = cleanSym.endsWith('PE') ? 'PE' : 'CE';
            }
            instrumentType = optionType;
            return `${exchange}:OPT:${underlying}:${expiry || 'NO_EXP'}:${strike}:${optionType}`;
        }

        if (segment.includes('FUT') || instrumentType === 'FUT' || cleanSym.endsWith('FUT')) {
            segment = 'FUTURES';
            instrumentType = 'FUT';
            if (exchange === 'MCX') {
                const mcxBase = getMcxBaseScrip(cleanSym);
                underlying = underlying || mcxBase || cleanSym;
            } else {
                const futBase = parseFuturesBaseSymbol(cleanSym);
                underlying = underlying || futBase || cleanSym;
            }
            return `${exchange}:FUT:${underlying}:${expiry || 'NO_EXP'}`;
        }

        if (['COMEX', 'FOREX', 'CRYPTO', 'COMMODITY'].includes(exchange) || ['FOREX', 'CRYPTO', 'COMMODITY'].includes(segment)) {
            const normSym = cleanSym.replace(/[\s\/\_\-]+/g, '');
            return `${exchange}:${segment}:${normSym}`;
        }

        // Default: Equity Cash
        return `${exchange}:EQ:${cleanSym}`;
    }
}

module.exports = new IdentityBuilder();
