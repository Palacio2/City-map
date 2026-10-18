import { requestLocal } from "@services/api";

export const adminParserApi = {
    findDistrictsOSM: (cityName: string) => requestLocal("/geo/find-districts", "POST", { cityName }),
    runOfflineParser: (config: Record<string, unknown>) => requestLocal("/geo/run-osm-parser", "POST", config),
    getStatus: () => requestLocal("/geo/status"),
    getCurrentLog: () => requestLocal("/geo/current-log", "GET", null, true),
    getPbfFiles: () => requestLocal("/geo/pbf-files"),
    getPendingResults: () => requestLocal("/geo/pending-results"),
    deletePendingResults: () => requestLocal("/geo/pending-results", "DELETE"),
    updatePending: (newData: Record<string, unknown>[]) => requestLocal("/geo/update-pending", "POST", { newData }),
    saveParsedResults: (resultsArray: Record<string, unknown>[]) => requestLocal("/geo/db/save-results", "POST", { resultsArray })
};
