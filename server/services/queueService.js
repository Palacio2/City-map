import fs from "fs";
import { PARSER_CONFIG } from "../config/parserConfig.js";

export const queueService = {
    save: (data) => {
        fs.writeFileSync(PARSER_CONFIG.PATHS.QUEUE_FILE, JSON.stringify(data, null, 2));
    },
    get: () => {
        if (!fs.existsSync(PARSER_CONFIG.PATHS.QUEUE_FILE)) return null;
        try {
            return JSON.parse(fs.readFileSync(PARSER_CONFIG.PATHS.QUEUE_FILE, 'utf8'));
        } catch { return null; }
    },
    clear: () => {
        if (fs.existsSync(PARSER_CONFIG.PATHS.QUEUE_FILE)) fs.unlinkSync(PARSER_CONFIG.PATHS.QUEUE_FILE);
    },
    isLocked: () => {
        const q = queueService.get();
        return q && q.status === 'processing';
    }
};