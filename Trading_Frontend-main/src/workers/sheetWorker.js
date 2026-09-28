/**
 * Web Worker for Spreadsheet / CSV Export & Display Transformations
 * 
 * SECURITY BOUNDARIES:
 * - Strictly Display-Only: This worker has ZERO access to DOM, cookies, auth tokens, or trading APIs.
 * - Cannot initiate order execution or calculate financial exposures for live orders.
 * - Performs pure mathematical sanitation and dataset serialization off the main thread.
 */

self.onmessage = function (e) {
    const { action, payload, taskId } = e.data;

    try {
        switch (action) {
            case 'FORMAT_EXPORT_ROWS': {
                const { rows, columns } = payload;
                if (!Array.isArray(rows)) {
                    throw new Error('Rows must be an array');
                }

                // Sanitize and format rows safely
                const sanitizedRows = rows.map((row) => {
                    const formatted = {};
                    columns.forEach((col) => {
                        let val = row[col.key];
                        // Numeric sanitation
                        if (typeof val === 'number') {
                            if (isNaN(val) || !isFinite(val)) {
                                val = 0;
                            }
                        } else if (val === null || val === undefined) {
                            val = '—';
                        }
                        formatted[col.header || col.key] = val;
                    });
                    return formatted;
                });

                self.postMessage({
                    success: true,
                    taskId,
                    result: sanitizedRows
                });
                break;
            }

            case 'GENERATE_CSV': {
                const { headers, data } = payload;
                if (!Array.isArray(headers) || !Array.isArray(data)) {
                    throw new Error('Headers and data must be arrays');
                }

                const csvLines = [];
                csvLines.push(headers.join(','));

                data.forEach((row) => {
                    const line = row.map((cell) => {
                        const str = cell === null || cell === undefined ? '' : String(cell);
                        // Escape quotes
                        return `"${str.replace(/"/g, '""')}"`;
                    }).join(',');
                    csvLines.push(line);
                });

                const csvContent = csvLines.join('\n');
                self.postMessage({
                    success: true,
                    taskId,
                    result: csvContent
                });
                break;
            }

            default:
                throw new Error(`Unsupported sheet worker action: ${action}`);
        }
    } catch (err) {
        self.postMessage({
            success: false,
            taskId,
            error: err.message
        });
    }
};
