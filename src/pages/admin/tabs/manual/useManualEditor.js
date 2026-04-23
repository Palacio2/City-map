import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../services/api';
import { supabase } from '@supabaseClient';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';
import { useModals } from '../../ui/ModalContext';

export const useManualEditor = (selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict) => {
    const { t } = useTranslation('db');
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
        if (!selectedDistrict?.id) {
            setFormData({}); setPhotoPreview(null); setPhotoFile(null); setInitialData({});
            return;
        }

        const loadData = async () => {
            try {
                const res = await api.geo.getDistrictData(selectedDistrict.id);
                if (res.data) {
                    if (currentDistrictRef.current !== selectedDistrict.id) return;
                    setInitialData(res.data);

                    const draft = localStorage.getItem(`draft_district_${selectedDistrict.id}`);
                    if (draft) {
                        try {
                            const parsedDraft = JSON.parse(draft);
                            setFormData({ ...res.data, ...parsedDraft });
                        } catch (e) { setFormData(res.data); }
                    } else {
                        setFormData(res.data);
                    }

                    if (res.data.photo_url) setPhotoPreview(res.data.photo_url);
                    else setPhotoPreview(null);
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadData();
    }, [selectedDistrict]);

    const handleFieldChange = (key, value) => {
        updateFormDataWithDraft(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!selectedDistrict) return;
        setLoading(true);
        try {
            const payloadToSave = { ...formData };
            delete payloadToSave.id;
            delete payloadToSave.district_id;
            delete payloadToSave.city_id;
            delete payloadToSave.created_at;
            delete payloadToSave.updated_at;
            delete payloadToSave.last_updated;
            delete payloadToSave.data_updated_at;
            delete payloadToSave.cities;

            if (photoFile) {
                const fileName = `${selectedDistrict.id}-${Date.now()}.webp`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from('district-photos').upload(fileName, photoFile, { contentType: 'image/webp' });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('district-photos').getPublicUrl(fileName);
                payloadToSave.photo_url = urlData.publicUrl;
            }

            const { error } = await supabase.functions.invoke('admin-district-manage', {
                body: { action: 'save', districtId: selectedDistrict.id, payload: payloadToSave }
            });

            if (error) throw error;
            
            localStorage.removeItem(`draft_district_${selectedDistrict.id}`);
            setInitialData(formData);
            setPhotoFile(null);
            showAlert(t('common.success'), t('admin_manual.editor.save_success'), 'success');
            
        } catch (e) { 
            showAlert(t('common.error'), e.message, 'error'); 
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
            const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };
            try {
                const compressedFile = await imageCompression(file, options);
                setPhotoFile(compressedFile);
                setPhotoPreview(URL.createObjectURL(compressedFile));
            } catch (error) {
                console.error("Compression error:", error);
            }
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
        handleFieldChange, handleSaveMapData, handleFileChange, handleSave, handleCancel, completeness
    };
};