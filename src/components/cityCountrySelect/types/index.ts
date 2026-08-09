export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface Country {
  value: string;
  label?: string;
  is_available?: boolean;
}

export interface City {
  value: string;
  name?: string;
  is_available?: boolean;
}