const severityClassifier = require('../severity/severityClassifier');

/**
 * Metadata Comparator
 * Compares matched internal vs external canonical instruments for attribute discrepancies.
 */
class MetadataComparator {
    compareMatches(matchedPairs = []) {
        const issues = [];

        for (const pair of matchedPairs) {
            const { internal, external, source } = pair;

            // 1. Lot Size Check
            if (internal.lotSize !== external.lotSize) {
                const classification = severityClassifier.classify('LOT_SIZE_MISMATCH');
                issues.push({
                    issueId: `LOT_SIZE_${internal.cleanSymbol}`,
                    type: 'LOT_SIZE_MISMATCH',
                    severity: classification.severity,
                    symbol: internal.cleanSymbol,
                    canonicalId: internal.canonicalId,
                    source,
                    expectedInternal: internal.lotSize,
                    actualExternal: external.lotSize,
                    description: `Internal lot size (${internal.lotSize}) does not match ${source} lot size (${external.lotSize}).`,
                    potentialImpact: classification.reason,
                    recommendation: 'Review scrip lot size configuration and sync with exchange master.'
                });
            }

            // 2. Expiry Check (for derivatives)
            if (internal.expiry && external.expiry && internal.expiry !== external.expiry) {
                const classification = severityClassifier.classify('EXPIRY_MISMATCH');
                issues.push({
                    issueId: `EXPIRY_${internal.cleanSymbol}`,
                    type: 'EXPIRY_MISMATCH',
                    severity: classification.severity,
                    symbol: internal.cleanSymbol,
                    canonicalId: internal.canonicalId,
                    source,
                    expectedInternal: internal.expiry,
                    actualExternal: external.expiry,
                    description: `Internal expiry date (${internal.expiry}) does not match ${source} expiry date (${external.expiry}).`,
                    potentialImpact: classification.reason,
                    recommendation: 'Update expiry date in scrip_data to prevent square-off misalignments.'
                });
            }

            // 3. Strike & Option Type Check
            if (internal.strike > 0 && external.strike > 0 && Math.abs(internal.strike - external.strike) > 0.01) {
                const classification = severityClassifier.classify('STRIKE_MISMATCH');
                issues.push({
                    issueId: `STRIKE_${internal.cleanSymbol}`,
                    type: 'STRIKE_MISMATCH',
                    severity: classification.severity,
                    symbol: internal.cleanSymbol,
                    canonicalId: internal.canonicalId,
                    source,
                    expectedInternal: internal.strike,
                    actualExternal: external.strike,
                    description: `Internal strike price (${internal.strike}) does not match ${source} (${external.strike}).`,
                    potentialImpact: classification.reason,
                    recommendation: 'Verify strike price parsing in scrip symbol.'
                });
            }

            // 4. Exchange Check
            if (internal.exchange !== external.exchange) {
                const classification = severityClassifier.classify('EXCHANGE_MISMATCH');
                issues.push({
                    issueId: `EXCHANGE_${internal.cleanSymbol}`,
                    type: 'EXCHANGE_MISMATCH',
                    severity: classification.severity,
                    symbol: internal.cleanSymbol,
                    canonicalId: internal.canonicalId,
                    source,
                    expectedInternal: internal.exchange,
                    actualExternal: external.exchange,
                    description: `Internal exchange (${internal.exchange}) does not match ${source} (${external.exchange}).`,
                    potentialImpact: classification.reason,
                    recommendation: 'Correct exchange segment routing.'
                });
            }

            // 5. Tick Size Check
            if (internal.tickSize > 0 && external.tickSize > 0 && Math.abs(internal.tickSize - external.tickSize) > 0.001) {
                const classification = severityClassifier.classify('TICK_SIZE_MISMATCH');
                issues.push({
                    issueId: `TICK_SIZE_${internal.cleanSymbol}`,
                    type: 'TICK_SIZE_MISMATCH',
                    severity: classification.severity,
                    symbol: internal.cleanSymbol,
                    canonicalId: internal.canonicalId,
                    source,
                    expectedInternal: internal.tickSize,
                    actualExternal: external.tickSize,
                    description: `Internal tick size (${internal.tickSize}) differs from ${source} (${external.tickSize}).`,
                    potentialImpact: classification.reason,
                    recommendation: 'Align tick precision with exchange tick size.'
                });
            }
        }

        return issues;
    }
}

module.exports = new MetadataComparator();
