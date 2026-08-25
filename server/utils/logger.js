import { winstonLogger } from "./winstonLogger.js";
import { queueService } from "../services/queueService.js";

export const logger = {
    log: async (msg, status = 'INFO') => {
        const icons = { SUCCESS: '✅', WARNING: '⚠️', ERROR: '❌', INFO: 'ℹ️', DEBUG: '🔍' };
        const icon = icons[status] || 'ℹ️';
        const finalMsg = `${icon} ${msg}`;

        // Логуємо через Winston
        if (status === 'ERROR') {
            winstonLogger.error(finalMsg);
        } else if (status === 'WARNING') {
            winstonLogger.warn(finalMsg);
        } else if (status === 'DEBUG') {
            winstonLogger.debug(finalMsg);
        } else {
            winstonLogger.info(finalMsg);
        }

        // Додаємо в базу даних для поточної задачі (без 'await', щоб не блокувати виконання)
        queueService.addLog({
            timestamp: new Date().toISOString(),
            status,
            message: msg
        }).catch(e => winstonLogger.error(`Failed to push log to DB: ${e.message}`));
    },
    info: function(msg) { this.log(msg, 'INFO'); },
    error: function(msg) { this.log(msg, 'ERROR'); },
    warn: function(msg) { this.log(msg, 'WARNING'); },
    success: function(msg) { this.log(msg, 'SUCCESS'); },
    debug: function(msg) { this.log(msg, 'DEBUG'); }
};