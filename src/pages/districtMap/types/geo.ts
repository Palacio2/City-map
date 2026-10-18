

export interface PoiData {
  type: string;
  coord: [number, number];
}

export interface ProcessedGeoData {
  geojson?: unknown;
  poi_data: PoiData[];
}

export interface GeoMapSidebarProps {
  readonly availableTypes: string[];
  readonly activeFilters: string[];
  readonly geoData: ProcessedGeoData | null;
  readonly isMobileFilterOpen: boolean;
  readonly setIsMobileFilterOpen: (open: boolean) => void;
  readonly toggleAll: () => void;
  readonly toggleFilter: (type: string) => void;
  readonly getEmojiForType: (type: string) => string;
}

export interface DistrictGeoMapModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly districtId?: string | number;
  readonly districtName?: string;
}