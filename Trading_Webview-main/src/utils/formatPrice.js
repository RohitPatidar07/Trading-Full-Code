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
        return str;
    }
    return parseFloat(num.toFixed(4)).toString();
}

export function formatPriceFallback(current, lastValue) {
    const num = Number(current);
    if (num === 0 && lastValue && Number(lastValue) !== 0) {
        return formatPrice(lastValue);
    }
    return formatPrice(num);
}
