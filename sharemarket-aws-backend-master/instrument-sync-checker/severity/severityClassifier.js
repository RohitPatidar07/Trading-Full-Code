/**
 * Severity Classifier
 * Evaluates financial and operational impact of detected instrument discrepancies.
 */
class SeverityClassifier {
    classify(issueType, details = {}) {
        switch (issueType) {
            case 'LOT_SIZE_MISMATCH':
                // Lot size directly impacts margin requirements and realized P&L calculations
                return {
                    severity: 'CRITICAL',
                    reason: 'Lot size discrepancy alters physical contract unit sizing and multiplied financial P&L.'
                };

            case 'EXPIRY_MISMATCH':
                return {
                    severity: 'CRITICAL',
                    reason: 'Expiry discrepancy can cause early or delayed contract square-off, leading to wrong settlement prices.'
                };

            case 'STRIKE_MISMATCH':
            case 'OPTION_TYPE_MISMATCH':
                return {
                    severity: 'CRITICAL',
                    reason: 'Option strike or CE/PE type mismatch causes market data to bind to the wrong contract.'
                };

            case 'DUPLICATE_MAPPING':
                return {
                    severity: 'CRITICAL',
                    reason: 'Duplicate mapping causes collision in WebSocket tick routing and order placement.'
                };

            case 'EXCHANGE_MISMATCH':
            case 'SEGMENT_MISMATCH':
                return {
                    severity: 'HIGH',
                    reason: 'Exchange/Segment classification error changes brokerage and margin leverage rules.'
                };

            case 'MISSING_IN_EXTERNAL_SOURCE':
                return {
                    severity: 'HIGH',
                    reason: 'Active internal tradable scrip cannot receive live market ticks from source broker.'
                };

            case 'SOURCE_UNAVAILABLE':
                return {
                    severity: 'CRITICAL',
                    reason: 'External instrument data feed failed to load during pre-market synchronization.'
                };

            case 'TICK_SIZE_MISMATCH':
                return {
                    severity: 'MEDIUM',
                    reason: 'Minor tick size difference may reject limit orders outside tick intervals.'
                };

            case 'NEW_CONTRACT_DISCOVERED':
                return {
                    severity: 'INFO',
                    reason: 'Normal pre-market contract roll / new active strike introduced by exchange.'
                };

            case 'TOKEN_DRIFT':
            default:
                return {
                    severity: 'LOW',
                    reason: 'Source-specific internal token identifier variation.'
                };
        }
    }
}

module.exports = new SeverityClassifier();
