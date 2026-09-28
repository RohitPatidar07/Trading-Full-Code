const crypto = require('crypto');
const cron = require('node-cron');
const config = require('../config/instrumentSyncConfig');
const zerodhaSource = require('../sources/zerodhaSource');
const altiSource = require('../sources/altiSource');
const internalSource = require('../sources/internalSource');
const instrumentMatcher = require('../matching/instrumentMatcher');
const metadataComparator = require('../comparison/metadataComparator');
const driftDetector = require('../comparison/driftDetector');
const syncReportGenerator = require('../reporters/syncReportGenerator');
const instrumentSyncAlert = require('../alerts/instrumentSyncAlert');

/**
 * Sync Runner
 * Master orchestration engine for pre-market instrument synchronization & drift checks.
 */
class SyncRunner {
    constructor() {
        this.isRunning = false;
    }

    async runSyncCheck({ dryRun = false, customZerodha = null, customAlti = null, customInternal = null } = {}) {
        if (this.isRunning) {
            console.log('⚠️ [SyncRunner] Sync check already in progress, skipping concurrent trigger...');
            return { status: 'ALREADY_RUNNING' };
        }

        this.isRunning = true;
        const startTime = new Date();
        const runId = `SYNC_${startTime.toISOString().replace(/[:.]/g, '-')}_${crypto.randomBytes(3).toString('hex')}`;

        console.log(`\n======================================================`);
        console.log(`🚀 [SyncRunner] STARTING INSTRUMENT SYNC CHECK (${runId})`);
        console.log(`======================================================`);

        try {
            // 1. Fetch Sources
            console.log(`📡 [1/6] Loading source instrument master data...`);
            const [zerodhaRes, altiRes, internalRes] = await Promise.all([
                zerodhaSource.fetchInstruments(customZerodha),
                altiSource.fetchInstruments(customAlti),
                internalSource.fetchInstruments(customInternal)
            ]);

            // If primary sources failed to load, report SYNC_FAILURE (Never report clean if source failed)
            if (!zerodhaRes.success && !altiRes.success) {
                console.error(`❌ [SyncRunner] All external sources failed to load!`);
                const failureStatus = 'SYNC_FAILED_SOURCES_UNAVAILABLE';
                await instrumentSyncAlert.dispatchAlert({
                    status: failureStatus,
                    issues: [{ severity: 'CRITICAL', symbol: 'ALL', type: 'SOURCE_UNAVAILABLE', description: zerodhaRes.error || altiRes.error }],
                    runId
                });
                return {
                    success: false,
                    status: failureStatus,
                    runId,
                    errors: { zerodha: zerodhaRes.error, alti: altiRes.error }
                };
            }

            // 2. Perform Canonical Matching
            console.log(`🔍 [2/6] Matching internal registry against external masters...`);
            const matchingResults = instrumentMatcher.match({
                internalList: internalRes.normalized || [],
                zerodhaList: zerodhaRes.normalized || [],
                altiList: altiRes.normalized || []
            });

            // 3. Metadata Comparison
            console.log(`📐 [3/6] Comparing contract metadata (lot size, strike, expiry, tick size)...`);
            const allMatched = [...matchingResults.exactMatches, ...matchingResults.normalizedMatches];
            const metadataIssues = metadataComparator.compareMatches(allMatched);

            // Add missing tradable scrips to issues list
            for (const missing of matchingResults.missingInZerodha) {
                metadataIssues.push({
                    issueId: `MISSING_ZERODHA_${missing.cleanSymbol}`,
                    type: 'MISSING_IN_EXTERNAL_SOURCE',
                    severity: 'HIGH',
                    symbol: missing.cleanSymbol,
                    canonicalId: missing.canonicalId,
                    source: 'ZERODHA',
                    expectedInternal: missing.lotSize,
                    actualExternal: 'NOT_FOUND',
                    description: `Internal tradable scrip ${missing.cleanSymbol} was not found in Zerodha active master.`,
                    potentialImpact: 'Scrip will not receive live market quotes during trading hours.',
                    recommendation: 'Verify if contract has expired or tradingsymbol is renamed in Zerodha dump.'
                });
            }

            // Add duplicate mappings
            for (const dup of matchingResults.duplicates.internal) {
                metadataIssues.push({
                    issueId: `DUP_INTERNAL_${dup.canonicalId}`,
                    type: 'DUPLICATE_MAPPING',
                    severity: 'CRITICAL',
                    symbol: dup.canonicalId,
                    canonicalId: dup.canonicalId,
                    source: 'INTERNAL',
                    expectedInternal: 'UNIQUE',
                    actualExternal: `${dup.count} DUPLICATES`,
                    description: `Found ${dup.count} conflicting duplicate records for canonical ID ${dup.canonicalId}.`,
                    potentialImpact: 'Ambiguous market data routing and order execution collision.',
                    recommendation: 'Deduplicate scrip_data records.'
                });
            }

            // 4. Drift Detection
            console.log(`📊 [4/6] Performing daily drift detection against reference snapshot...`);
            const driftResults = driftDetector.detectDrift(zerodhaRes.normalized || []);

            // 5. Determine Overall Status
            let status = 'SYNC_COMPLETED_CLEAN';
            const hasCritical = metadataIssues.some(i => i.severity === 'CRITICAL');
            const hasHigh = metadataIssues.some(i => i.severity === 'HIGH');
            if (hasCritical || hasHigh || metadataIssues.length > 0) {
                status = 'MISMATCHES_FOUND';
            }

            // 6. Generate Report
            console.log(`📄 [5/6] Generating audit synchronization report...`);
            const reportData = syncReportGenerator.generateReport({
                status,
                runId,
                startTime,
                endTime: new Date(),
                sources: { zerodha: zerodhaRes, alti: altiRes, internal: internalRes },
                matchingResults,
                metadataIssues,
                driftResults,
                dryRun
            });

            // 7. Dispatch Alerts
            console.log(`🚨 [6/6] Evaluating pre-market alert triggers...`);
            await instrumentSyncAlert.dispatchAlert({
                status,
                issues: metadataIssues,
                runId,
                reportPath: reportData.reportMdPath
            });

            console.log(`\n======================================================`);
            console.log(`🏁 [SyncRunner] SYNC CHECK COMPLETED: [${status}]`);
            console.log(`   Report: ${reportData.reportMdPath}`);
            console.log(`======================================================\n`);

            return {
                success: true,
                status,
                runId,
                matchingResults,
                issues: metadataIssues,
                driftResults,
                reportPath: reportData.reportMdPath
            };
        } catch (err) {
            console.error(`❌ [SyncRunner] Execution failed with exception:`, err);
            return {
                success: false,
                status: 'SYNC_EXCEPTION_ERROR',
                runId,
                error: err.message
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Schedules the pre-market sync check cron job.
     */
    startPreMarketCronJob() {
        if (!config.INSTRUMENT_SYNC_ENABLED) {
            console.log('ℹ️ [SyncRunner] Instrument sync cron is disabled via config.');
            return;
        }

        console.log(`⏰ [SyncRunner] Scheduling pre-market instrument sync cron (${config.INSTRUMENT_SYNC_CRON}) in timezone ${config.INSTRUMENT_SYNC_TIMEZONE}...`);
        cron.schedule(config.INSTRUMENT_SYNC_CRON, async () => {
            console.log(`⏰ [SyncRunner] Triggering scheduled pre-market instrument sync check...`);
            await this.runSyncCheck({ dryRun: false });
        }, {
            timezone: config.INSTRUMENT_SYNC_TIMEZONE
        });
        console.log(`✅ [SyncRunner] Pre-market cron job active.`);
    }
}

module.exports = new SyncRunner();
