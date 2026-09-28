/**
 * AUTO-GENERATED TEST SUITE BY test-generator
 * Target: src/utils/symbolHelper.js
 * Domain: SYMBOL_AND_SEGMENT_PARSING
 * Generated: 2026-09-26T07:10:56.213Z
 */

const targetModule = require('../../src/utils/symbolHelper.js');

describe('symbolHelper Financial & Domain Unit Tests', () => {

    describe('parseOptionSymbol()', () => {
        test('OPT_SYM_1: [Happy Path] Standard monthly NIFTY CE option', () => {
            const func = targetModule.parseOptionSymbol || targetModule;
            const input = "NFO:NIFTY26MAR24000CE";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result.root).toEqual("NIFTY");
            expect(result.strike).toEqual("24000");
            expect(result.optionType).toEqual("CE");
            expect(result.expiry).toEqual("26MAR");
        });

        test('OPT_SYM_2: [Happy Path] Standard BANKNIFTY PE option', () => {
            const func = targetModule.parseOptionSymbol || targetModule;
            const input = "BANKNIFTY26APR52000PE";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result.root).toEqual("BANKNIFTY");
            expect(result.strike).toEqual("52000");
            expect(result.optionType).toEqual("PE");
            expect(result.expiry).toEqual("26APR");
        });

        test('OPT_SYM_3: [Boundary & Zero Cases] Non-option symbol returns null', () => {
            const func = targetModule.parseOptionSymbol || targetModule;
            const input = "NSE:RELIANCE";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toEqual(null);
        });

    });

    describe('isSameInstrument()', () => {
        test('SAME_INST_1: [Happy Path] Exact match with prefix difference', () => {
            const func = targetModule.isSameInstrument || targetModule;
            const input = [
        "MCX:CRUDEOIL26MARFUT",
        "CRUDEOIL26MARFUT"
];
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toEqual(true);
        });

        test('SAME_INST_2: [Happy Path] Futures base scrip match', () => {
            const func = targetModule.isSameInstrument || targetModule;
            const input = [
        "NFO:NIFTY26APRFUT",
        "NIFTY FUT"
];
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toEqual(true);
        });

        test('SAME_INST_3: [Happy Path] Different strikes are NOT the same instrument', () => {
            const func = targetModule.isSameInstrument || targetModule;
            const input = [
        "BANKNIFTY26MAR50000CE",
        "BANKNIFTY26MAR51000CE"
];
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toEqual(false);
        });

    });

    describe('getMcxBaseScrip()', () => {
    });

    describe('isOptionsSymbol()', () => {
        test('IS_OPT_1: [Happy Path] True option symbol ending in digit + CE', () => {
            const func = targetModule.isOptionsSymbol || targetModule;
            const input = "BANKNIFTY56400CE";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toEqual(true);
        });

        test('IS_OPT_2: [Regression & Known Risk Areas] Plain stock ending in CE/PE characters (RELIANCE) is NOT an option', () => {
            const func = targetModule.isOptionsSymbol || targetModule;
            const input = "RELIANCE";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toEqual(false);
        });

        test('IS_OPT_3: [Regression & Known Risk Areas] Plain stock FINANCE is NOT an option', () => {
            const func = targetModule.isOptionsSymbol || targetModule;
            const input = "FINANCE";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toEqual(false);
        });

    });
});
