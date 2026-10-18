import React from 'react';
import type { TransformedDistrict } from './district.types';

export interface RowDef {
  type?: 'header';
  title?: string;
  label?: string;
  key?: string;
  format?: (v: unknown, d: TransformedDistrict) => React.ReactNode;
}
