/**
 * AUTO-GENERATED TEST SUITE BY test-generator
 * Target: src/utils/brokerageHelper.js
 * Domain: BROKERAGE_CALCULATIONS
 * Generated: 2026-09-26T07:10:52.292Z
 */

const targetModule = require('../../src/utils/brokerageHelper.js');

describe('brokerageHelper Financial & Domain Unit Tests', () => {

    describe('calcBrokerageFromRate()', () => {
        test('BRK_1: [Happy Path] PER_LOT Brokerage for 5 lots at 20/lot', () => {
            const func = targetModule.calcBrokerageFromRate || targetModule;
            const input = {
        "rate": 20,
        "brokerageType": "PER_LOT",
        "qty": 5,
        "lotSize": 25
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(100, 2);
        });

        test('BRK_2: [Happy Path] PER_CRORE Turnover Brokerage on Indian Equity (1 Crore turnover at 800/Cr)', () => {
            const func = targetModule.calcBrokerageFromRate || targetModule;
            const input = {
        "rate": 800,
        "brokerageType": "PER_CRORE",
        "actualQty": 10000,
        "entryPrice": 500,
        "exitPrice": 500,
        "isIndianSegment": true
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(800, 2);
        });

        test('BRK_3: [Financial Calculations] PER_LOT with isUnitMode calculates proportional fraction', () => {
            const func = targetModule.calcBrokerageFromRate || targetModule;
            const input = {
        "rate": 20,
        "brokerageType": "PER_LOT",
        "actualQty": 50,
        "lotSize": 100,
        "isUnitMode": true,
        "isIndianSegment": true
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(10, 2);
        });

        test('BRK_4: [Boundary & Zero Cases] Zero rate or zero quantity returns 0', () => {
            const func = targetModule.calcBrokerageFromRate || targetModule;
            const input = {
        "rate": 0,
        "brokerageType": "PER_LOT",
        "qty": 5
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(0, 2);
        });

        test('BRK_5: [Precision & Decimals] Fractional turnover brokerage', () => {
            const func = targetModule.calcBrokerageFromRate || targetModule;
            const input = {
        "rate": 800,
        "brokerageType": "PER_CRORE",
        "actualQty": 500,
        "entryPrice": 100,
        "exitPrice": 100,
        "isIndianSegment": true
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(8, 2);
        });

    });

    describe('calculateTradeBrokerage()', () => {
        test('TRD_BRK_1: [Happy Path] Option index default rate of 20/lot', () => {
            const func = targetModule.calculateTradeBrokerage || targetModule;
            const input = {
        "symbol": "NFO:BANKNIFTY26MAR50000CE",
        "marketType": "OPTIONS",
        "entryPrice": 250,
        "exitPrice": 300,
        "qty": 2,
        "lotSize": 15,
        "clientConfig": {}
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(40, 2);
        });

        test('TRD_BRK_2: [Happy Path] Equity default turnover rate (₹800/Cr)', () => {
            const func = targetModule.calculateTradeBrokerage || targetModule;
            const input = {
        "symbol": "NSE:RELIANCE",
        "marketType": "EQUITY",
        "entryPrice": 2000,
        "exitPrice": 2000,
        "actualQty": 100,
        "clientConfig": {}
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(32, 2);
        });

        test('TRD_BRK_3: [Financial Calculations] Priority 1: Scrip-specific rate override in clientConfig for MCX', () => {
            const func = targetModule.calculateTradeBrokerage || targetModule;
            const input = {
        "symbol": "MCX:CRUDEOIL26MARFUT",
        "marketType": "MCX",
        "entryPrice": 6000,
        "exitPrice": 6000,
        "qty": 2,
        "lotSize": 100,
        "clientConfig": {
                "mcxBrokerageType": "per_lot",
                "mcxLotBrokerage": {
                        "CRUDEOIL": 50
                }
        }
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(100, 2);
        });

        test('TRD_BRK_4: [Financial Calculations] Priority 2: user_segments table row override', () => {
            const func = targetModule.calculateTradeBrokerage || targetModule;
            const input = {
        "symbol": "MCX:GOLD",
        "marketType": "MCX",
        "entryPrice": 70000,
        "exitPrice": 70000,
        "qty": 1,
        "lotSize": 100,
        "clientConfig": {},
        "userSegmentRow": {
                "brokerage_type": "PER_LOT",
                "brokerage_value": "150"
        }
};
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result).toBeCloseTo(150, 2);
        });

    });

    describe('cleanSymbolName()', () => {
    });
});
