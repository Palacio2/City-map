import SelectForm, { StatusView } from './components/SelectForm';
import Loader from '@components/loader/Loader';
import { useCitySelect } from './hooks/useCitySelect';

export default function CitySelect({ country: propCountry }: { readonly country?: string }) {
  const {
    decodedCountry,
    selected,
    setSelected,
    options,
    isLoading,
    displayError,
    hasCities,
    showRetry,
    handleSubmit,
    handleBack,
    t
  } = useCitySelect(propCountry);

  if (isLoading) return <Loader fullScreen text={t('city.loading')} />;
  if (displayError) return <StatusView title={t('city.error')} error={displayError} onBack={handleBack} showRetry={showRetry} />;

  return (
    <SelectForm
      title={t('city.title', { country: decodedCountry })}
      options={options}
      selectedValue={selected}
      onValueChange={setSelected}
      onSubmit={handleSubmit}
      onBack={handleBack}
      showBackButton
      submitText={t('city.submit')}
      disabled={!hasCities}
      disabledMessage={hasCities ? t('city.unavailable') : t('city.not_found')}
      isSearchable
    />
  );
}