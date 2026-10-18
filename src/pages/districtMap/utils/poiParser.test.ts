import { it, expect } from 'vitest';
import { processPoiNormalization } from './poiParser';
it('preserves explicit latitude/longitude including zero and southern coordinates', () => {
  expect(processPoiNormalization([0,51,'school','parser'])?.coord).toEqual([0,51]);
  expect(processPoiNormalization([-33,151,'school','parser'])?.coord).toEqual([-33,151]);
  expect(processPoiNormalization({type:'school',coord:[25,50]})?.coord).toEqual([25,50]);
  expect(processPoiNormalization([91,20,'school'])).toBeNull();
});
