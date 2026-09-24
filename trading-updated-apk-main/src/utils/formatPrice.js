/**
 * formatPrice — Smart decimal formatter for Bid / Ask / LTP (React Native)
 *
 * Rules:
 *  • Show API value as-is.
 *  • If decimals > 4 → cap to 4 decimal places.
 *  • If decimals ≤ 4 → show exactly what API sent (no padding, no trimming).
 *  • Never show trailing zeros beyond what API provided.
 *  • 0 → '0'   null/undefined/NaN/Infinity → '-'
 */
export function formatPrice(n) {
    if (n == null || n === '') return '-';
    const num = Number(n);
    if (isNaN(num) || !isFinite(num)) return '-';
    if (num === 0) return '0';

    const str = num.toString();
    const dotIdx = str.indexOf('.');
    if (dotIdx === -1) return str;

    const decimalsInValue = str.length - dotIdx - 1;
    if (decimalsInValue <= 4) {
        return str; // API has ≤4 decimals — show as-is
    }
    // API has >4 decimals — cap at 4, remove trailing zeros
    return parseFloat(num.toFixed(4)).toString();
}

/**
 * formatPriceFallback — Same but shows last known value if current is 0 (market closed).
 */
export function formatPriceFallback(current, lastValue) {
    const num = Number(current);
    if (num === 0 && lastValue && Number(lastValue) !== 0) {
        return formatPrice(lastValue);
    }
    return formatPrice(num);
}

/**
 * formatScriptSymbol — Prettifies and synchronizes contract script names across all screens.
 * E.g. "MCX:GOLD26OCTFUT" or "GOLD26OCTFUT" → "GOLD 26OCT"
 * Keeps options / crypto / forex consistent.
 */
export function formatScriptSymbol(item) {
    if (!item) return '';
    const raw = typeof item === 'string'
        ? item
        : (item.name || item.displayName || item.symbol || item.fullSymbol || '');
    if (!raw) return '';

    let tradingSymbol = raw.includes(':') ? raw.split(':')[1] : raw;
    tradingSymbol = tradingSymbol.trim();

    // Strip common exchange prefixes
    const prefixes = ['CRYPTO:', 'FOREX:', 'COMMODITY:', 'COMEX:', 'MCX:', 'NSE:', 'NFO:'];
    for (const p of prefixes) {
        if (tradingSymbol.toUpperCase().startsWith(p)) {
            tradingSymbol = tradingSymbol.substring(p.length).trim();
            break;
        }
    }

    // Match futures contracts e.g. GOLD26OCTFUT → GOLD 26OCT
    const futMatch = tradingSymbol.match(/^([A-Z]+)(\d{1,2}[A-Z]{3}\d{0,2})FUT$/i);
    if (futMatch) {
        return `${futMatch[1].toUpperCase()} ${futMatch[2].toUpperCase()}`;
    }

    return tradingSymbol;
}
