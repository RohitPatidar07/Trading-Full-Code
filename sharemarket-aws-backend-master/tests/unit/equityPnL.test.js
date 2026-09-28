/**
 * AUTO-GENERATED TEST SUITE BY test-generator
 * Target: src/utils/equityPnL.js
 * Domain: INDIAN_PNL
 * Generated: 2026-09-26T07:10:48.427Z
 */

const targetModule = require('../../src/utils/equityPnL.js');

describe('equityPnL Financial & Domain Unit Tests', () => {

    describe('calculateEquityPnL()', () => {
        test('EQ_PNL_1: [Happy Path] BUY trade with profit', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 100,
        "exitPrice": 120,
        "actualQty": 50
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(1000, 2);
        });

        test('EQ_PNL_2: [Happy Path] BUY trade with loss', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 100,
        "exitPrice": 80,
        "actualQty": 50
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(-1000, 2);
        });

        test('EQ_PNL_3: [Happy Path] SELL trade with profit (price drops)', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "SELL",
        "entryPrice": 500,
        "exitPrice": 450,
        "actualQty": 100
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(5000, 2);
        });

        test('EQ_PNL_4: [Happy Path] SELL trade with loss (price rises)', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "SELL",
        "entryPrice": 500,
        "exitPrice": 550,
        "actualQty": 100
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(-5000, 2);
        });

        test('EQ_PNL_5: [Boundary & Zero Cases] Zero price change produces exactly 0 PnL', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 150.25,
        "exitPrice": 150.25,
        "actualQty": 200
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(0, 2);
        });

        test('EQ_PNL_6: [Precision & Decimals] Fractional prices with small tick movements', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 1234.55,
        "exitPrice": 1234.8,
        "actualQty": 100
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(25, 2);
        });

        test('EQ_PNL_7: [Financial Calculations] Lot mode conversion when actualQty is null (qtyInput * lotSize)', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 100,
        "exitPrice": 110,
        "qtyInput": 2,
        "lotSize": 25,
        "tradeMode": "LOTS"
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(500, 2);
        });

        test('EQ_PNL_8: [Financial Calculations] Unit mode with equityUnitsMode=1 (ignores lotSize)', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 100,
        "exitPrice": 110,
        "qtyInput": 50,
        "lotSize": 25,
        "equityUnitsMode": 1
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(500, 2);
        });

        test('EQ_PNL_9: [Regression & Known Risk Areas] Regression: actualQty takes precedence over qtyInput to prevent double multiplication', () => {
            const func = targetModule.calculateEquityPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 100,
        "exitPrice": 110,
        "actualQty": 50,
        "qtyInput": 2,
        "lotSize": 25
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(500, 2);
        });

    });

    describe('calculateMcxPnL()', () => {
        test('MCX_PNL_1: [Happy Path] MCX BUY profit with 1 lot of CRUDEOIL (lot 100)', () => {
            const func = targetModule.calculateMcxPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 6000,
        "exitPrice": 6050,
        "qty": 1,
        "lotSize": 100
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(5000, 2);
        });

        test('MCX_PNL_2: [Happy Path] MCX SELL profit with 2 lots of GOLD (lot 100)', () => {
            const func = targetModule.calculateMcxPnL || targetModule;
            const input = {
        "type": "SELL",
        "entryPrice": 72000,
        "exitPrice": 71800,
        "qty": 2,
        "lotSize": 100
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(40000, 2);
        });

        test('MCX_PNL_3: [Precision & Decimals] MCX SILVER Mini decimal tick calculation (lot 5)', () => {
            const func = targetModule.calculateMcxPnL || targetModule;
            const input = {
        "type": "SELL",
        "entryPrice": 85250.5,
        "exitPrice": 85300.5,
        "qty": 1,
        "lotSize": 5
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(-250, 2);
        });

        test('MCX_PNL_4: [Boundary & Zero Cases] MCX Zero price difference', () => {
            const func = targetModule.calculateMcxPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 6500,
        "exitPrice": 6500,
        "qty": 5,
        "lotSize": 100
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(0, 2);
        });

        test('MCX_PNL_5: [Financial Calculations] MCX with qtyInput preference over qty', () => {
            const func = targetModule.calculateMcxPnL || targetModule;
            const input = {
        "type": "BUY",
        "entryPrice": 100,
        "exitPrice": 110,
        "qtyInput": 3,
        "qty": 1,
        "lotSize": 100
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(3000, 2);
        });

    });
});
