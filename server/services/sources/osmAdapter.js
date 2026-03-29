import { processLocalOsmData } from '../osmProcessor.js';
import { PARSER_CONFIG } from '../../config/parserConfig.js';
import { LOGS } from '../../config/logTemplates.js';

export const osmAdapter = {
    async fetchData(config, fields, logger) {
        if (!config.pbfFileName) return {};
        const filePath = `${PARSER_CONFIG.PATHS.DATA_DIR}/${config.pbfFileName}`;
        return await processLocalOsmData(filePath, config.districtsData, fields, (m) => logger.log(m));
    }
};