const db = require('../config/db');
const marketDataService = require('./MarketDataService');

/**
 * Service to handle Portfolio logic for Paper Trading.
 */
class PortfolioService {
    
    async getPositions(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM paper_positions WHERE user_id = ?', [userId]
        );

        // Enhance with live P&L
        return rows.map(pos => {
            const ltp = marketDataService.getPrice(pos.symbol)?.ltp;
            const livePrice = (ltp && parseFloat(ltp) > 0) ? parseFloat(ltp) : (pos.last_price ? parseFloat(pos.last_price) : parseFloat(pos.avg_price || 0));
            const pnl = (livePrice - parseFloat(pos.avg_price || 0)) * pos.quantity;
            return {
                ...pos,
                last_price: livePrice,
                pnl: parseFloat(pnl.toFixed(2))
            };
        });
    }

    async getHoldings(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM paper_holdings WHERE user_id = ?', [userId]
        );
        
        return rows.map(hold => {
            const ltp = marketDataService.getPrice(hold.symbol)?.ltp;
            const livePrice = (ltp && parseFloat(ltp) > 0) ? parseFloat(ltp) : (hold.last_price ? parseFloat(hold.last_price) : parseFloat(hold.avg_price || 0));
            const pnl = (livePrice - parseFloat(hold.avg_price || 0)) * hold.quantity;
            return {
                ...hold,
                last_price: livePrice,
                pnl: parseFloat(pnl.toFixed(2))
            };
        });
    }

    async getBalanceData(userId) {
        const [rows] = await db.execute(
            'SELECT balance, credit_limit FROM users WHERE id = ?', [userId]
        );
        return rows[0] || { balance: 0, credit_limit: 0 };
    }
}

module.exports = new PortfolioService();
