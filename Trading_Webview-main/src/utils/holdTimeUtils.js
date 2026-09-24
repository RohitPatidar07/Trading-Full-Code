/**
 * holdTimeUtils.js
 * Anti-scalping / Minimum Hold Time utility functions
 * Ported from Trading App: ExitTradeScreen.js + OrderDetailScreen.js
 */

const MCX_SYMBOLS = [
    'GOLD','GOLDM','MGOLD','GOLDGUINEA','GOLDPETAL',
    'SILVER','SILVERM','MSILVER','SILVERMIC',
    'CRUDEOIL','CRUDEOILM','MCRUDEOIL',
    'NATURALGAS','NATURALGASM','MNATURALGAS','NATGASMINI',
    'COPPER','COPPERM','MCOPPER',
    'ZINC','ZINCMINI','MZINC',
    'NICKEL','NICKELMINI','MNICKEL',
    'LEAD','LEADMINI','MLEAD',
    'ALUMINIUM','ALUMINI','MALUMINIUM',
    'MENTHAOIL','COTTON','BULLDEX',
];

const COMMODITY_ALIASES = {
    'XAU/USD': 'GOLD', 'XAUUSD': 'GOLD',
    'XAG/USD': 'SILVER', 'XAGUSD': 'SILVER',
    'USOIL': 'CRUDEOIL', 'WTI': 'CRUDEOIL', 'OIL': 'CRUDEOIL',
    'BRENT': 'CRUDEOIL',
    'NATGAS': 'NATURALGAS', 'NG': 'NATURALGAS',
    'XCU/USD': 'COPPER', 'XCUUSD': 'COPPER',
};

function resolveCommodityAlias(sym) {
    const upper = sym.toUpperCase();
    return COMMODITY_ALIASES[upper] || upper;
}

function cleanSymbol(sym) {
    if (!sym) return '';
    let s = sym.toUpperCase();
    s = s.includes(':') ? s.split(':')[1] : s;
    return s.trim();
}

function getMcxBaseScrip(symbol) {
    const upper = cleanSymbol(symbol);
    for (const base of MCX_SYMBOLS) {
        if (upper.startsWith(base)) return base;
    }
    return null;
}

function parseFuturesBaseSymbol(sym) {
    let s = cleanSymbol(sym);
    s = s.replace(/(?:EQ|BE|FUT)$/, '');
    s = s.replace(/\d{2}[A-Z]{3}(?:FUT|OPT|CE|PE)?$/, '');
    s = s.replace(/\d{4,8}(?:FUT|OPT)?$/, '');
    return s.trim();
}

function parseOptionSymbol(sym) {
    const s = cleanSymbol(sym);
    const m = s.match(/^(.*?)(\d+)(CE|PE)$/i);
    if (!m) return null;
    return { root: parseFuturesBaseSymbol(m[1]), strike: m[2], optionType: m[3].toUpperCase() };
}

/**
 * Universal instrument equality check
 * Handles: MCX commodities, Options, Futures, Equity, Forex aliases
 */
export function isSameInstrument(sym1, sym2) {
    if (!sym1 || !sym2) return false;
    const a = cleanSymbol(sym1);
    const b = cleanSymbol(sym2);
    if (a === b) return true;

    const ra = resolveCommodityAlias(a);
    const rb = resolveCommodityAlias(b);
    if (ra === rb) return true;

    const oa = parseOptionSymbol(a);
    const ob = parseOptionSymbol(b);
    if (oa && ob) {
        return oa.root === ob.root && oa.strike === ob.strike && oa.optionType === ob.optionType;
    }

    const ma = getMcxBaseScrip(a);
    const mb = getMcxBaseScrip(b);
    if (ma && mb && ma === mb) return true;

    const fa = parseFuturesBaseSymbol(a);
    const fb = parseFuturesBaseSymbol(b);
    if (fa && fb && fa.length > 2 && fa === fb) return true;

    return false;
}

/**
 * Detect market segment from symbol + market field
 */
export function detectSegment(symbol, market) {
    const sym = cleanSymbol(symbol);
    const mkt = (market || '').toUpperCase();

    if (sym.endsWith('CE') || sym.endsWith('PE') || mkt === 'OPTIONS' || mkt.includes('OPT')) return 'OPTIONS';
    if (mkt === 'MCX' || mkt.includes('MCX') || sym.startsWith('MCX:')) return 'MCX';
    if (getMcxBaseScrip(sym)) return 'MCX';
    if (mkt === 'CRYPTO' || mkt.includes('CRYPTO') || sym.startsWith('CRYPTO:')) return 'CRYPTO';
    if (mkt === 'FOREX' || mkt.includes('FOREX') || sym.startsWith('FOREX:')) return 'FOREX';
    if (mkt === 'COMEX' || mkt === 'COMMODITY' || mkt.includes('COMEX') || sym.startsWith('COMEX:') || sym.startsWith('COMMODITY:')) return 'COMEX';
    return 'EQUITY';
}

/**
 * Get minimum hold time seconds from userConfig for a segment
 */
export function getMinHoldTimeSeconds(segment, userConfig) {
    if (!userConfig) return 0;
    let t = 0;
    if (segment === 'OPTIONS') t = parseInt(userConfig.optionsMinTimeToBookProfit || 0);
    else if (segment === 'MCX') t = parseInt(userConfig.mcxMinTimeToBookProfit || 0);
    else if (segment === 'EQUITY') t = parseInt(userConfig.equityMinTimeToBookProfit || 0);
    else if (segment === 'CRYPTO') t = parseInt(userConfig.cryptoConfig?.minTimeToBookProfit || userConfig.cryptoMinTimeToBookProfit || 0);
    else if (segment === 'FOREX') t = parseInt(userConfig.forexConfig?.minTimeToBookProfit || userConfig.forexMinTimeToBookProfit || 0);
    else if (segment === 'COMEX') t = parseInt(userConfig.comexConfig?.minTimeToBookProfit || userConfig.comexMinTimeToBookProfit || 0);
    if (!t) t = parseInt(userConfig.min_time_to_book_profit || userConfig.minTimeToBookProfit || 0);
    return t || 0;
}

/**
 * Parse entry timestamp to milliseconds (handles multiple formats)
 */
function parseEntryTime(rawTime) {
    if (!rawTime) return null;
    if (rawTime instanceof Date) return rawTime.getTime();
    if (typeof rawTime === 'number') return rawTime;
    if (typeof rawTime === 'string') {
        const clean = rawTime.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return new Date(clean.replace(' ', 'T')).getTime();
        const dmy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2}):(\d{2})(?:\s*(am|pm))?/i);
        if (dmy) {
            let [, d, m, y, h, min, s, ampm] = dmy;
            let hr = parseInt(h, 10);
            if (ampm) {
                if (ampm.toLowerCase() === 'pm' && hr < 12) hr += 12;
                if (ampm.toLowerCase() === 'am' && hr === 12) hr = 0;
            }
            return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${String(hr).padStart(2, '0')}:${min}:${s}`).getTime();
        }
        return new Date(clean).getTime();
    }
    return null;
}

/**
 * Calculate seconds a trade has been held (with IST offset correction)
 */
export function getSecondsHeld(trade) {
    const rawTime = trade.latestEntryTimeRaw || trade.entryTimeRaw || trade.entry_time || trade.time || trade.created_at;
    const entryMs = parseEntryTime(rawTime);
    if (!entryMs || isNaN(entryMs)) return null;

    let secondsHeld = Math.floor((Date.now() - entryMs) / 1000);
    // IST timezone correction (same as Trading App)
    if (secondsHeld >= 18000 && secondsHeld <= 21600) secondsHeld -= 19800;
    else if (secondsHeld <= -18000 && secondsHeld >= -21600) secondsHeld += 19800;
    if (secondsHeld < 0) secondsHeld = 0;
    return secondsHeld;
}

/**
 * Main check: can this trade be closed/exited right now?
 * Returns: { allowed: true } OR { allowed: false, remaining: N, minTime: N, segment }
 */
export function checkHoldTimeAllowed(trade, userConfig) {
    const segment = detectSegment(trade.name || trade.symbol || '', trade.market || trade.market_type || '');
    const minTimeSeconds = getMinHoldTimeSeconds(segment, userConfig);
    if (!minTimeSeconds) return { allowed: true };

    const secondsHeld = getSecondsHeld(trade);
    if (secondsHeld === null) return { allowed: true };

    if (secondsHeld < minTimeSeconds) {
        return { allowed: false, remaining: minTimeSeconds - secondsHeld, minTime: minTimeSeconds, segment };
    }
    return { allowed: true };
}
