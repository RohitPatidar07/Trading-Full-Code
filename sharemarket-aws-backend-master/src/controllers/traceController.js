const orderTraceService = require('../services/OrderTraceService');

/**
 * Controller to handle order flow trace requests
 */
const getTradeTrace = async (req, res) => {
    try {
        const { tradeId } = req.params;
        if (!tradeId) {
            return res.status(400).json({ success: false, message: 'Trade ID is required' });
        }

        const traceResult = await orderTraceService.traceTrade(tradeId);

        if (!traceResult.success) {
            return res.status(404).json(traceResult);
        }

        res.json(traceResult);
    } catch (err) {
        console.error('[traceController] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error during order trace',
            error: err.message
        });
    }
};

module.exports = {
    getTradeTrace
};
