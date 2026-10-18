// From schemas/adminSchemas.ts
export interface FieldConfigItem {
  id: string;
  field_code: string;
  admin_label: string;
  icon: string;
  data_type: 'integer' | 'numeric' | 'boolean' | 'text';
  ui_group: string;
  source_type: 'osm' | 'scraper' | 'api' | 'gus' | 'manual';
  ui_component: 'input_number' | 'input_text' | 'select' | 'textarea';
  parser_config: Record<string, unknown> | null;
  is_visible_table: boolean;
  is_visible_form: boolean;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FieldGroupItem {
  id: string;
  label_key: string;
  icon?: string;
  bg_color?: string;
  sort_order: number;
}

// From schemas/scraperRuleSchema.ts
export interface ScraperRuleItem {
  id: string;
  country_code: string;
  platform: string;
  type: 'sale' | 'rent';
  item_selector: string;
  price_regex: string;
  sqm_regex: string;
  min_price: number;
  max_price: number;
  min_sqm: number;
  max_sqm: number;
  is_active: boolean;
  created_at?: string;
}
