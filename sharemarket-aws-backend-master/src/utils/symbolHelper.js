/**
 * Helper to extract base scrip from MCX symbols (e.g. MCX:CRUDEOIL26APRFUT -> CRUDEOIL)
 */
const getMcxBaseScrip = (symbol) => {
    if (!symbol) return '';
    const s = symbol.split(':').pop().toUpperCase();

    // Ordered by length descending to match longest possible prefix first 
    const mcxBases = [
        'GOLDGUINEA', 'GOLDPETAL', 'GOLDM', 'GOLD', 'MGOLD',
        'SILVERMIC', 'SILVERM', 'SILVER', 'MSILVER',
        'CRUDEOILM', 'CRUDEOIL', 'MCRUDEOIL',
        'NATGASMINI', 'NATURALGAS', 'MNATURALGAS',
        'COPPERM', 'COPPER', 'MCOPPER',
        'ZINCMINI', 'ZINC', 'MZINC',
        'LEADMINI', 'LEAD', 'MLEAD',
        'NICKELMINI', 'NICKEL',
        'ALUMINI', 'ALUMINIUM', 'MALUMINIUM',
        'MENTHAOIL', 'COTTONCNDY', 'COTTON',
        'MCXBULLDEX', 'BULLDEX'
    ];

    for (const base of mcxBases) {
        if (s.startsWith(base)) return base;
    }
    return '';
};

const parseOptionSymbol = (sym) => {
    if (!sym) return null;
    const clean = sym.includes(':') ? sym.split(':')[1] : sym;
    const s = clean.trim().toUpperCase();

    const matchType = s.match(/(CE|PE)$/);
    if (!matchType) return null;
    const optionType = matchType[1];

    const body = s.slice(0, -2).trim();

    const rootMatch = body.match(/^([A-Z]+)/);
    if (!rootMatch) return null;
    const root = rootMatch[1];

    const remainder = body.slice(root.length).replace(/[\s\-_]/g, '');
    if (!remainder) return null;

    let strike = '';
    let expiry = '';

    const monthMatch = remainder.match(/^(\d{2}[A-Z]{3}\d{0,2})(\d+)$/);
    if (monthMatch) {
        expiry = monthMatch[1];
        strike = monthMatch[2];
    } else if (remainder.length >= 8) {
        const weeklyMatch = remainder.match(/^(\d{5})(\d+)$/);
        if (weeklyMatch) {
            expiry = weeklyMatch[1];
            strike = weeklyMatch[2];
        } else {
            const digitMatch = remainder.match(/(\d+)$/);
            strike = digitMatch ? digitMatch[1] : remainder;
        }
    } else {
        strike = remainder;
    }

    const cleanStrike = parseInt(strike, 10);
    return { root, strike: isNaN(cleanStrike) ? strike : cleanStrike.toString(), optionType, expiry };
};

const parseFuturesBaseSymbol = (sym) => {
    if (!sym) return '';
    const clean = sym.includes(':') ? sym.split(':')[1] : sym;
    let s = clean.replace(/[\s\-_]/g, '').toUpperCase();
    s = s.replace(/(EQ|BE|FUT)$/, '');
    s = s.replace(/\d{2}[A-Z]{3}|\d{6}|\d{5}/g, '');
    s = s.replace(/(FUT)$/, '');
    return s;
};

const isSameInstrument = (sym1, sym2, marketType = '') => {
    if (!sym1 || !sym2) return false;
    const s1 = String(sym1).trim().toUpperCase();
    const s2 = String(sym2).trim().toUpperCase();

    if (s1 === s2) return true;

    const clean1 = s1.includes(':') ? s1.split(':')[1] : s1;
    const clean2 = s2.includes(':') ? s2.split(':')[1] : s2;
    if (clean1 === clean2) return true;

    const noSpace1 = clean1.replace(/[\s\-_]/g, '');
    const noSpace2 = clean2.replace(/[\s\-_]/g, '');
    if (noSpace1 === noSpace2) return true;

    // MCX Scrip comparison using getMcxBaseScrip
    const mcxBase1 = getMcxBaseScrip(s1) || getMcxBaseScrip(clean1);
    const mcxBase2 = getMcxBaseScrip(s2) || getMcxBaseScrip(clean2);
    if (mcxBase1 && mcxBase2 && mcxBase1 === mcxBase2) {
        return true;
    }

    // Options matching
    const opt1 = parseOptionSymbol(s1);
    const opt2 = parseOptionSymbol(s2);
    if (opt1 && opt2) {
        return opt1.root === opt2.root && opt1.strike === opt2.strike && opt1.optionType === opt2.optionType;
    }
    if ((opt1 && !opt2) || (!opt1 && opt2)) {
        return false;
    }

    // Futures / Stock base symbol matching (e.g. NFO:NIFTY26APRFUT vs NIFTY FUT)
    const futBase1 = parseFuturesBaseSymbol(s1);
    const futBase2 = parseFuturesBaseSymbol(s2);
    if (futBase1 && futBase2 && futBase1 === futBase2) {
        return true;
    }

    const eq1 = noSpace1.replace(/(EQ|BE)$/, '');
    const eq2 = noSpace2.replace(/(EQ|BE)$/, '');
    if (eq1 === eq2) return true;

    const norm1 = noSpace1.replace(/USDT$/, 'USD');
    const norm2 = noSpace2.replace(/USDT$/, 'USD');
    if (norm1 === norm2) return true;

    const COMMODITY_MAP = {
        'XAU/USD': 'GOLD', 'XAUUSD': 'GOLD', 'GOLD': 'GOLD',
        'XAG/USD': 'SILVER', 'XAGUSD': 'SILVER', 'SILVER': 'SILVER',
        'USOIL': 'CRUDEOIL', 'CRUDEOIL': 'CRUDEOIL',
        'NGAS': 'NATURALGAS', 'NATURALGAS': 'NATURALGAS'
    };
    const c1 = COMMODITY_MAP[clean1] || COMMODITY_MAP[noSpace1] || clean1;
    const c2 = COMMODITY_MAP[clean2] || COMMODITY_MAP[noSpace2] || clean2;
    if (c1 === c2) return true;

    return false;
};

/**
 * Master Lot Sizes Object for MCX (populated & kept in sync with mcx_lot_sizes DB table)
 */
const MCX_LOT_SIZES = {
    'CRUDEOIL': 100, 'NATURALGAS': 1250, 'GOLD': 100, 'GOLDM': 10, 'MGOLD': 10,
    'SILVER': 30, 'SILVERM': 5, 'MSILVER': 5, 'COPPER': 2500, 'MCOPPER': 500, 'ZINC': 5000,
    'MZINC': 1000, 'MLEAD': 1000, 'MALUMINIUM': 1000,
    'NICKEL': 1500, 'LEAD': 5000, 'ALUMINIUM': 5000, 'MENTHAOIL': 360,
    'COTTON': 25, 'BULLDEX': 1, 'GOLDGUINEA': 8, 'GOLDPETAL': 1,
    'ZINCMINI': 1000, 'LEADMINI': 1000, 'NICKELMINI': 100, 'ALUMINI': 1000,
    'CRUDEOILM': 10, 'MCRUDEOIL': 10, 'NATGASMINI': 250, 'MNATURALGAS': 250, 'SILVERMIC': 1
};

/**
 * Standard known derivative lot sizes for Indian indices (safety fallback)
 */
const STANDARD_INDEX_LOT_SIZES = {
    'BANKNIFTY': 15,
    'NIFTY': 25,
    'FINNIFTY': 25,
    'MIDCPNIFTY': 50,
    'SENSEX': 10,
    'BANKEX': 15
};

/**
 * In-memory RAM cache for scrip_data lot sizes
 */
const SCRIP_LOT_CACHE = {};

/**
 * Loads lot sizes from scrip_data table into RAM cache
 */
const loadScripLotSizesFromDb = async () => {
    try {
        const db = require('../config/db');
        const [rows] = await db.execute('SELECT symbol, lot_size FROM scrip_data WHERE lot_size IS NOT NULL AND lot_size > 0');
        for (const row of rows) {
            const sym = (row.symbol || '').toUpperCase().trim();
            const clean = sym.includes(':') ? sym.split(':')[1] : sym;
            const lSize = parseFloat(row.lot_size);
            if (lSize > 0) {
                SCRIP_LOT_CACHE[sym] = lSize;
                SCRIP_LOT_CACHE[clean] = lSize;
            }
        }
        console.log(`✅ [symbolHelper] SCRIP_LOT_CACHE loaded ${Object.keys(SCRIP_LOT_CACHE).length} symbols from scrip_data`);
    } catch (err) {
        console.warn('⚠️ [symbolHelper] loadScripLotSizesFromDb non-critical error:', err.message);
    }
};

/**
 * Loads MCX Lot Sizes from DB table mcx_lot_sizes and updates in-memory MCX_LOT_SIZES cache
 */
const loadMcxLotSizesFromDb = async () => {
    try {
        const mcxModel = require('../models/mcxLotSizeModel');
        await mcxModel.initMcxLotSizesTable();
        const dbMap = await mcxModel.getAllMcxLotSizesFromDb();
        if (dbMap && Object.keys(dbMap).length > 0) {
            Object.assign(MCX_LOT_SIZES, dbMap);
            console.log(`✅ [symbolHelper] MCX_LOT_SIZES in-memory cache synchronized with DB (${Object.keys(dbMap).length} symbols)`);
        }
        // Also pre-cache scrip_data lot sizes in background
        await loadScripLotSizesFromDb();
    } catch (err) {
        console.error('⚠️ [symbolHelper] Failed to load MCX lot sizes from DB, using fallback defaults:', err.message);
    }
};

/**
 * Updates a lot size in DB and in-memory cache
 */
const updateMcxLotSize = async (symbol, lotSize, description = null) => {
    try {
        const mcxModel = require('../models/mcxLotSizeModel');
        const success = await mcxModel.updateMcxLotSizeInDb(symbol, lotSize, description);
        if (success) {
            MCX_LOT_SIZES[symbol.toUpperCase()] = parseInt(lotSize);
            console.log(`✅ [symbolHelper] Updated MCX lot size for ${symbol}: ${lotSize}`);
            return true;
        }
    } catch (err) {
        console.error(`❌ [symbolHelper] Error updating MCX lot size for ${symbol}:`, err.message);
    }
    return false;
};

/**
 * Unified Master Lot Size Resolver (Synchronous)
 * Checks CommodityLotService, MCX_LOT_SIZES, SCRIP_LOT_CACHE, and standard derivative roots
 */
const getLotSize = (symbol, marketType = '') => {
    if (!symbol) return 1;
    const rawSym = String(symbol).trim().toUpperCase();
    const cleanSym = rawSym.includes(':') ? rawSym.split(':')[1] : rawSym;
    const mType = (marketType || '').toUpperCase();

    // 1. Check Commodity / Forex / Crypto / COMEX via CommodityLotService
    try {
        const commodityLotService = require('../services/CommodityLotService');
        if (commodityLotService.isCommodityScrip(rawSym, mType)) {
            const info = commodityLotService.getLotInfo(rawSym);
            if (info && info.lot_size > 0) {
                return parseFloat(info.lot_size);
            }
        }
    } catch (_) { }

    // 2. Check MCX segment
    const isMcxSegment = mType === 'MCX' || rawSym.startsWith('MCX:') ||
        ['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'NICKEL', 'LEAD', 'ALUMINIUM'].some(k => cleanSym.startsWith(k));

    if (isMcxSegment && !cleanSym.endsWith('CE') && !cleanSym.endsWith('PE')) {
        const base = getMcxBaseScrip(rawSym) || getMcxBaseScrip(cleanSym);
        if (base && MCX_LOT_SIZES[base]) {
            return parseFloat(MCX_LOT_SIZES[base]);
        }
        const symTrimmed = cleanSym.replace(/\d+.*/, '');
        if (MCX_LOT_SIZES[symTrimmed]) {
            return parseFloat(MCX_LOT_SIZES[symTrimmed]);
        }
    }

    // 3. Check in-memory scrip_data cache (Zerodha synced)
    if (SCRIP_LOT_CACHE[rawSym] && SCRIP_LOT_CACHE[rawSym] > 0) {
        return parseFloat(SCRIP_LOT_CACHE[rawSym]);
    }
    if (SCRIP_LOT_CACHE[cleanSym] && SCRIP_LOT_CACHE[cleanSym] > 0) {
        return parseFloat(SCRIP_LOT_CACHE[cleanSym]);
    }

    // 4. Check standard derivative root matching (NIFTY, BANKNIFTY, etc.)
    for (const [root, defaultLot] of Object.entries(STANDARD_INDEX_LOT_SIZES)) {
        if (cleanSym.startsWith(root)) {
            return defaultLot;
        }
    }

    // 5. Default to 1 (Standard for NSE Cash Equity like RELIANCE, TCS, etc.)
    return 1;
};

/**
 * Unified Master Lot Size Resolver (Asynchronous with DB fallback)
 */
const getUniversalLotSize = async (symbol, marketType = '', connection = null) => {
    // First try fast synchronous resolution
    const syncLot = getLotSize(symbol, marketType);
    if (syncLot > 1) return syncLot;

    // If 1, check scrip_data in database if connection or db is available
    try {
        const dbConn = connection || require('../config/db');
        const rawSym = String(symbol).trim().toUpperCase();
        const cleanSym = rawSym.includes(':') ? rawSym.split(':')[1] : rawSym;

        const [scripRows] = await dbConn.execute(
            'SELECT lot_size FROM scrip_data WHERE symbol = ? OR symbol = ? LIMIT 1',
            [rawSym, cleanSym]
        );

        if (scripRows.length > 0 && parseFloat(scripRows[0].lot_size) > 0) {
            const dbLot = parseFloat(scripRows[0].lot_size);
            SCRIP_LOT_CACHE[rawSym] = dbLot;
            SCRIP_LOT_CACHE[cleanSym] = dbLot;
            return dbLot;
        }
    } catch (_) { }

    return syncLot;
};

module.exports = {
    getMcxBaseScrip,
    parseOptionSymbol,
    parseFuturesBaseSymbol,
    isSameInstrument,
    getLotSize,
    getUniversalLotSize,
    loadScripLotSizesFromDb,
    MCX_LOT_SIZES,
    STANDARD_INDEX_LOT_SIZES,
    loadMcxLotSizesFromDb,
    updateMcxLotSize
};
