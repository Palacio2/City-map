import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../services/api';
import { supabase } from '@supabaseClient';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';
import { useModals } from '../../ui/ModalContext';

export const useManualEditor = (selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict) => {
    const { t } = useTranslation('adminManual');
    const { showAlert } = useModals();
    const { fieldsConfig } = useDynamicFields();

    const [initialData, setInitialData] = useState({});
    const [formData, setFormData] = useState({});
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMapEditorOpen, setIsMapEditorOpen] = useState(false);
    const currentDistrictRef = useRef(null);

    useEffect(() => {
        currentDistrictRef.current = selectedDistrict?.id;
    }, [selectedDistrict]);

    const updateFormDataWithDraft = (updater) => {
        setFormData(prev => {
            const nextState = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
            if (selectedDistrict?.id) {
                localStorage.setItem(`draft_district_${selectedDistrict.id}`, JSON.stringify(nextState));
            }
            return nextState;
        });
    };

    useEffect(() => {
        const loadData = async () => {
            if (!selectedDistrict?.id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke('admin-district-manage', {
                    body: { action: 'get', districtId: selectedDistrict.id }
                });
                
                if (error || data?.error) throw new Error(data?.error || error?.message);

                const districtData = data.data || {};
                setInitialData(districtData);
                
                const draft = localStorage.getItem(`draft_district_${selectedDistrict.id}`);
                setFormData(draft ? JSON.parse(draft) : districtData);
                setPhotoPreview(districtData.photo_url || null);
                setPhotoFile(null);
            } catch (e) {
                showAlert(t('common.error'), e.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedDistrict?.id, showAlert, t]);

    const handleFieldChange = (key, value) => {
        updateFormDataWithDraft({ [key]: value });
    };

    const handleSaveDistrict = async () => {
        setLoading(true);
        try {
            let uploadedPhotoUrl = photoPreview;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${selectedDistrict.id}-${Date.now()}.${fileExt}`;
                uploadedPhotoUrl = await api.storage.uploadDistrictPhoto(fileName, photoFile);
            }

            const payload = {
                ...formData,
                photo_url: uploadedPhotoUrl
            };

            const { data, error } = await supabase.functions.invoke('admin-district-manage', {
                body: { action: 'save', districtId: selectedDistrict.id, payload }
            });
            
            if (error || data?.error) throw new Error(data?.error || error?.message);

            setInitialData(formData);
            setPhotoFile(null);
            localStorage.removeItem(`draft_district_${selectedDistrict.id}`);
            showAlert(t('common.success'), t('manualEditor.saveSuccess'), 'success');
        } catch (e) { 
            showAlert(t('common.error'), t('manualEditor.saveError'), 'error'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleCancel = () => {
        setSelectedDistrict(null); 
        localStorage.removeItem(`draft_district_${selectedDistrict?.id}`);
    };

    const handleSaveMapData = (newPois, updatedCounts) => {
        updateFormDataWithDraft(prev => ({ ...prev, poi_data: newPois, ...updatedCounts }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setPhotoFile(compressedFile);
            setPhotoPreview(URL.createObjectURL(compressedFile));
        }
    };

    const completeness = {
        geo: formData.geojson ? 'green' : 'red',
        photo: photoPreview ? 'green' : 'red',
        pop: formData.population > 0 ? 'green' : 'red',
        prices: (formData.average_property_price > 0 && formData.average_rent_price > 0) ? 'green' : 'red',
        infra: formData.poi_data?.length > 0 ? 'green' : 'yellow'
    };

    return {
        formData, photoPreview, loading, isMapEditorOpen, setIsMapEditorOpen,
        completeness, handleFileChange, handleSaveDistrict, handleFieldChange,
        handleSaveMapData, handleCancel
    };
};