import fs from "fs";
import { PARSER_CONFIG } from "../config/parserConfig.js";

export const logger = {
    log: (msg, status = 'INFO') => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
        
        const icons = { SUCCESS: '✅', WARNING: '⚠️', ERROR: '❌', INFO: 'ℹ️' };
        const finalMsg = `[${timeStr}] [PARSER] [${status}] ${icons[status] || 'ℹ️'} ${msg}`;
        
        if (!fs.existsSync(PARSER_CONFIG.PATHS.LOGS_DIR)) {
            fs.mkdirSync(PARSER_CONFIG.PATHS.LOGS_DIR, { recursive: true });
        }
        
        fs.appendFileSync(`${PARSER_CONFIG.PATHS.LOGS_DIR}/parser-${dateStr}.log`, `${finalMsg}\n`);
        console.log(finalMsg);
    }
};