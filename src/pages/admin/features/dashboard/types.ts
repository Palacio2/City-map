export interface DistrictRowData {
    id: string;
    name: string;
    cityName?: string;
    cityId?: string;
    countryId?: string;
    isAvailable?: boolean;
    missingPhoto?: boolean;
    missingGeo?: boolean;
    lastUpdated?: string | Date;
}

export interface DashboardStats {
    totalCountries: number;
    totalCities: number;
    totalDistricts: number;
    publishedDistricts: number;
    problematicDistricts: DistrictRowData[];
    outdatedDistricts: DistrictRowData[];
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface DashboardStatsResponse {
    stats: DashboardStats;
    chartData: ChartDataPoint[];
}
