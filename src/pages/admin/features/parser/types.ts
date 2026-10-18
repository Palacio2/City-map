import React from 'react';
import { GeoEntity } from '@admin/core/types/geo.types';

export interface StepHeaderProps {
    step: number;
    title: string;
    icon: React.ReactNode;
    isActive: boolean;
    isCompleted: boolean;
    isLocked: boolean;
    onEdit: () => void;
}

export type EntityItem = GeoEntity;
export type DistrictItem = GeoEntity;

export interface LogEntry {
    id: string | number;
    msg: string;
    time?: string;
    type?: string;
    [key: string]: unknown;
}

export interface ParsedDistrictRowItem {
    district_id: string;
    district_name: string;
    population?: number;
    air_quality?: number;
    geojson?: unknown;
    poi_data?: unknown;
    parsed_pois?: unknown;
    error?: unknown;
    [key: string]: unknown;
}

export interface DistrictManagerProps {
    foundDistricts?: (string | { name: string; [key: string]: unknown })[];
    dbDistricts?: { id: string; name: string; [key: string]: unknown }[];
    selectedIds?: string[];
    onToggleSelect: (id: string) => void;
    onSelectAll: (select: boolean) => void;
    onScan: () => void;
    onCreate: (districts: unknown[]) => void;
    onRemoveFromFound: (district: unknown) => void;
    onDeleteDbDistrict: (id: string) => void;
    onImportGeoJson: (file: File) => void;
    loading?: boolean;
    isSuperAdmin?: boolean;
}

export interface ParserParametersProps {
    onStart: (config: Record<string, unknown>) => void;
    selectedDistricts: DistrictItem[];
    country?: { name: string; [key: string]: unknown } | null;
    city?: { name: string; [key: string]: unknown } | null;
    region?: string | null;
}

export interface LogItem {
    id: string | number;
    time?: string;
    type?: string;
    msg: string;
    [key: string]: unknown;
}

export interface ParserConsoleProps {
    logs?: LogItem[];
    loading?: boolean;
    onClear?: () => void;
    onDownload?: () => void;
    onStartClick?: () => void;
    isStartDisabled?: boolean;
    selectedCount?: number;
}

export interface ParserSettingsProps {
    country: EntityItem | null;
    setCountry: (val: EntityItem | null) => void;
    city: EntityItem | null;
    setCity: (val: EntityItem | null) => void;
    region: string;
    setRegion: (val: string) => void;
    countriesList: EntityItem[];
    citiesList: EntityItem[];
    onCountryChange: (id: string) => void;
    pbfFile: string;
    setPbfFile: (val: string) => void;
    availableFiles: string[];
    loadAvailableFiles: () => void;
}