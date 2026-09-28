const syncRunner = require('./runners/syncRunner');

async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const isCronMode = args.includes('--cron');

    if (isCronMode) {
        console.log('🔄 [InstrumentSyncChecker] Running in DAEMON Cron Mode...');
        syncRunner.startPreMarketCronJob();
        // Keep process alive if started as standalone cron service
        setInterval(() => {}, 1000 * 60 * 60);
        return;
    }

    console.log('🔍 [InstrumentSyncChecker] Running Manual Pre-Market Instrument Verification...');
    const result = await syncRunner.runSyncCheck({ dryRun: isDryRun });

    if (!result.success) {
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = syncRunner;
