const ambiguityDetector = require('./ambiguityDetector');

/**
 * High-Performance Indexed Instrument Matcher
 * Compares canonical representations of Internal DB vs Zerodha vs Alti datasets.
 */
class InstrumentMatcher {
    match({ internalList = [], zerodhaList = [], altiList = [] }) {
        // Build O(1) Lookup Maps
        const zerodhaMap = new Map(); // canonicalId -> Zerodha instrument
        const zerodhaSymbolMap = new Map(); // cleanSymbol -> Zerodha instrument
        for (const z of zerodhaList) {
            zerodhaMap.set(z.canonicalId, z);
            zerodhaSymbolMap.set(z.cleanSymbol, z);
        }

        const altiMap = new Map(); // canonicalId -> Alti instrument
        const altiSymbolMap = new Map(); // cleanSymbol / normSymbol -> Alti instrument
        for (const a of altiList) {
            altiMap.set(a.canonicalId, a);
            altiSymbolMap.set(a.cleanSymbol, a);
            const norm = a.cleanSymbol.replace(/[\s\/\_\-]+/g, '');
            if (norm !== a.cleanSymbol) {
                altiSymbolMap.set(norm, a);
            }
        }

        const exactMatches = [];
        const normalizedMatches = [];
        const missingInZerodha = [];
        const missingInAlti = [];
        const unmatchedInternal = [];
        const ambiguousMatches = [];

        for (const internal of internalList) {
            const isForeign = ['COMEX', 'FOREX', 'CRYPTO', 'COMMODITY'].includes(internal.exchange) || 
                              ['FOREX', 'CRYPTO', 'COMMODITY'].includes(internal.segment);

            if (isForeign) {
                // Foreign matching against Alti
                let matchedAlti = altiMap.get(internal.canonicalId) || null;
                let matchType = 'MATCHED_EXACT';

                if (!matchedAlti) {
                    matchedAlti = altiSymbolMap.get(internal.cleanSymbol) || 
                                  altiSymbolMap.get(internal.cleanSymbol.replace(/[\s\/\_\-]+/g, '')) || null;
                    if (matchedAlti) matchType = 'MATCHED_NORMALIZED';
                }

                if (matchedAlti) {
                    if (matchType === 'MATCHED_EXACT') {
                        exactMatches.push({ internal, external: matchedAlti, source: 'ALTI' });
                    } else {
                        normalizedMatches.push({ internal, external: matchedAlti, source: 'ALTI' });
                    }
                } else {
                    missingInAlti.push(internal);
                    unmatchedInternal.push(internal);
                }
            } else {
                // Domestic Indian matching against Zerodha
                let matchedZerodha = zerodhaMap.get(internal.canonicalId) || null;
                let matchType = 'MATCHED_EXACT';

                if (!matchedZerodha) {
                    matchedZerodha = zerodhaSymbolMap.get(internal.cleanSymbol) || null;
                    if (matchedZerodha) matchType = 'MATCHED_NORMALIZED';
                }

                if (matchedZerodha) {
                    if (matchType === 'MATCHED_EXACT') {
                        exactMatches.push({ internal, external: matchedZerodha, source: 'ZERODHA' });
                    } else {
                        normalizedMatches.push({ internal, external: matchedZerodha, source: 'ZERODHA' });
                    }
                } else {
                    missingInZerodha.push(internal);
                    unmatchedInternal.push(internal);
                }
            }
        }

        // Duplicate checks
        const internalDuplicates = ambiguityDetector.detectDuplicates(internalList);
        const zerodhaDuplicates = ambiguityDetector.detectDuplicates(zerodhaList);

        return {
            exactMatches,
            normalizedMatches,
            missingInZerodha,
            missingInAlti,
            unmatchedInternal,
            ambiguousMatches,
            duplicates: {
                internal: internalDuplicates,
                zerodha: zerodhaDuplicates
            },
            counts: {
                totalInternal: internalList.length,
                totalZerodha: zerodhaList.length,
                totalAlti: altiList.length,
                exactMatches: exactMatches.length,
                normalizedMatches: normalizedMatches.length,
                missingInZerodha: missingInZerodha.length,
                missingInAlti: missingInAlti.length
            }
        };
    }
}

module.exports = new InstrumentMatcher();
