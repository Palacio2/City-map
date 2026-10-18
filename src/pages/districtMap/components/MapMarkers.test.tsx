import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type L from 'leaflet';
import { MapMarkers } from './MapMarkers';
import type { DynamicDistrictConfig } from '@config/districtFields';

const mocks = vi.hoisted(() => ({
    map: { addLayer: vi.fn(), removeLayer: vi.fn() },
    t: vi.fn(() => '<img src=x onerror=alert(1)>'),
}));
vi.mock('react-leaflet', () => ({ useMap: () => mocks.map }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: mocks.t }) }));

describe('public map content', () => {
    beforeEach(() => vi.clearAllMocks());

    it('treats both icons and translated tooltips as text, and cleans up its layer', () => {
        const icon = '<svg onload=alert(1)></svg>';
        const config: DynamicDistrictConfig = {
            education: {
                key: 'education', labelKey: 'education', icon: '🏫', isPremium: false,
                ratingDbKey: 'education_rating',
                fields: [{ key: 'schools', dbKey: 'schools', type: 'number', icon }],
            },
        };
        const { unmount } = render(<MapMarkers pois={[{ type: 'schools', coord: [52, 21] }]} config={config} />);
        const group = mocks.map.addLayer.mock.calls[0][0] as L.MarkerClusterGroup;
        const marker = group.getLayers()[0] as L.Marker;
        const element = marker.getIcon().createIcon();
        expect(element.textContent).toBe(icon);
        expect(element.querySelector('svg,img,script')).toBeNull();
        const tooltip = marker.getTooltip()?.getContent() as HTMLElement;
        expect(tooltip.tagName).toBe('STRONG');
        expect(tooltip.textContent).toBe('<img src=x onerror=alert(1)>');
        expect(tooltip.querySelector('img')).toBeNull();
        unmount();
        expect(mocks.map.removeLayer).toHaveBeenCalledWith(group);
    });
});
