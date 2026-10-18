import { FilterValue } from '../filterLogic';
import { DistrictCategory } from '@config/districtFields';

export interface FilterFieldDef {
  name: string;
  type: string;
  disabled?: boolean;
  locked?: boolean;
}

export interface FilterSectionProps {
  readonly categoryConfig: DistrictCategory;
  readonly filters?: FilterFieldDef[];
  readonly values?: Record<string, FilterValue>;
  readonly onChange?: (categoryKey: string, data: Record<string, FilterValue>) => void;
}
