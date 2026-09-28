const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

module.exports = {
    PROJECT_ROOT,
    INSTRUMENT_SYNC_ENABLED: process.env.INSTRUMENT_SYNC_ENABLED !== 'false',
    INSTRUMENT_SYNC_CRON: process.env.INSTRUMENT_SYNC_CRON || '45 8 * * 1-5', // 08:45 AM IST Weekdays (Pre-market)
    INSTRUMENT_SYNC_TIMEZONE: process.env.INSTRUMENT_SYNC_TIMEZONE || 'Asia/Kolkata',
    
    // File Paths
    ZERODHA_DUMP_PATH: path.join(PROJECT_ROOT, 'data', 'instruments.json'),
    REPORTS_DIR: path.join(__dirname, '..', 'reports'),
    SNAPSHOTS_DIR: path.join(__dirname, '..', 'reports', 'snapshots'),
    
    // Performance & Safety Thresholds
    FETCH_TIMEOUT_MS: parseInt(process.env.INSTRUMENT_FETCH_TIMEOUT_MS || '15000', 10),
    MAX_RETRIES: 2,
    ALERT_MIN_SEVERITY: process.env.INSTRUMENT_ALERT_MIN_SEVERITY || 'HIGH', // CRITICAL or HIGH triggers alert
    
    // Supported Exchanges & Segments
    SUPPORTED_EXCHANGES: ['NSE', 'NFO', 'MCX', 'BFO', 'COMEX', 'FOREX', 'CRYPTO'],
    SUPPORTED_SEGMENTS: ['EQUITY', 'FUTURES', 'OPTIONS', 'COMMODITY', 'FOREX', 'CRYPTO']
};
