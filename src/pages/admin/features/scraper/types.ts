export interface ScraperRule {
    id: string;
    country_code: string;
    platform: string;
    type: string;
    min_price: number;
    max_price: number;
    is_active: boolean;
    item_selector: string;
    price_regex: string;
    sqm_regex: string;
    min_sqm: number;
    max_sqm: number;
    [key: string]: unknown;
}