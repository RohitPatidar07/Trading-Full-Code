/**
 * Ambiguity & Duplicate Detector
 * Detects collisions where multiple source contracts map to the same canonical identity or vice versa.
 */
class AmbiguityDetector {
    detectDuplicates(instruments = []) {
        const seenMap = new Map(); // canonicalId -> Array of instruments
        const duplicates = [];

        for (const inst of instruments) {
            const id = inst.canonicalId;
            if (!seenMap.has(id)) {
                seenMap.set(id, []);
            }
            seenMap.get(id).push(inst);
        }

        for (const [canonicalId, list] of seenMap.entries()) {
            if (list.length > 1) {
                duplicates.push({
                    canonicalId,
                    count: list.length,
                    instances: list.map(i => ({
                        source: i.source,
                        symbol: i.symbol,
                        sourceToken: i.sourceToken,
                        lotSize: i.lotSize,
                        expiry: i.expiry
                    }))
                });
            }
        }

        return duplicates;
    }
}

module.exports = new AmbiguityDetector();
