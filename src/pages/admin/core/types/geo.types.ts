// From utils/mapHelpers.tsx
export interface GeoFeatureData {
    id?: string | number;
    geojson?: {
        bbox?: number[];
        type?: string;
        [key: string]: unknown;
    };
    fillColor?: string;
    name?: string;
    poi_data?: [number, number, string, string][];
    [key: string]: unknown;
}

export interface GeoEntity {
    id: string;
    name: string;
    is_available?: boolean;
    [key: string]: unknown;
}

export interface MapFitBoundsProps {
    mapData?: GeoFeatureData[];
    geojson?: Record<string, unknown> | null;
    padding?: [number, number] | number[];
    maxZoom?: number;
    duration?: number;
    pois?: unknown[];
}

export type NormalizedPoiPoint = [number, number, string, string];

// From config/countryConfig.ts
export interface CountryFeatures {
    hasOtodom: boolean;
    hasGus: boolean;
    hasOlx: boolean;
    hasDerzhstat: boolean;
    hasWaqi: boolean;
    hasOsm: boolean;
}

export interface CountryConfigItem {
    id: string;
    name?: string;
    defaultCenter: [number, number];
    defaultZoom: number;
    features: CountryFeatures;
}
