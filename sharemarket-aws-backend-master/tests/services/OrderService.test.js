const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const orderService = require('../../src/services/OrderService');
const orderRepo = require('../../src/repositories/OrderRepository');
const marketDataService = require('../../src/services/MarketDataService');
const db = require('../../src/config/db');

describe('OrderService - Authoritative Lot Size & Exposure Enforcement', () => {
    let capturedOrderPayload = null;

    beforeEach(() => {
        capturedOrderPayload = null;

        // Mock OrderRepository createOrder
        orderRepo.createOrder = async (userId, payload) => {
            capturedOrderPayload = { userId, ...payload };
            return 999;
        };

        // Mock MarketDataService
        marketDataService.getPrice = () => ({ ltp: 100 });
    });

    test('1. Ignores client-supplied lot_size_at_entry and enforces authoritative DB lot size', async () => {
        // Mock DB: scrip_data returns lot_size = 50 for NFO/Option contract
        db.execute = async (query, params) => {
            if (query.includes('FROM scrip_data')) {
                return [[{ market_type: 'OPTIONS', lot_size: 50 }]];
            }
            if (query.includes('FROM users')) {
                return [[{ id: 1, balance: 500000 }]];
            }
            return [[]];
        };

        const clientPayload = {
            symbol: 'NIFTY24OCT25000CE',
            type: 'BUY',
            order_type: 'MARKET',
            quantity: 2, // 2 lots
            price: 100,
            lot_size_at_entry: 1, // MALICIOUS / CLIENT OVERRIDE ATTEMPT (Ignored)
            leverage_used: 100    // CLIENT OVERRIDE ATTEMPT (Ignored)
        };

        const result = await orderService.placeOrder(1, clientPayload);

        assert.strictEqual(result, 999);
        assert.ok(capturedOrderPayload, 'Order should be created');
        // Authoritative actual quantity must be 2 lots * 50 = 100 shares, NOT 2 * 1 = 2
        assert.strictEqual(capturedOrderPayload.quantity, 100);
        assert.strictEqual(capturedOrderPayload.type, 'BUY');
    });

    test('2. Fails closed when instrument lot size is missing or invalid in system master', async () => {
        // Mock DB: scrip_data returns no record or 0 lot size
        db.execute = async (query, params) => {
            if (query.includes('FROM scrip_data')) {
                return [[]];
            }
            if (query.includes('FROM users')) {
                return [[{ id: 1, balance: 500000 }]];
            }
            return [[]];
        };

        const clientPayload = {
            symbol: 'UNKNOWN_OR_UNCONFIGURED_DERIVATIVE',
            type: 'BUY',
            order_type: 'MARKET',
            quantity: 5,
            price: 50
        };

        await assert.rejects(
            async () => {
                await orderService.placeOrder(1, clientPayload);
            },
            {
                message: 'Invalid or missing instrument lot size in system master'
            }
        );
    });

    test('3. Fails closed when non-integer or negative quantity is submitted', async () => {
        const testCases = [0, -5, 1.5, 'invalid', null, undefined];

        for (const badQty of testCases) {
            await assert.rejects(
                async () => {
                    await orderService.placeOrder(1, {
                        symbol: 'RELIANCE',
                        type: 'BUY',
                        quantity: badQty,
                        price: 2500
                    });
                },
                /Quantity must be a positive integer|Missing required order fields/
            );
        }
    });

    test('4. Correctly computes Cash Equity quantity in Units Mode vs Lots Mode', async () => {
        // Mock DB: NSE Cash Equity with default lot size 1
        db.execute = async (query, params) => {
            if (query.includes('FROM scrip_data')) {
                return [[{ market_type: 'EQUITY', lot_size: 1 }]];
            }
            if (query.includes('FROM users')) {
                return [[{ id: 1, balance: 500000 }]];
            }
            return [[]];
        };

        // Units Mode
        await orderService.placeOrder(1, {
            symbol: 'NSE:TCS',
            type: 'BUY',
            quantity: 15,
            equity_units_mode: 1,
            price: 3500
        });
        assert.strictEqual(capturedOrderPayload.quantity, 15);

        // Lots Mode
        await orderService.placeOrder(1, {
            symbol: 'NSE:TCS',
            type: 'BUY',
            quantity: 10,
            equity_units_mode: 0,
            price: 3500
        });
        assert.strictEqual(capturedOrderPayload.quantity, 10);
    });
});
