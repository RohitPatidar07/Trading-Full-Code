/**
 * Promise-based client for Sheet Web Worker with fallback to main-thread processing.
 */

let workerInstance = null;
let pendingTasks = new Map();
let taskIdCounter = 0;

function getWorker() {
    if (typeof window === 'undefined' || typeof window.Worker === 'undefined') {
        return null;
    }

    if (!workerInstance) {
        try {
            workerInstance = new Worker(new URL('../workers/sheetWorker.js', import.meta.url), {
                type: 'module'
            });

            workerInstance.onmessage = function (e) {
                const { taskId, success, result, error } = e.data;
                const resolver = pendingTasks.get(taskId);
                if (resolver) {
                    pendingTasks.delete(taskId);
                    if (success) {
                        resolver.resolve(result);
                    } else {
                        resolver.reject(new Error(error));
                    }
                }
            };

            workerInstance.onerror = function (err) {
                console.error('[SheetWorkerClient] Worker error:', err);
            };
        } catch (e) {
            console.warn('[SheetWorkerClient] Failed to initialize Web Worker, using fallback:', e.message);
            workerInstance = null;
        }
    }

    return workerInstance;
}

export function formatExportRowsAsync(rows, columns) {
    const worker = getWorker();

    if (worker) {
        return new Promise((resolve, reject) => {
            const taskId = ++taskIdCounter;
            pendingTasks.set(taskId, { resolve, reject });
            worker.postMessage({
                action: 'FORMAT_EXPORT_ROWS',
                payload: { rows, columns },
                taskId
            });
        });
    }

    // Synchronous fallback if Web Worker is unavailable
    return Promise.resolve(
        rows.map((row) => {
            const formatted = {};
            columns.forEach((col) => {
                let val = row[col.key];
                if (typeof val === 'number') {
                    if (isNaN(val) || !isFinite(val)) val = 0;
                } else if (val === null || val === undefined) {
                    val = '—';
                }
                formatted[col.header || col.key] = val;
            });
            return formatted;
        })
    );
}

export function generateCSVAsync(headers, data) {
    const worker = getWorker();

    if (worker) {
        return new Promise((resolve, reject) => {
            const taskId = ++taskIdCounter;
            pendingTasks.set(taskId, { resolve, reject });
            worker.postMessage({
                action: 'GENERATE_CSV',
                payload: { headers, data },
                taskId
            });
        });
    }

    // Synchronous fallback
    const csvLines = [headers.join(',')];
    data.forEach((row) => {
        const line = row.map((cell) => {
            const str = cell === null || cell === undefined ? '' : String(cell);
            return `"${str.replace(/"/g, '""')}"`;
        }).join(',');
        csvLines.push(line);
    });
    return Promise.resolve(csvLines.join('\n'));
}
