const orderRepo = require('../repositories/OrderRepository');
const marketDataService = require('./MarketDataService');
const db = require('../config/db');
const { MCX_LOT_SIZES, getMcxBaseScrip } = require('../utils/symbolHelper');
const CommodityLotService = require('./CommodityLotService');

/**
 * Service to handle Order Management logic for Paper Trading.
 */
class OrderService {
    
    async placeOrder(userId, orderData) {
        // Security Guard: Strip all client-supplied lot sizes, leverages, and exposure overrides
        const forbiddenClientKeys = [
            'lot_size_at_entry', 'lot_size', 'multiplier', 'lotSize',
            'leverage_used', 'leverage', 'exposure', 'holding_leverage', 'intraday_leverage',
            'margin_used', 'required_margin', 'margin', 'actual_qty'
        ];
        for (const key of forbiddenClientKeys) {
            if (key in orderData) {
                delete orderData[key];
            }
        }

        const { symbol, type, order_type = 'MARKET', quantity, price } = orderData;
        
        if (!symbol || !type || quantity === undefined || quantity === null) {
            throw new Error('Missing required order fields');
        }

        // Validate Integer Quantity
        const qtyNum = Number(quantity);
        if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
            throw new Error('Quantity must be a positive integer');
        }

        // 1. Authoritative Instrument Lot Size Lookup from DB
        const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
        const [scripRows] = await db.execute(
            'SELECT market_type, lot_size FROM scrip_data WHERE symbol = ? OR symbol = ?',
            [symbol, cleanSymbol]
        );

        let authoritativeLotSize = null;
        let marketType = null;

        if (scripRows.length > 0) {
            marketType = scripRows[0].market_type || 'EQUITY';
            if (scripRows[0].lot_size && parseFloat(scripRows[0].lot_size) > 0) {
                authoritativeLotSize = parseFloat(scripRows[0].lot_size);
            } else if (marketType === 'EQUITY') {
                authoritativeLotSize = 1;
            }
        }

        const symUpper = symbol.toUpperCase();
        if ((!authoritativeLotSize || authoritativeLotSize <= 0) && (symUpper.startsWith('MCX:') || marketType === 'MCX')) {
            const baseSym = getMcxBaseScrip(symbol) || symUpper.replace('MCX:', '');
            if (MCX_LOT_SIZES[baseSym] && MCX_LOT_SIZES[baseSym] > 0) {
                authoritativeLotSize = MCX_LOT_SIZES[baseSym];
                marketType = 'MCX';
            }
        }

        if (!authoritativeLotSize || authoritativeLotSize <= 0) {
            const commInfo = CommodityLotService.getLotInfo(symbol);
            if (commInfo && commInfo.lot_size > 0) {
                authoritativeLotSize = commInfo.lot_size;
            }
        }

        const isNseEquity = marketType === 'EQUITY';

        // Fail-Closed Guard: Abort if lot size cannot be authoritatively resolved
        if (!authoritativeLotSize || isNaN(authoritativeLotSize) || authoritativeLotSize <= 0) {
            throw new Error('Invalid or missing instrument lot size in system master');
        }

        // Authoritative actual quantity calculation
        const isUnitsMode = isNseEquity && Number(orderData.equity_units_mode) === 1;
        const actualQuantity = isUnitsMode ? qtyNum : (qtyNum * authoritativeLotSize);

        // Validate Balance against authoritative cost
        const [userRows] = await db.execute(
            'SELECT balance FROM users WHERE id = ?', [userId]
        );
        const userBalance = parseFloat(userRows[0]?.balance || 0);
        
        const currentPrice = marketDataService.getPrice(symbol)?.ltp || parseFloat(price) || 0;
        const totalCost = currentPrice * actualQuantity;

        if (type.toUpperCase() === 'BUY' && userBalance < totalCost) {
            throw new Error(`Insufficient funds. Required: ₹${totalCost.toLocaleString()}, Available: ₹${userBalance.toLocaleString()}`);
        }

        const orderPrice = order_type === 'MARKET' ? currentPrice : parseFloat(price);

        return await orderRepo.createOrder(userId, {
            symbol,
            type: type.toUpperCase(),
            order_type,
            quantity: actualQuantity,
            price: orderPrice
        });
    }

    async getOrders(userId) {
        return await orderRepo.getOrdersByUserId(userId);
    }

    async cancelOrder(orderId, userId) {
        return await orderRepo.cancelOrder(orderId, userId);
    }
}

module.exports = new OrderService();
