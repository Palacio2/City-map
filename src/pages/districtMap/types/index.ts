export interface ComparisonPayload {
  name: string;
  city: string;
  country: string;
  priceRent: number;
  priceSale: number;
}

export interface TrackedDistrictPayload {
  country: string;
  city: string;
  district: string;
  districtId: string;
}

export interface TrackedDistrict extends TrackedDistrictPayload {
  id: string;
}
export interface DistrictCardProps { district: any; onClick: (district: any, categoryKey?: string) => void; }
export interface DistrictsMapProps { districts: any[]; onDistrictClick: (district: any) => void; filters?: any; totalCount?: number; originalTotal?: number; selectedFilters?: any; }
export interface DistrictMapFilters { [key: string]: any; }
