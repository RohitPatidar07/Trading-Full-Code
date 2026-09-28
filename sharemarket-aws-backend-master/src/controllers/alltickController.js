const allTicksService = require('../services/allticks.service');

/**
 * Get real-time health and connection diagnostics for AllTick feed
 * GET /api/alltick/health
 */
const getAllTickHealth = async (req, res) => {
    try {
        // Optional active ping if requested by client
        if (req.query.ping === 'true') {
            await allTicksService.ping();
        }

        const health = allTicksService.getHealth();
        return res.status(200).json({
            success: true,
            data: health
        });
    } catch (err) {
        console.error('[ALLTICK_CTRL] Error getting health:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve AllTick health diagnostics',
            error: err.message
        });
    }
};

/**
 * Reconnect or restart AllTick integration service
 * POST /api/alltick/reconnect
 */
const reconnectAllTick = async (req, res) => {
    try {
        console.log(`[ALLTICK_CTRL] Reconnect triggered by user ${req.user?.id} (${req.user?.role})`);
        const health = await allTicksService.restart();
        return res.status(200).json({
            success: true,
            message: 'AllTick integration service successfully restarted and reconnected',
            data: health
        });
    } catch (err) {
        console.error('[ALLTICK_CTRL] Reconnect error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to restart AllTick service',
            error: err.message
        });
    }
};

/**
 * Get currently monitored symbols across segments
 * GET /api/alltick/symbols
 */
const getAllTickSymbols = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: {
                crypto: allTicksService.cryptoSymbols,
                forex: allTicksService.forexSymbols,
                commodity: allTicksService.commoditySymbols,
                total: allTicksService.cryptoSymbols.length + 
                       allTicksService.forexSymbols.length + 
                       allTicksService.commoditySymbols.length
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve symbol list',
            error: err.message
        });
    }
};

module.exports = {
    getAllTickHealth,
    reconnectAllTick,
    getAllTickSymbols
};
