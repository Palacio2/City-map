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