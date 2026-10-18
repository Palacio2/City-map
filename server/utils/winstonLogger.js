import winston from "winston";
import fs from "fs";
import { PARSER_CONFIG } from "../config/parserConfig.js";

// Переконуємось, що папка для логів існує
if (!fs.existsSync(PARSER_CONFIG.PATHS.LOGS_DIR)) {
    fs.mkdirSync(PARSER_CONFIG.PATHS.LOGS_DIR, { recursive: true });
}

const { combine, timestamp, printf, colorize } = winston.format;

const customFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] [PARSER] [${level}]: ${message}`;
});

export const winstonLogger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
    ),
    transports: [
        new winston.transports.File({ 
            filename: `${PARSER_CONFIG.PATHS.LOGS_DIR}/parser-error.log`, 
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: `${PARSER_CONFIG.PATHS.LOGS_DIR}/parser-combined.log`,
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 5
        })
    ]
});

// Додаємо вивід в консоль у розробці
if (process.env.NODE_ENV !== 'production') {
    winstonLogger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            customFormat
        )
    }));
}
