import { winstonLogger } from "./winstonLogger.js";
import { queueService } from "../services/queueService.js";

const MAX_BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 2000;

export function createJobLogger(jobId, token) {
let logBatch = [];
let flushTimeout = null;
let pendingFlush = null;

const flushLogs = () => {
    if (pendingFlush) return pendingFlush;
    clearTimeout(flushTimeout);
    flushTimeout = null;
    pendingFlush = (async () => {
        while (logBatch.length) {
            const batch = logBatch.splice(0, MAX_BATCH_SIZE);
            try { await queueService.addLogsBatch(batch, jobId, token); }
            catch (e) {
                // Entries are also in Winston; retain a bounded retry buffer.
                logBatch = [...batch, ...logBatch].slice(-2000);
                winstonLogger.error(`Failed to push logs to DB: ${e.message}`);
                break;
            }
        }
    })().finally(() => { pendingFlush = null; });
    return pendingFlush;
};

const scopedLogger = {
    log: async (msg, status = 'INFO') => {
        const icons = { SUCCESS: '✅', WARNING: '⚠️', ERROR: '❌', INFO: 'ℹ️', DEBUG: '🔍' };
        const icon = icons[status] || 'ℹ️';
        const finalMsg = `${icon} ${msg}`;

        if (status === 'ERROR') {
            winstonLogger.error(finalMsg);
        } else if (status === 'WARNING') {
            winstonLogger.warn(finalMsg);
        } else if (status === 'DEBUG') {
            winstonLogger.debug(finalMsg);
        } else {
            winstonLogger.info(finalMsg);
        }

        if (!jobId) return;
        logBatch.push({
            timestamp: new Date().toISOString(),
            status,
            message: msg
        });
        if (logBatch.length > 2000) logBatch.shift();

        if (logBatch.length >= MAX_BATCH_SIZE) {
            flushLogs();
        } else if (!flushTimeout) {
            flushTimeout = setTimeout(flushLogs, FLUSH_INTERVAL_MS);
        }
    },
    info: function(msg) { this.log(msg, 'INFO'); },
    error: function(msg) { this.log(msg, 'ERROR'); },
    warn: function(msg) { this.log(msg, 'WARNING'); },
    success: function(msg) { this.log(msg, 'SUCCESS'); },
    debug: function(msg) { this.log(msg, 'DEBUG'); },
    forceFlush: flushLogs
};
return scopedLogger;
}
export const logger = createJobLogger();
