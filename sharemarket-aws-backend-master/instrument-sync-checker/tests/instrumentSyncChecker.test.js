const identityBuilder = require('../matching/identityBuilder');
const zerodhaNormalizer = require('../normalizers/zerodhaNormalizer');
const altiNormalizer = require('../normalizers/altiNormalizer');
const instrumentMatcher = require('../matching/instrumentMatcher');
const ambiguityDetector = require('../matching/ambiguityDetector');
const metadataComparator = require('../comparison/metadataComparator');
const driftDetector = require('../comparison/driftDetector');
const severityClassifier = require('../severity/severityClassifier');
const syncRunner = require('../runners/syncRunner');
const CanonicalInstrument = require('../normalizers/canonicalInstrument');

describe('Instrument Sync Checker Automated Test Suite', () => {

    describe('1. Normalization & Canonical Identity', () => {
        test('TC_01: Normalizes Zerodha Equity Cash contract', () => {
            const rawKite = {
                instrument_token: '738561',
                tradingsymbol: 'RELIANCE',
                name: 'RELIANCE INDUSTRIES',
                exchange: 'NSE',
                segment: 'NSE',
                instrument_type: 'EQ',
                lot_size: 1,
                tick_size: 0.05
            };
            const canonical = zerodhaNormalizer.normalize(rawKite);
            expect(canonical.canonicalId).toBe('NSE:EQ:RELIANCE');
            expect(canonical.exchange).toBe('NSE');
            expect(canonical.segment).toBe('EQUITY');
            expect(canonical.lotSize).toBe(1);
        });

        test('TC_02: Normalizes Zerodha NFO Options contract with CE type', () => {
            const rawKiteOpt = {
                instrument_token: '123456',
                tradingsymbol: 'BANKNIFTY26MAR50000CE',
                name: 'BANKNIFTY',
                exchange: 'NFO',
                segment: 'NFO-OPT',
                instrument_type: 'CE',
                expiry: '2026-03-26',
                strike: 50000,
                lot_size: 15,
                tick_size: 0.05
            };
            const canonical = zerodhaNormalizer.normalize(rawKiteOpt);
            expect(canonical.canonicalId).toBe('NFO:OPT:BANKNIFTY:2026-03-26:50000:CE');
            expect(canonical.segment).toBe('OPTIONS');
            expect(canonical.strike).toBe(50000);
            expect(canonical.optionType).toBe('CE');
        });

        test('TC_03: Normalizes Zerodha MCX Commodity Futures contract', () => {
            const rawKiteMcx = {
                instrument_token: '234567',
                tradingsymbol: 'CRUDEOIL26MARFUT',
                name: 'CRUDEOIL',
                exchange: 'MCX',
                segment: 'MCX-FUT',
                instrument_type: 'FUT',
                expiry: '2026-03-19',
                lot_size: 100,
                tick_size: 1
            };
            const canonical = zerodhaNormalizer.normalize(rawKiteMcx);
            expect(canonical.canonicalId).toBe('MCX:FUT:CRUDEOIL:2026-03-19');
            expect(canonical.segment).toBe('FUTURES');
            expect(canonical.lotSize).toBe(100);
        });

        test('TC_04: Normalizes Alti Foreign Commodity Scrip', () => {
            const rawAlti = {
                symbol: 'XAU/USD',
                category: 'COMMODITY',
                lot_size: 100
            };
            const canonical = altiNormalizer.normalize(rawAlti);
            expect(canonical.canonicalId).toBe('COMEX:COMMODITY:XAUUSD');
            expect(canonical.exchange).toBe('COMEX');
            expect(canonical.lotSize).toBe(100);
        });
    });

    describe('2. Matching Engine & Discrepancy Detection', () => {
        test('TC_05: Exact Instrument Match between Internal and Zerodha', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:INFY',
                exchange: 'NSE',
                segment: 'EQUITY',
                symbol: 'INFY',
                cleanSymbol: 'INFY',
                lotSize: 1
            });
            const external = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:INFY',
                exchange: 'NSE',
                segment: 'EQUITY',
                symbol: 'INFY',
                cleanSymbol: 'INFY',
                lotSize: 1
            });

            const matchResult = instrumentMatcher.match({
                internalList: [internal],
                zerodhaList: [external],
                altiList: []
            });

            expect(matchResult.exactMatches.length).toBe(1);
            expect(matchResult.missingInZerodha.length).toBe(0);
        });

        test('TC_06: Normalized Symbol Match with Exchange Prefix Difference', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:TCS',
                exchange: 'NSE',
                segment: 'EQUITY',
                symbol: 'NSE:TCS',
                cleanSymbol: 'TCS',
                lotSize: 1
            });
            const external = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:TCS',
                exchange: 'NSE',
                segment: 'EQUITY',
                symbol: 'TCS',
                cleanSymbol: 'TCS',
                lotSize: 1
            });

            const matchResult = instrumentMatcher.match({
                internalList: [internal],
                zerodhaList: [external],
                altiList: []
            });

            expect(matchResult.exactMatches.length + matchResult.normalizedMatches.length).toBe(1);
        });

        test('TC_07: Missing Instrument in Zerodha is flagged', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:OLD_DELISTED_STOCK',
                exchange: 'NSE',
                segment: 'EQUITY',
                symbol: 'OLD_DELISTED_STOCK',
                cleanSymbol: 'OLD_DELISTED_STOCK',
                lotSize: 1
            });

            const matchResult = instrumentMatcher.match({
                internalList: [internal],
                zerodhaList: [],
                altiList: []
            });

            expect(matchResult.missingInZerodha.length).toBe(1);
            expect(matchResult.missingInZerodha[0].cleanSymbol).toBe('OLD_DELISTED_STOCK');
        });

        test('TC_08: Duplicate Contract Mapping in Source is detected', () => {
            const inst1 = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:HDFCBANK',
                symbol: 'HDFCBANK',
                sourceToken: '1001'
            });
            const inst2 = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:HDFCBANK',
                symbol: 'HDFCBANK',
                sourceToken: '1002'
            });

            const duplicates = ambiguityDetector.detectDuplicates([inst1, inst2]);
            expect(duplicates.length).toBe(1);
            expect(duplicates[0].canonicalId).toBe('NSE:EQ:HDFCBANK');
            expect(duplicates[0].count).toBe(2);
        });
    });

    describe('3. Metadata Attribute Comparisons & Severity', () => {
        test('TC_09: Detects Lot Size Mismatch with CRITICAL Severity', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'MCX:FUT:SILVER:2026-05-05',
                symbol: 'SILVER26MAYFUT',
                cleanSymbol: 'SILVER26MAYFUT',
                lotSize: 30
            });
            const external = new CanonicalInstrument({
                canonicalId: 'MCX:FUT:SILVER:2026-05-05',
                symbol: 'SILVER26MAYFUT',
                cleanSymbol: 'SILVER26MAYFUT',
                lotSize: 5 // Mismatch: 30 vs 5
            });

            const issues = metadataComparator.compareMatches([{ internal, external, source: 'ZERODHA' }]);
            expect(issues.length).toBe(1);
            expect(issues[0].type).toBe('LOT_SIZE_MISMATCH');
            expect(issues[0].severity).toBe('CRITICAL');
        });

        test('TC_10: Detects Expiry Date Mismatch with CRITICAL Severity', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'NFO:FUT:NIFTY:2026-03-26',
                symbol: 'NIFTY26MARFUT',
                cleanSymbol: 'NIFTY26MARFUT',
                expiry: '2026-03-26',
                lotSize: 25
            });
            const external = new CanonicalInstrument({
                canonicalId: 'NFO:FUT:NIFTY:2026-03-26',
                symbol: 'NIFTY26MARFUT',
                cleanSymbol: 'NIFTY26MARFUT',
                expiry: '2026-03-27', // Mismatch
                lotSize: 25
            });

            const issues = metadataComparator.compareMatches([{ internal, external, source: 'ZERODHA' }]);
            expect(issues.length).toBe(1);
            expect(issues[0].type).toBe('EXPIRY_MISMATCH');
            expect(issues[0].severity).toBe('CRITICAL');
        });

        test('TC_11: Detects Strike Price Mismatch', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'NFO:OPT:NIFTY:2026-03-26:24000:CE',
                symbol: 'NIFTY26MAR24000CE',
                cleanSymbol: 'NIFTY26MAR24000CE',
                strike: 24000,
                lotSize: 25
            });
            const external = new CanonicalInstrument({
                canonicalId: 'NFO:OPT:NIFTY:2026-03-26:24000:CE',
                symbol: 'NIFTY26MAR24000CE',
                cleanSymbol: 'NIFTY26MAR24000CE',
                strike: 24500, // Mismatch
                lotSize: 25
            });

            const issues = metadataComparator.compareMatches([{ internal, external, source: 'ZERODHA' }]);
            expect(issues.length).toBe(1);
            expect(issues[0].type).toBe('STRIKE_MISMATCH');
            expect(issues[0].severity).toBe('CRITICAL');
        });

        test('TC_12: Detects Exchange Mismatch with HIGH Severity', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:SBIN',
                exchange: 'NSE',
                symbol: 'SBIN',
                cleanSymbol: 'SBIN',
                lotSize: 1
            });
            const external = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:SBIN',
                exchange: 'BSE', // Mismatch
                symbol: 'SBIN',
                cleanSymbol: 'SBIN',
                lotSize: 1
            });

            const issues = metadataComparator.compareMatches([{ internal, external, source: 'ZERODHA' }]);
            expect(issues.length).toBe(1);
            expect(issues[0].type).toBe('EXCHANGE_MISMATCH');
            expect(issues[0].severity).toBe('HIGH');
        });

        test('TC_13: Detects Tick Size Mismatch with MEDIUM Severity', () => {
            const internal = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:WIPRO',
                symbol: 'WIPRO',
                cleanSymbol: 'WIPRO',
                tickSize: 0.05
            });
            const external = new CanonicalInstrument({
                canonicalId: 'NSE:EQ:WIPRO',
                symbol: 'WIPRO',
                cleanSymbol: 'WIPRO',
                tickSize: 0.10 // Mismatch
            });

            const issues = metadataComparator.compareMatches([{ internal, external, source: 'ZERODHA' }]);
            expect(issues.length).toBe(1);
            expect(issues[0].type).toBe('TICK_SIZE_MISMATCH');
            expect(issues[0].severity).toBe('MEDIUM');
        });
    });

    describe('4. Daily Drift & End-to-End Orchestration', () => {
        test('TC_14: Drift Detector identifies new contract discovery', () => {
            const current = [
                new CanonicalInstrument({ canonicalId: 'NFO:FUT:NIFTY:2026-04-30', cleanSymbol: 'NIFTY26APRFUT', lotSize: 25 }),
                new CanonicalInstrument({ canonicalId: 'NFO:FUT:NIFTY:2026-05-28', cleanSymbol: 'NIFTY26MAYFUT', lotSize: 25 })
            ];

            // Non-existent previous snapshot file to test fresh initial baseline
            const drift = driftDetector.detectDrift(current, '/tmp/non_existent_snapshot.json');
            expect(drift.hasPreviousSnapshot).toBe(false);
        });

        test('TC_15: End-to-End Sync Runner distinguishes Clean vs Mismatch status', async () => {
            const mockInternal = [
                { symbol: 'RELIANCE', lot_size: 1, market_type: 'EQUITY' }
            ];
            const mockZerodha = [
                { tradingsymbol: 'RELIANCE', exchange: 'NSE', segment: 'NSE', lot_size: 1, instrument_type: 'EQ' }
            ];
            const mockAlti = [
                { symbol: 'XAU/USD', category: 'COMMODITY', lot_size: 100 }
            ];

            const result = await syncRunner.runSyncCheck({
                dryRun: true,
                customInternal: mockInternal,
                customZerodha: mockZerodha,
                customAlti: mockAlti
            });

            expect(result.success).toBe(true);
            expect(result.status).toBe('SYNC_COMPLETED_CLEAN');
            expect(result.issues.length).toBe(0);
        });

        test('TC_16: End-to-End Sync Runner flags status MISMATCHES_FOUND on lot-size error', async () => {
            const mockInternal = [
                { symbol: 'SILVER', lot_size: 30, market_type: 'MCX' }
            ];
            const mockZerodha = [
                { tradingsymbol: 'SILVER', exchange: 'MCX', segment: 'MCX-FUT', lot_size: 5, instrument_type: 'FUT' }
            ];

            const result = await syncRunner.runSyncCheck({
                dryRun: true,
                customInternal: mockInternal,
                customZerodha: mockZerodha,
                customAlti: []
            });

            expect(result.success).toBe(true);
            expect(result.status).toBe('MISMATCHES_FOUND');
            expect(result.issues.some(i => i.type === 'LOT_SIZE_MISMATCH')).toBe(true);
        });
    });
});
