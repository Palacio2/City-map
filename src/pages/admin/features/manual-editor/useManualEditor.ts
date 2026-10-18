// src/pages/admin/features/manual-editor/useManualEditor.ts
import { useState, useEffect } from 'react';
import { adminGeoApi } from '@admin/core/api/adminGeoApi';
import { supabase } from '@supabaseClient';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';
import { useModals } from '@admin/core/context/ModalContext';
import { useActionLogger } from '@admin/core/context/useActionLogger';
import { Entity } from './types';
import { NormalizedPoiPoint } from '@admin/core/types/geo.types';
import { useActionGuard } from '@admin/core/context/useActionGuard';

export const useManualEditor = (
    _selectedCountry: Entity | null, 
    _selectedCity: Entity | null, 
    selectedDistrict: Entity | null, 
    setSelectedDistrict: (d: Entity | null) => void
) => {
    const { t } = useTranslation('db');
    const { showAlert } = useModals();
    const { withLogging } = useActionLogger();
    const { canDo } = useActionGuard();
    
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMapEditorOpen, setIsMapEditorOpen] = useState(false);

    const updateFormDataWithDraft = (updater: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
        setFormData(prev => {
            const nextState = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
            if (selectedDistrict?.id) {
                localStorage.setItem(`draft_district_${selectedDistrict.id}`, JSON.stringify(nextState));
            }
            return nextState;
        });
    };

    useEffect(() => {
        let active = true;
        setFormData({});
        setPhotoFile(null);
        setPhotoPreview(null);
        setIsMapEditorOpen(false);
        if (!selectedDistrict?.id) return;
        setLoading(true);

        const loadData = async () => {
            try {
                const data = await adminGeoApi.getDistrictData(selectedDistrict.id);
                if (!active) return;
                if (data) {
                    const draft = localStorage.getItem(`draft_district_${selectedDistrict.id}`);
                    if (draft) {
                        try {
                            const parsedDraft = JSON.parse(draft);
                            setFormData({ ...data, ...parsedDraft });
                        } catch { 
                            setFormData(data); 
                        }
                    } else {
                        setFormData(data);
                    }
                    setPhotoPreview((data.photo_preview_url as string) || null);
                } else {
                    setSelectedDistrict(null);
                }
            } catch (err: unknown) {
                if (!active) return;
                console.error(err);
                const msg = err instanceof Error ? err.message : 'Unknown error';
                if (msg.includes('Район не знайдено') || msg.includes('Cannot coerce')) {
                    setSelectedDistrict(null);
                    showAlert(t('common.error'), 'Район не знайдено або немає доступу', 'error');
                } else {
                    setSelectedDistrict(null);
                    showAlert(t('common.error'), msg, 'error');
                }
            } finally { if (active) setLoading(false); }
        };
        loadData();
        return () => { active = false; };
    }, [selectedDistrict?.id, setSelectedDistrict, showAlert, t]);

    useEffect(() => () => {
        if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    }, [photoPreview]);

    const handleFieldChange = (key: string, value: unknown) => {
        updateFormDataWithDraft({ [key]: value });
    };

    const handleSave = async () => {
        if (!selectedDistrict || loading) return;
        setLoading(true);
        try {
            const payloadToSave = { ...formData };
            delete payloadToSave.id;
            delete payloadToSave.district_id;
            delete payloadToSave.city_id;
            delete payloadToSave.created_at;
            delete payloadToSave.updated_at;
            delete payloadToSave.photo_preview_url;
            if (!canDo('manual.gis')) {
                delete payloadToSave.geojson;
                delete payloadToSave.poi_data;
            }

            if (photoFile) {
                const fileName = `${selectedDistrict.id}-${Date.now()}.webp`;
                const { error: uploadError } = await supabase.storage.from('district-photos').upload(fileName, photoFile, { contentType: 'image/webp' });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('district-photos').getPublicUrl(fileName);
                payloadToSave.photo_url = urlData.publicUrl;
            }

            const { error } = await withLogging('update_district_data', () => supabase.functions.invoke('admin-district-manage', {
                body: { action: 'save', districtId: selectedDistrict.id, payload: payloadToSave }
            }), { districtId: selectedDistrict.id, payload: payloadToSave });
            
            if (error) throw error;
            
            localStorage.removeItem(`draft_district_${selectedDistrict.id}`);
            setPhotoFile(null);
            showAlert(t('common.success'), t('admin_manual.editor.save_success'), 'success');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Error';
            showAlert(t('common.error'), msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (selectedDistrict) localStorage.removeItem(`draft_district_${selectedDistrict.id}`);
        setSelectedDistrict(null);
    };

    const handleSaveMapData = (newPois: NormalizedPoiPoint[], updatedCounts: Record<string, number>) => {
        updateFormDataWithDraft({ poi_data: newPois, ...updatedCounts });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedFile = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' });
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
        pop: (formData.population && Number(formData.population) > 0) ? 'green' : 'red',
        prices: ((formData.average_property_price && Number(formData.average_property_price) > 0) || (formData.average_rent_price && Number(formData.average_rent_price) > 0)) ? 'green' : 'red',
        infra: (formData.poi_data as unknown[])?.length > 0 ? 'green' : 'yellow'
    };

    return {
        formData, photoPreview, loading, isMapEditorOpen, setIsMapEditorOpen,
        handleFieldChange, handleSaveMapData, handleFileChange, handleSave, handleCancel, completeness
    };
};
