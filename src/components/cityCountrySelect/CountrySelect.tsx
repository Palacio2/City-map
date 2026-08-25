import SelectForm, { StatusView } from './components/SelectForm';
import Loader from '@components/loader/Loader';
import { useCountrySelect } from './hooks/useCountrySelect';

export default function CountrySelect() {
  const {
    selected,
    setSelected,
    options,
    isLoading,
    errorMessage,
    handleSubmit,
    handleBack,
    t
  } = useCountrySelect();

  if (isLoading) return <Loader fullScreen text={t('country.loading')} />;
  if (errorMessage) return <StatusView title={t('country.error')} error={errorMessage} onBack={handleBack} showRetry />;

  return (
    <SelectForm
      title={t('country.title')}
      subtitle={t('country.subtitle')}
      options={options}
      selectedValue={selected}
      onValueChange={setSelected}
      onSubmit={handleSubmit}
      isSearchable
    />
  );
}