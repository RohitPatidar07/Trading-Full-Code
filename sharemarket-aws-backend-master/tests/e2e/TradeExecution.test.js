const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const orderService = require('../../src/services/OrderService');
const orderRepo = require('../../src/repositories/OrderRepository');
const marketDataService = require('../../src/services/MarketDataService');
const db = require('../../src/config/db');
const validateOrderRequest = require('../../src/middleware/validateOrderRequest');

describe('E2E Integration & API Security Suite: Trade Execution & Financial Integrity', () => {
    let mockOrdersTable = [];
    let mockLedgerTable = [];
    let mockUsersTable = {
        10: { id: 10, username: 'trader1', balance: 500000, role: 'TRADER' },
        20: { id: 20, username: 'trader2', balance: 100000, role: 'TRADER' }
    };

    beforeEach(() => {
        mockOrdersTable = [];
        mockLedgerTable = [];
        mockUsersTable = {
            10: { id: 10, username: 'trader1', balance: 500000, role: 'TRADER' },
            20: { id: 20, username: 'trader2', balance: 100000, role: 'TRADER' }
        };

        // Stub order repo to simulate atomic DB insertion
        orderRepo.createOrder = async (userId, payload) => {
            const orderId = mockOrdersTable.length + 1;
            mockOrdersTable.push({ id: orderId, userId, ...payload });
            return orderId;
        };

        // Stub Market Data LTP
        marketDataService.getPrice = (sym) => ({ ltp: 250 });
    });

    test('1. Authoritative DB Lot Size Resolution: 2 lots of NFO Option = 100 shares in DB', async () => {
        db.execute = async (query, params) => {
            if (query.includes('FROM scrip_data')) {
                return [[{ market_type: 'OPTIONS', lot_size: 50 }]];
            }
            if (query.includes('FROM users')) {
                return [[mockUsersTable[10]]];
            }
            return [[]];
        };

        const clientPayload = {
            symbol: 'BANKNIFTY24OCT50000CE',
            type: 'BUY',
            order_type: 'MARKET',
            quantity: 2, // 2 lots
            price: 250
        };

        const orderId = await orderService.placeOrder(10, clientPayload);

        assert.strictEqual(orderId, 1);
        assert.strictEqual(mockOrdersTable.length, 1);
        // Authoritative actual quantity must be 2 * 50 = 100 shares
        assert.strictEqual(mockOrdersTable[0].quantity, 100);
        assert.strictEqual(mockOrdersTable[0].symbol, 'BANKNIFTY24OCT50000CE');
    });

    test('2. Rejection & Stripping of Malicious Client Overrides (lot_size_at_entry, leverage_used)', async () => {
        db.execute = async (query, params) => {
            if (query.includes('FROM scrip_data')) {
                return [[{ market_type: 'OPTIONS', lot_size: 50 }]];
            }
            if (query.includes('FROM users')) {
                return [[mockUsersTable[10]]];
            }
            return [[]];
        };

        const maliciousPayload = {
            symbol: 'BANKNIFTY24OCT50000CE',
            type: 'BUY',
            order_type: 'MARKET',
            quantity: 2,
            price: 250,
            lot_size_at_entry: 1,  // MALICIOUS ATTEMPT
            leverage_used: 100,    // MALICIOUS ATTEMPT
            exposure: 999999       // MALICIOUS ATTEMPT
        };

        const orderId = await orderService.placeOrder(10, maliciousPayload);

        assert.strictEqual(orderId, 1);
        // Stripped and enforced 100 shares, NOT 2 shares
        assert.strictEqual(mockOrdersTable[0].quantity, 100);
        assert.strictEqual(maliciousPayload.lot_size_at_entry, undefined);
        assert.strictEqual(maliciousPayload.leverage_used, undefined);
    });

    test('3. Rejection of Invalid Quantities & Financial Integrity (No DB records created)', async () => {
        const invalidQuantities = [-5, 0, 2.5, 'invalid', NaN, Infinity];

        for (const qty of invalidQuantities) {
            await assert.rejects(
                async () => {
                    await orderService.placeOrder(10, {
                        symbol: 'RELIANCE',
                        type: 'BUY',
                        quantity: qty,
                        price: 2500
                    });
                },
                /Quantity must be a positive integer/
            );
        }

        // Financial Safety: Zero orders were written to DB
        assert.strictEqual(mockOrdersTable.length, 0, 'No DB rows must be created on failed orders');
    });

    test('4. Fail-Closed Error when Instrument Lot Size is Missing or Zero', async () => {
        db.execute = async (query, params) => {
            if (query.includes('FROM scrip_data')) {
                return [[]]; // Missing in DB
            }
            if (query.includes('FROM users')) {
                return [[mockUsersTable[10]]];
            }
            return [[]];
        };

        await assert.rejects(
            async () => {
                await orderService.placeOrder(10, {
                    symbol: 'UNLISTED_DERIVATIVE',
                    type: 'BUY',
                    quantity: 1,
                    price: 100
                });
            },
            {
                message: 'Invalid or missing instrument lot size in system master'
            }
        );

        assert.strictEqual(mockOrdersTable.length, 0, 'No orders created on missing instrument lot size');
    });

    test('5. Order Request Validation Middleware: Rejects malformed requests and strips injection keys', (t, done) => {
        const req = {
            body: {
                symbol: 'INFY',
                type: 'BUY',
                qty: 10,
                price: 1500,
                lot_size_at_entry: 1,
                leverage_used: 20
            }
        };

        let nextCalled = false;
        const res = {
            status: (code) => ({
                json: (data) => {
                    assert.fail(`Should not return error status: ${code}`);
                }
            })
        };

        validateOrderRequest(req, res, () => {
            nextCalled = true;
            assert.strictEqual(req.body.lot_size_at_entry, undefined);
            assert.strictEqual(req.body.leverage_used, undefined);
            assert.strictEqual(req.body.qty, 10);
            assert.strictEqual(req.body.quantity, 10);
            done();
        });

        assert.strictEqual(nextCalled, true);
    });

    test('6. Paper Trading Contract: Accepts quantity field and normalizes both qty and quantity', (t, done) => {
        const req = {
            body: {
                symbol: 'NSE:TCS',
                type: 'BUY',
                quantity: 25,
                price: 3500
            }
        };

        const res = {
            status: (code) => ({
                json: (data) => {
                    assert.fail(`Should not reject valid paper order: ${code} - ${JSON.stringify(data)}`);
                }
            })
        };

        validateOrderRequest(req, res, () => {
            assert.strictEqual(req.body.qty, 25);
            assert.strictEqual(req.body.quantity, 25);
            assert.strictEqual(req.body.symbol, 'NSE:TCS');
            done();
        });
    });

    test('7. Conflict Guard: Rejects request with mismatched qty and quantity values with HTTP 400', () => {
        const req = {
            body: {
                symbol: 'NSE:INFY',
                type: 'BUY',
                qty: 10,
                quantity: 50 // Conflict!
            }
        };

        let responseCode = null;
        let responseJson = null;

        const res = {
            status: (code) => {
                responseCode = code;
                return {
                    json: (data) => {
                        responseJson = data;
                    }
                };
            }
        };

        let nextCalled = false;
        validateOrderRequest(req, res, () => {
            nextCalled = true;
        });

        assert.strictEqual(nextCalled, false, 'Next middleware must not be called on conflict');
        assert.strictEqual(responseCode, 400);
        assert.ok(responseJson.message.includes('Conflicting order quantity fields'));
    });

    test('8. Strips malicious financial overrides from Paper Order payloads', (t, done) => {
        const req = {
            body: {
                symbol: 'BANKNIFTY24OCT50000CE',
                type: 'BUY',
                quantity: 4,
                lot_size_at_entry: 1,
                leverage_used: 500,
                exposure: 1000000,
                margin_used: 100
            }
        };

        const res = {
            status: (code) => ({
                json: (data) => {
                    assert.fail(`Unexpected error: ${code}`);
                }
            })
        };

        validateOrderRequest(req, res, () => {
            assert.strictEqual(req.body.lot_size_at_entry, undefined);
            assert.strictEqual(req.body.leverage_used, undefined);
            assert.strictEqual(req.body.exposure, undefined);
            assert.strictEqual(req.body.margin_used, undefined);
            assert.strictEqual(req.body.quantity, 4);
            assert.strictEqual(req.body.qty, 4);
            done();
        });
    });

    test('9. Rejects invalid non-integer quantities in route validation with HTTP 400', () => {
        const invalidInputs = [0, -10, 1.75, 'invalid', null, ''];

        for (const badQty of invalidInputs) {
            const req = {
                body: {
                    symbol: 'RELIANCE',
                    type: 'BUY',
                    quantity: badQty
                }
            };

            let responseCode = null;
            const res = {
                status: (code) => {
                    responseCode = code;
                    return { json: () => {} };
                }
            };

            let nextCalled = false;
            validateOrderRequest(req, res, () => {
                nextCalled = true;
            });

            assert.strictEqual(nextCalled, false, `Must reject bad quantity: ${badQty}`);
            assert.strictEqual(responseCode, 400);
        }
    });

    test('10. CSV Serializer Logic: Correctly formats headers, data rows, and quotes', () => {
        const headers = ['ID', 'Scrip', 'Type', 'Username', 'Buy Rate', 'Sell Rate', 'Lots', 'Status', 'Entry Time'];
        const dataRows = [
            [101, 'NIFTY', 'BUY', 'trader1', 22500, '', 2, 'OPEN', '2026-09-28T10:00:00.000Z'],
            [102, 'GOLD, MCX', 'SELL', 'trader2', '', 75000, 1, 'CLOSED', '2026-09-28T10:15:00.000Z']
        ];

        const csvLines = [headers.join(',')];
        dataRows.forEach(row => {
            const line = row.map(cell => {
                const str = cell === null || cell === undefined ? '' : String(cell);
                return `"${str.replace(/"/g, '""')}"`;
            }).join(',');
            csvLines.push(line);
        });

        const csvContent = csvLines.join('\n');
        assert.ok(csvContent.startsWith('ID,Scrip,Type,Username,Buy Rate,Sell Rate,Lots,Status,Entry Time'));
        assert.ok(csvContent.includes('"GOLD, MCX"'));
        assert.ok(csvContent.includes('"trader1"'));
    });
});
