/**
 * Order Request Validation & Security Sanitizer Middleware
 * 
 * Enforces strict financial input validation and strips client-injected
 * calculation overrides before request reaches controllers.
 */

const FORBIDDEN_CLIENT_KEYS = [
    'lot_size_at_entry',
    'lot_size',
    'multiplier',
    'lotSize',
    'leverage_used',
    'leverage',
    'exposure',
    'holding_leverage',
    'intraday_leverage',
    'margin_used',
    'required_margin',
    'margin',
    'actual_qty'
];

const validateOrderRequest = (req, res, next) => {
    // 1. Check body existence
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Request body cannot be empty'
        });
    }

    // 2. Strip all forbidden client calculation fields
    for (const key of FORBIDDEN_CLIENT_KEYS) {
        if (key in req.body) {
            delete req.body[key];
        }
    }

    const { symbol, type, qty, quantity, price, order_type = 'MARKET' } = req.body;

    // 3. Required Fields Validation
    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'A valid trading symbol is required'
        });
    }

    if (!type || typeof type !== 'string' || !['BUY', 'SELL'].includes(type.toUpperCase())) {
        return res.status(400).json({
            success: false,
            message: 'Order type must be either BUY or SELL'
        });
    }

    // Check for conflicting qty vs quantity if both provided
    const hasQty = qty !== undefined && qty !== null && qty !== '';
    const hasQuantity = quantity !== undefined && quantity !== null && quantity !== '';

    if (!hasQty && !hasQuantity) {
        return res.status(400).json({
            success: false,
            message: 'Order quantity is required'
        });
    }

    if (hasQty && hasQuantity) {
        const numQty = Number(qty);
        const numQuantity = Number(quantity);
        if (numQty !== numQuantity) {
            return res.status(400).json({
                success: false,
                message: 'Conflicting order quantity fields provided (qty and quantity mismatch)'
            });
        }
    }

    // 4. Strict Integer Quantity Validation
    const rawQty = hasQty ? qty : quantity;
    const parsedQty = Number(rawQty);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantity must be a positive integer'
        });
    }

    // Normalize both fields for downstream handlers
    req.body.qty = parsedQty;
    req.body.quantity = parsedQty;

    // 5. Price Validation for LIMIT orders or specified prices
    if (price !== undefined && price !== null && price !== '') {
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive finite number'
            });
        }
    } else if (order_type.toUpperCase() === 'LIMIT') {
        return res.status(400).json({
            success: false,
            message: 'Price is required for LIMIT orders'
        });
    }

    next();
};

module.exports = validateOrderRequest;
