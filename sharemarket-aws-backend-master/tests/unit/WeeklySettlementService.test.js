/**
 * AUTO-GENERATED TEST SUITE BY test-generator
 * Target: src/services/WeeklySettlementService.js
 * Domain: WEEKLY_SETTLEMENT_DATES
 * Generated: 2026-09-26T07:10:58.233Z
 */

const targetModule = require('../../src/services/WeeklySettlementService.js');

describe('WeeklySettlementService Financial & Domain Unit Tests', () => {

    describe('getWeekBoundaries()', () => {
        test('WEEK_1: [Happy Path] Wednesday date boundaries', () => {
            const func = targetModule.getWeekBoundaries || targetModule;
            const input = "2026-03-25T00:00:00.000Z";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result.week_start).toEqual("2026-03-23");
            expect(result.week_end).toEqual("2026-03-29");
        });

        test('WEEK_2: [Boundary & Zero Cases] Sunday date boundaries (maps to Monday of that ending week)', () => {
            const func = targetModule.getWeekBoundaries || targetModule;
            const input = "2026-03-29T00:00:00.000Z";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result.week_start).toEqual("2026-03-23");
            expect(result.week_end).toEqual("2026-03-29");
        });

        test('WEEK_3: [Boundary & Zero Cases] Monday date boundaries (week start)', () => {
            const func = targetModule.getWeekBoundaries || targetModule;
            const input = "2026-03-23T00:00:00.000Z";
            const result = Array.isArray(input) ? func(...input) : func(input);
            expect(result.week_start).toEqual("2026-03-23");
            expect(result.week_end).toEqual("2026-03-29");
        });

    });
});
