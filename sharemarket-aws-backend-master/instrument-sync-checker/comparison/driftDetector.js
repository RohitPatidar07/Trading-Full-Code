const fs = require('fs');
const path = require('path');
const config = require('../config/instrumentSyncConfig');
const severityClassifier = require('../severity/severityClassifier');

/**
 * Daily Drift Detector
 * Tracks changes between today's synchronized dataset and previous pre-market snapshots.
 */
class DriftDetector {
    detectDrift(currentInstruments = [], snapshotFilePath = null) {
        const snapshotPath = snapshotFilePath || path.join(config.SNAPSHOTS_DIR, 'latest_snapshot.json');
        
        if (!fs.existsSync(snapshotPath)) {
            return {
                hasPreviousSnapshot: false,
                newContracts: [],
                removedContracts: [],
                modifiedContracts: []
            };
        }

        try {
            const rawPrev = fs.readFileSync(snapshotPath, 'utf8');
            const prevList = JSON.parse(rawPrev);
            const prevMap = new Map();
            for (const p of prevList) {
                prevMap.set(p.canonicalId, p);
            }

            const currentMap = new Map();
            for (const c of currentInstruments) {
                currentMap.set(c.canonicalId, c);
            }

            const newContracts = [];
            const removedContracts = [];
            const modifiedContracts = [];

            // Find new and modified
            for (const [id, curr] of currentMap.entries()) {
                if (!prevMap.has(id)) {
                    newContracts.push({
                        canonicalId: id,
                        symbol: curr.cleanSymbol,
                        source: curr.source,
                        lotSize: curr.lotSize,
                        expiry: curr.expiry,
                        type: 'NEW_CONTRACT_DISCOVERED',
                        severity: 'INFO'
                    });
                } else {
                    const prev = prevMap.get(id);
                    if (prev.lotSize !== curr.lotSize) {
                        modifiedContracts.push({
                            canonicalId: id,
                            symbol: curr.cleanSymbol,
                            field: 'lotSize',
                            previous: prev.lotSize,
                            current: curr.lotSize,
                            type: 'UNEXPECTED_LOT_SIZE_DRIFT',
                            severity: 'CRITICAL',
                            potentialImpact: 'Live position calculation mismatch against yesterday trades'
                        });
                    }
                }
            }

            // Find removed
            for (const [id, prev] of prevMap.entries()) {
                if (!currentMap.has(id)) {
                    removedContracts.push({
                        canonicalId: id,
                        symbol: prev.cleanSymbol,
                        source: prev.source,
                        type: 'CONTRACT_EXPIRED_OR_DELISTED',
                        severity: 'LOW'
                    });
                }
            }

            return {
                hasPreviousSnapshot: true,
                newContracts,
                removedContracts,
                modifiedContracts
            };
        } catch (err) {
            console.error('⚠️ [DriftDetector] Failed to process previous snapshot:', err.message);
            return {
                hasPreviousSnapshot: false,
                error: err.message,
                newContracts: [],
                removedContracts: [],
                modifiedContracts: []
            };
        }
    }
}

module.exports = new DriftDetector();
