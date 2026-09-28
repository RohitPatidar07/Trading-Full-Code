/**
 * Test Planner
 * Builds exhaustive test matrices for target modules.
 */
class TestPlanner {
    createPlan(analysis, businessRules) {
        const plan = {
            targetModule: analysis.relativePath,
            domain: businessRules.domain,
            rules: businessRules.rulesList,
            testSuites: []
        };

        for (const targetFunc of businessRules.testedTargets) {
            const suite = {
                functionName: targetFunc,
                categories: [
                    'Happy Path',
                    'Boundary & Zero Cases',
                    'Precision & Decimals',
                    'Financial Calculations',
                    'Regression & Known Risk Areas'
                ],
                scenarios: this._generateScenariosForFunction(targetFunc, businessRules.domain)
            };
            plan.testSuites.push(suite);
        }

        return plan;
    }

    _generateScenariosForFunction(funcName, domain) {
        const scenarios = [];

        if (funcName === 'calculateEquityPnL') {
            scenarios.push(
                { id: 'EQ_PNL_1', category: 'Happy Path', desc: 'BUY trade with profit', params: { type: 'BUY', entryPrice: 100, exitPrice: 120, actualQty: 50 }, expected: 1000 },
                { id: 'EQ_PNL_2', category: 'Happy Path', desc: 'BUY trade with loss', params: { type: 'BUY', entryPrice: 100, exitPrice: 80, actualQty: 50 }, expected: -1000 },
                { id: 'EQ_PNL_3', category: 'Happy Path', desc: 'SELL trade with profit (price drops)', params: { type: 'SELL', entryPrice: 500, exitPrice: 450, actualQty: 100 }, expected: 5000 },
                { id: 'EQ_PNL_4', category: 'Happy Path', desc: 'SELL trade with loss (price rises)', params: { type: 'SELL', entryPrice: 500, exitPrice: 550, actualQty: 100 }, expected: -5000 },
                { id: 'EQ_PNL_5', category: 'Boundary & Zero Cases', desc: 'Zero price change produces exactly 0 PnL', params: { type: 'BUY', entryPrice: 150.25, exitPrice: 150.25, actualQty: 200 }, expected: 0 },
                { id: 'EQ_PNL_6', category: 'Precision & Decimals', desc: 'Fractional prices with small tick movements', params: { type: 'BUY', entryPrice: 1234.55, exitPrice: 1234.80, actualQty: 100 }, expected: 25 },
                { id: 'EQ_PNL_7', category: 'Financial Calculations', desc: 'Lot mode conversion when actualQty is null (qtyInput * lotSize)', params: { type: 'BUY', entryPrice: 100, exitPrice: 110, qtyInput: 2, lotSize: 25, tradeMode: 'LOTS' }, expected: 500 },
                { id: 'EQ_PNL_8', category: 'Financial Calculations', desc: 'Unit mode with equityUnitsMode=1 (ignores lotSize)', params: { type: 'BUY', entryPrice: 100, exitPrice: 110, qtyInput: 50, lotSize: 25, equityUnitsMode: 1 }, expected: 500 },
                { id: 'EQ_PNL_9', category: 'Regression & Known Risk Areas', desc: 'Regression: actualQty takes precedence over qtyInput to prevent double multiplication', params: { type: 'BUY', entryPrice: 100, exitPrice: 110, actualQty: 50, qtyInput: 2, lotSize: 25 }, expected: 500 }
            );
        } else if (funcName === 'calculateMcxPnL') {
            scenarios.push(
                { id: 'MCX_PNL_1', category: 'Happy Path', desc: 'MCX BUY profit with 1 lot of CRUDEOIL (lot 100)', params: { type: 'BUY', entryPrice: 6000, exitPrice: 6050, qty: 1, lotSize: 100 }, expected: 5000 },
                { id: 'MCX_PNL_2', category: 'Happy Path', desc: 'MCX SELL profit with 2 lots of GOLD (lot 100)', params: { type: 'SELL', entryPrice: 72000, exitPrice: 71800, qty: 2, lotSize: 100 }, expected: 40000 },
                { id: 'MCX_PNL_3', category: 'Precision & Decimals', desc: 'MCX SILVER Mini decimal tick calculation (lot 5)', params: { type: 'SELL', entryPrice: 85250.50, exitPrice: 85300.50, qty: 1, lotSize: 5 }, expected: -250 },
                { id: 'MCX_PNL_4', category: 'Boundary & Zero Cases', desc: 'MCX Zero price difference', params: { type: 'BUY', entryPrice: 6500, exitPrice: 6500, qty: 5, lotSize: 100 }, expected: 0 },
                { id: 'MCX_PNL_5', category: 'Financial Calculations', desc: 'MCX with qtyInput preference over qty', params: { type: 'BUY', entryPrice: 100, exitPrice: 110, qtyInput: 3, qty: 1, lotSize: 100 }, expected: 3000 }
            );
        } else if (funcName === 'calculateUsdPnL') {
            scenarios.push(
                { id: 'USD_PNL_1', category: 'Happy Path', desc: 'XAU/USD Gold Profitable BUY (uses liveAsk / 0.90 discount)', params: { symbol: 'XAU/USD', type: 'BUY', entryPrice: 2000, exitPrice: 2050, qty: 1, lotSize: 100, liveAsk: 85.0 }, expected: { pnlUsd: 5000, pnlInr: 425000, usdInrRate: 85.0 } },
                { id: 'USD_PNL_2', category: 'Happy Path', desc: 'EUR/USD Loss BUY (uses liveBid / 1.10 premium)', params: { symbol: 'EUR/USD', type: 'BUY', entryPrice: 1.1000, exitPrice: 1.0900, qty: 1, lotSize: 100000, liveBid: 88.0 }, expected: { pnlUsd: -1000, pnlInr: -88000, usdInrRate: 88.0 } },
                { id: 'USD_PNL_3', category: 'Financial Calculations', desc: 'Direct USD/INR currency pair has no double conversion', params: { symbol: 'FOREX:USDINR', type: 'BUY', entryPrice: 83.50, exitPrice: 84.00, qty: 1, lotSize: 1000, liveAsk: 84.0 }, expected: { pnlInr: 500, usdInrRate: 1 } },
                { id: 'USD_PNL_4', category: 'Boundary & Zero Cases', desc: 'Zero price difference on foreign pair', params: { symbol: 'XAU/USD', type: 'BUY', entryPrice: 2000, exitPrice: 2000, qty: 1, lotSize: 100, fallbackUsdInr: 90.0 }, expected: { pnlUsd: 0, pnlInr: 0 } }
            );
        } else if (funcName === 'calcBrokerageFromRate') {
            scenarios.push(
                { id: 'BRK_1', category: 'Happy Path', desc: 'PER_LOT Brokerage for 5 lots at 20/lot', params: { rate: 20, brokerageType: 'PER_LOT', qty: 5, lotSize: 25 }, expected: 100 },
                { id: 'BRK_2', category: 'Happy Path', desc: 'PER_CRORE Turnover Brokerage on Indian Equity (1 Crore turnover at 800/Cr)', params: { rate: 800, brokerageType: 'PER_CRORE', actualQty: 10000, entryPrice: 500, exitPrice: 500, isIndianSegment: true }, expected: 800 },
                { id: 'BRK_3', category: 'Financial Calculations', desc: 'PER_LOT with isUnitMode calculates proportional fraction', params: { rate: 20, brokerageType: 'PER_LOT', actualQty: 50, lotSize: 100, isUnitMode: true, isIndianSegment: true }, expected: 10 },
                { id: 'BRK_4', category: 'Boundary & Zero Cases', desc: 'Zero rate or zero quantity returns 0', params: { rate: 0, brokerageType: 'PER_LOT', qty: 5 }, expected: 0 },
                { id: 'BRK_5', category: 'Precision & Decimals', desc: 'Fractional turnover brokerage', params: { rate: 800, brokerageType: 'PER_CRORE', actualQty: 500, entryPrice: 100, exitPrice: 100, isIndianSegment: true }, expected: 8 }
            );
        } else if (funcName === 'calculateTradeBrokerage') {
            scenarios.push(
                { id: 'TRD_BRK_1', category: 'Happy Path', desc: 'Option index default rate of 20/lot', params: { symbol: 'NFO:BANKNIFTY26MAR50000CE', marketType: 'OPTIONS', entryPrice: 250, exitPrice: 300, qty: 2, lotSize: 15, clientConfig: {} }, expected: 40 },
                { id: 'TRD_BRK_2', category: 'Happy Path', desc: 'Equity default turnover rate (₹800/Cr)', params: { symbol: 'NSE:RELIANCE', marketType: 'EQUITY', entryPrice: 2000, exitPrice: 2000, actualQty: 100, clientConfig: {} }, expected: 32 },
                { id: 'TRD_BRK_3', category: 'Financial Calculations', desc: 'Priority 1: Scrip-specific rate override in clientConfig for MCX', params: { symbol: 'MCX:CRUDEOIL26MARFUT', marketType: 'MCX', entryPrice: 6000, exitPrice: 6000, qty: 2, lotSize: 100, clientConfig: { mcxBrokerageType: 'per_lot', mcxLotBrokerage: { 'CRUDEOIL': 50 } } }, expected: 100 },
                { id: 'TRD_BRK_4', category: 'Financial Calculations', desc: 'Priority 2: user_segments table row override', params: { symbol: 'MCX:GOLD', marketType: 'MCX', entryPrice: 70000, exitPrice: 70000, qty: 1, lotSize: 100, clientConfig: {}, userSegmentRow: { brokerage_type: 'PER_LOT', brokerage_value: '150' } }, expected: 150 }
            );
        } else if (funcName === 'calculateSegmentMargin') {
            scenarios.push(
                { id: 'MARGIN_1', category: 'Happy Path', desc: 'Equity Intraday Margin (Turnover / 500x)', params: { marketType: 'EQUITY', symbol: 'NSE:INFY', price: 1500, qty: 100, lotSize: 1, isHolding: false, clientConfig: { equityIntradayMargin: '500' } }, expected: 300 },
                { id: 'MARGIN_2', category: 'Happy Path', desc: 'Equity Holding Margin (Turnover / 100x)', params: { marketType: 'EQUITY', symbol: 'NSE:INFY', price: 1500, qty: 100, lotSize: 1, isHolding: true, clientConfig: { equityHoldingMargin: '100' } }, expected: 1500 },
                { id: 'MARGIN_3', category: 'Financial Calculations', desc: 'MCX Per Lot Basis Margin Lookup', params: { marketType: 'MCX', symbol: 'MCX:GOLD26OCTFUT', price: 75000, qty: 2, lotSize: 100, isHolding: false, clientConfig: { mcxExposureType: 'PER_LOT_BASIS', mcxLotMargins: { 'GOLD': { INTRADAY: 30000, HOLDING: 60000 } } } }, expected: 60000 },
                { id: 'MARGIN_4', category: 'Boundary & Zero Cases', desc: 'Zero quantity returns 0 margin', params: { marketType: 'EQUITY', symbol: 'NSE:INFY', price: 1500, qty: 0 }, expected: 0 }
            );
        } else if (funcName === 'parseOptionSymbol') {
            scenarios.push(
                { id: 'OPT_SYM_1', category: 'Happy Path', desc: 'Standard monthly NIFTY CE option', params: 'NFO:NIFTY26MAR24000CE', expected: { root: 'NIFTY', strike: '24000', optionType: 'CE', expiry: '26MAR' } },
                { id: 'OPT_SYM_2', category: 'Happy Path', desc: 'Standard BANKNIFTY PE option', params: 'BANKNIFTY26APR52000PE', expected: { root: 'BANKNIFTY', strike: '52000', optionType: 'PE', expiry: '26APR' } },
                { id: 'OPT_SYM_3', category: 'Boundary & Zero Cases', desc: 'Non-option symbol returns null', params: 'NSE:RELIANCE', expected: null }
            );
        } else if (funcName === 'isOptionsSymbol') {
            scenarios.push(
                { id: 'IS_OPT_1', category: 'Happy Path', desc: 'True option symbol ending in digit + CE', params: 'BANKNIFTY56400CE', expected: true },
                { id: 'IS_OPT_2', category: 'Regression & Known Risk Areas', desc: 'Plain stock ending in CE/PE characters (RELIANCE) is NOT an option', params: 'RELIANCE', expected: false },
                { id: 'IS_OPT_3', category: 'Regression & Known Risk Areas', desc: 'Plain stock FINANCE is NOT an option', params: 'FINANCE', expected: false }
            );
        } else if (funcName === 'isSameInstrument') {
            scenarios.push(
                { id: 'SAME_INST_1', category: 'Happy Path', desc: 'Exact match with prefix difference', params: ['MCX:CRUDEOIL26MARFUT', 'CRUDEOIL26MARFUT'], expected: true },
                { id: 'SAME_INST_2', category: 'Happy Path', desc: 'Futures base scrip match', params: ['NFO:NIFTY26APRFUT', 'NIFTY FUT'], expected: true },
                { id: 'SAME_INST_3', category: 'Happy Path', desc: 'Different strikes are NOT the same instrument', params: ['BANKNIFTY26MAR50000CE', 'BANKNIFTY26MAR51000CE'], expected: false }
            );
        } else if (funcName === 'getWeekBoundaries') {
            scenarios.push(
                { id: 'WEEK_1', category: 'Happy Path', desc: 'Wednesday date boundaries', params: new Date('2026-03-25'), expected: { week_start: '2026-03-23', week_end: '2026-03-29' } },
                { id: 'WEEK_2', category: 'Boundary & Zero Cases', desc: 'Sunday date boundaries (maps to Monday of that ending week)', params: new Date('2026-03-29'), expected: { week_start: '2026-03-23', week_end: '2026-03-29' } },
                { id: 'WEEK_3', category: 'Boundary & Zero Cases', desc: 'Monday date boundaries (week start)', params: new Date('2026-03-23'), expected: { week_start: '2026-03-23', week_end: '2026-03-29' } }
            );
        }

        return scenarios;
    }
}

module.exports = new TestPlanner();
