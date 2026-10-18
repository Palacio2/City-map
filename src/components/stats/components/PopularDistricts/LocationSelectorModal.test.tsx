import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import LocationSelectorModal from './LocationSelectorModal';
import { fetchDistrictsWithFilters } from '@api/districtsApi';

const t = (key: string) => key;
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t }) }));
vi.mock('@cityCountrySelect/api/cityCountryApi', () => ({
  fetchCountries: vi.fn(async () => [{ value: 'Country', label: 'Country' }]),
  fetchCitiesByCountry: vi.fn(async () => [{ value: 'City', name: 'City' }]),
}));
vi.mock('@api/districtsApi', () => ({ fetchDistrictsWithFilters: vi.fn(async () => [{ id: 'district', name: 'District' }]) }));
vi.mock('@admin/core/ui/CustomSelect', () => ({ CustomSelect: ({ value, onChange, options }: {
  value: string; onChange: (value: string) => void; options: { value: string; label: string }[];
}) => <select value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }));

it('uses the typed location responses and loads districts without passing boolean as AbortSignal', async () => {
  render(<LocationSelectorModal includeDistrict onClose={vi.fn()} onSubmit={vi.fn()} />);
  await screen.findByRole('option', { name: 'Country' });
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Country' } });
  await screen.findByRole('option', { name: 'City' });
  fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'City' } });
  await waitFor(() => expect(fetchDistrictsWithFilters).toHaveBeenCalledWith('Country', 'City'));
  expect(await screen.findByText('District')).toBeInTheDocument();
});
