/**
 * Business Rule Extractor
 * Extracts domain specific trading, brokerage, margin, and P&L rules from the inspected codebase.
 */
class BusinessRuleExtractor {
    extractRules(analysis) {
        const filePath = analysis.relativePath.toLowerCase();
        const rules = {
            domain: 'UNKNOWN',
            rulesList: [],
            testedTargets: []
        };

        if (filePath.includes('equitypnl')) {
            rules.domain = 'INDIAN_PNL';
            rules.rulesList = [
                'calculateEquityPnL: BUY PnL = (exitPrice - entryPrice) * totalShares',
                'calculateEquityPnL: SELL PnL = (entryPrice - exitPrice) * totalShares',
                'calculateEquityPnL: totalShares resolution follows actualQty -> (qtyInput * (isUnitMode ? 1 : lotSize)) -> qty',
                'calculateMcxPnL: Strictly traded in Lots * LotSize',
                'calculateMcxPnL: totalUnits = (qtyInput != null ? qtyInput : qty) * lotSize',
                'calculateMcxPnL: BUY PnL = (exitPrice - entryPrice) * totalUnits',
                'calculateMcxPnL: SELL PnL = (entryPrice - exitPrice) * totalUnits'
            ];
            rules.testedTargets = ['calculateEquityPnL', 'calculateMcxPnL'];
        } else if (filePath.includes('usdpnl')) {
            rules.domain = 'USD_INTERNATIONAL_PNL';
            rules.rulesList = [
                'calculateUsdPnL: pnlRaw = (BUY ? exit - entry : entry - exit) * lotSize * quantity',
                'Direct INR Pair (USD/INR): pnlInr = pnlRaw (no double conversion), usdInrRate = 1',
                'Foreign Pair Profit (pnlUsd >= 0): uses liveAsk or fallbackUsdInr * 0.90',
                'Foreign Pair Loss (pnlUsd < 0): uses liveBid or fallbackUsdInr * 1.10',
                'calculateCryptoPnL / calculateForexPnL / calculateComexPnL: wrappers around calculateUsdPnL'
            ];
            rules.testedTargets = ['calculateUsdPnL', 'calculateCryptoPnL', 'calculateForexPnL', 'calculateComexPnL'];
        } else if (filePath.includes('brokeragehelper')) {
            rules.domain = 'BROKERAGE_CALCULATIONS';
            rules.rulesList = [
                'calcBrokerageFromRate: PER_LOT / PER_UNIT = baseLotsCount * rate',
                'calcBrokerageFromRate: PER_CRORE = (TurnoverInr / 10,000,000) * rate',
                'calcBrokerageFromRate: Turnover = (entryPrice + exitPrice) * totalSharesOrUnits',
                'calcBrokerageFromRate: Foreign segment turnover converted via usdInrRate',
                'calculateTradeBrokerage: Priority 1: Scrip-specific rate from clientConfig (brokerMcxBrokerage / brokerEquityBrokerage)',
                'calculateTradeBrokerage: Priority 2: user_segments table row (Equity is forced to PER_CRORE)',
                'calculateTradeBrokerage: Priority 3: clientConfig defaults (Options index ₹20/lot, Equity ₹800/Cr turnover, MCX config)'
            ];
            rules.testedTargets = ['calcBrokerageFromRate', 'calculateTradeBrokerage', 'cleanSymbolName'];
        } else if (filePath.includes('segmentmargin')) {
            rules.domain = 'MARGIN_CALCULATIONS';
            rules.rulesList = [
                'calculateSegmentMargin: TradeType = isHolding ? HOLDING : INTRADAY',
                'PER_TURNOVER_BASIS: requiredMargin = turnover / exposureDivisor',
                'PER_LOT_BASIS: requiredMargin = lotCount * lotMargins[symbol][tradeType]',
                'PER_LOT_BASIS Fallback: turnover / exposureDivisor if lot margin not defined',
                'Auto-detects segment from symbol prefixes (MCX:, FOREX:, CRYPTO:, COMEX:) and CE/PE options'
            ];
            rules.testedTargets = ['calculateSegmentMargin', 'isMcxSymbol', 'isOptionsSymbol', 'getMcxBaseScrip'];
        } else if (filePath.includes('symbolhelper') || filePath.includes('segmenthelper')) {
            rules.domain = 'SYMBOL_AND_SEGMENT_PARSING';
            rules.rulesList = [
                'parseOptionSymbol: Extracts root, strike, optionType (CE/PE), and expiry date',
                'isOptionsSymbol: Requires a digit preceding CE/PE suffix to prevent false positives like RELIANCE',
                'isSameInstrument: Matches normalized symbols across prefixes, suffixes, and base scrips',
                'getMcxBaseScrip: Matches longest prefix from master MCX list'
            ];
            rules.testedTargets = ['parseOptionSymbol', 'isSameInstrument', 'getMcxBaseScrip', 'isOptionsSymbol'];
        } else if (filePath.includes('weeklysettlementservice')) {
            rules.domain = 'WEEKLY_SETTLEMENT_DATES';
            rules.rulesList = [
                'getWeekBoundaries: Returns Monday 00:00:00 (week_start) to Sunday 23:59:59 (week_end)',
                'getWeekBoundaries: Sunday maps to previous Monday (-6 days)'
            ];
            rules.testedTargets = ['getWeekBoundaries'];
        }

        return rules;
    }
}

module.exports = new BusinessRuleExtractor();
