import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { supabase } from '@supabaseClient';
import { METRIC_GROUPS } from '../config/metricsConfig';
import { generatePropertyLink } from '../utils/countryHelpers';
import imageCompression from 'browser-image-compression';

export const useManualEditor = (selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict) => {
    const [initialData, setInitialData] = useState({});
    const [formData, setFormData] = useState({});
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMapEditorOpen, setIsMapEditorOpen] = useState(false);

    const [updatingOtodom, setUpdatingOtodom] = useState(false);
    const [updatingGUS, setUpdatingGUS] = useState(false);
    const [updatingEco, setUpdatingEco] = useState(false);
    const [updatingGroups, setUpdatingGroups] = useState({});
    const [isFullParsing, setIsFullParsing] = useState(false);

    useEffect(() => {
        if (selectedDistrict) loadDistrictData(selectedDistrict.id);
        else { setFormData({}); setInitialData({}); setPhotoPreview(null); setPhotoFile(null); }
    }, [selectedDistrict]);

    useEffect(() => {
        return () => {
            if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
        };
    }, [photoPreview]);

    useEffect(() => {
        if (!selectedDistrict || Object.keys(formData).length === 0) return;
        const timeoutId = setTimeout(() => {
            localStorage.setItem(`draft_district_${selectedDistrict.id}`, JSON.stringify(formData));
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData, selectedDistrict]);

    const loadDistrictData = async (districtId) => {
        try {
            const fetchedData = await api.geo.getDistrictData(districtId);
            const combinedData = { ...fetchedData, is_available: !!selectedDistrict.is_available };
            setInitialData(combinedData);

            const savedDraft = localStorage.getItem(`draft_district_${districtId}`);
            if (savedDraft) {
                if (window.confirm("У вас є незбережені дані для цього району з попередньої сесії. Бажаєте їх відновити?")) {
                    setFormData(JSON.parse(savedDraft));
                } else {
                    localStorage.removeItem(`draft_district_${districtId}`);
                    setFormData(combinedData);
                }
            } else {
                setFormData(combinedData);
            }

            const { data: photoData } = await supabase
                .from('district_photos')
                .select('photo_url')
                .eq('district_id', districtId)
                .eq('is_main', true)
                .maybeSingle();
                
            setPhotoPreview(photoData ? photoData.photo_url : null);
        } catch (e) {
            const fallbackData = { district_id: districtId, is_available: !!selectedDistrict.is_available }; 
            setInitialData(fallbackData);
            setFormData(fallbackData);
            setPhotoPreview(null);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
                const compressedFile = await imageCompression(file, options);
                setPhotoFile(compressedFile);
                if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
                setPhotoPreview(URL.createObjectURL(compressedFile));
            } catch (error) {}
        }
    };

    const handleSaveDistrict = async () => {
        setLoading(true);
        try {
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${selectedDistrict.id}-${Date.now()}.${fileExt}`;
                const { error: upErr } = await supabase.storage.from('district-photos').upload(fileName, photoFile, { upsert: true });
                if (upErr) throw upErr;
                const { data: urlData } = supabase.storage.from('district-photos').getPublicUrl(fileName);
                await supabase.from('district_photos').upsert({ district_id: selectedDistrict.id, photo_url: urlData.publicUrl, is_main: true }, { onConflict: 'district_id' });
            }

            const diffPayload = {};
            let hasStatsChanges = false;
            
            Object.keys(formData).forEach(key => {
                if (key !== 'is_available' && formData[key] !== initialData[key] && formData[key] !== undefined && formData[key] !== null) {
                    diffPayload[key] = formData[key];
                    hasStatsChanges = true;
                }
            });

            if (hasStatsChanges) {
                diffPayload.district_id = selectedDistrict.id;
                await api.geo.saveDistrictData(diffPayload);
            }

            if (formData.is_available !== initialData.is_available) {
                await api.geo.updateDistrictStatus(selectedDistrict.id, !!formData.is_available);
            }

            setInitialData(formData);
            localStorage.removeItem(`draft_district_${selectedDistrict.id}`);
            alert("✅ Дані успішно збережено!");
            setPhotoFile(null);
        } catch (e) { } 
        finally { setLoading(false); }
    };

    const handleFieldChange = (key, value, type) => {
        if (type === 'boolean') return setFormData(prev => ({ ...prev, [key]: value }));
        let parsedValue = value;
        if (type !== 'text' && value !== '') {
            parsedValue = type === 'float' ? parseFloat(value) : parseInt(value, 10);
            if (isNaN(parsedValue)) parsedValue = 0;
        }
        setFormData(prev => ({ ...prev, [key]: parsedValue }));
    };

    const handleSingleOtodomUpdate = async () => {
        if (!selectedCountry || !selectedCity || !selectedDistrict) return;
        const regionStr = localStorage.getItem('parser_region') || '';
        const url = generatePropertyLink(selectedCountry.name, selectedCity.name, selectedDistrict.name, regionStr);
        if (!url) return;
        
        setUpdatingOtodom(true);
        try {
            const data = await api.parser.singleOtodom(url);
            setFormData(prev => ({
                ...prev,
                average_property_price: data.sale?.avgPrice || prev.average_property_price,
                average_sale_price_sqm: data.sale?.avgSqm || prev.average_sale_price_sqm,
                average_rent_price: data.rent?.avgPrice || prev.average_rent_price,
            }));
        } catch (e) {} 
        finally { setUpdatingOtodom(false); }
    };

    const handleGusUpdate = async () => {
        if (!selectedCity) return;
        setUpdatingGUS(true);
        try {
            const data = await api.parser.singleGus(selectedCity.name);
            setFormData(prev => ({
                ...prev,
                average_salary: data.salary || prev.average_salary,
                unemployment_rate: data.unemployment || prev.unemployment_rate
            }));
        } catch (e) {} 
        finally { setUpdatingGUS(false); }
    };

    const handleEcoUpdate = async () => {
        if (!formData.geojson || !formData.geojson.bbox) return;
        setUpdatingEco(true);
        try {
            const bbox = formData.geojson.bbox;
            const data = await api.parser.singleWaqi((bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2);
            setFormData(prev => ({ ...prev, air_quality: data.aqi || prev.air_quality }));
        } catch (e) {} 
        finally { setUpdatingEco(false); }
    };

    const handleGroupOsmUpdate = async (groupId) => {
        const pbfFile = localStorage.getItem('parser_file');
        if (!pbfFile || !selectedCity || !selectedDistrict) return;

        setUpdatingGroups(prev => ({ ...prev, [groupId]: true }));
        try {
            const group = METRIC_GROUPS.find(g => g.id === groupId);
            const metricsList = group.fields.map(f => f.key);
            const data = await api.parser.singleOsm(selectedCity.name, selectedDistrict.name, pbfFile, metricsList);
            
            const updatedCounts = {};
            metricsList.forEach(m => { if (data[m] !== undefined) updatedCounts[m] = data[m]; });
            const oldManualPois = (formData.poi_data || []).filter(poi => poi.source === 'manual' || !metricsList.includes(poi.type));
            
            setFormData(prev => ({ ...prev, ...updatedCounts, poi_data: [...oldManualPois, ...(data.parsed_pois || [])] }));
        } catch (e) {} 
        finally { setUpdatingGroups(prev => ({ ...prev, [groupId]: false })); }
    };

    const handleFullParse = async () => {
        const pbfFile = localStorage.getItem('parser_file');
        if (!pbfFile || !selectedCity || !selectedDistrict) return;
        setIsFullParsing(true);
        try {
            const gusData = await api.parser.singleGus(selectedCity.name).catch(() => ({}));
            let waqiData = {};
            if (formData.geojson && formData.geojson.bbox) {
                const bbox = formData.geojson.bbox;
                waqiData = await api.parser.singleWaqi((bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2).catch(() => ({}));
            }
            const regionStr = localStorage.getItem('parser_region') || '';
            const url = generatePropertyLink(selectedCountry.name, selectedCity.name, selectedDistrict.name, regionStr);
            const otodomData = url && url !== '#' ? await api.parser.singleOtodom(url).catch(() => ({})) : {};
            const allOsmMetrics = METRIC_GROUPS.flatMap(g => g.fields).filter(f => f.key.includes('_count')).map(f => f.key);
            const osmData = await api.parser.singleOsm(selectedCity.name, selectedDistrict.name, pbfFile, allOsmMetrics).catch(() => ({}));

            const updatedCounts = {};
            if (osmData.parsed_pois) {
                allOsmMetrics.forEach(m => { if (osmData[m] !== undefined) updatedCounts[m] = osmData[m]; });
            }
            const oldManualPois = (formData.poi_data || []).filter(poi => poi.source === 'manual');

            setFormData(prev => ({
                ...prev,
                average_salary: gusData.salary || prev.average_salary,
                unemployment_rate: gusData.unemployment || prev.unemployment_rate,
                air_quality: waqiData.aqi || prev.air_quality,
                average_property_price: otodomData.sale?.avgPrice || prev.average_property_price,
                average_sale_price_sqm: otodomData.sale?.avgSqm || prev.average_sale_price_sqm,
                average_rent_price: otodomData.rent?.avgPrice || prev.average_rent_price,
                ...updatedCounts,
                poi_data: [...oldManualPois, ...(osmData.parsed_pois || [])]
            }));
        } catch (e) {} 
        finally { setIsFullParsing(false); }
    };

    const handleSaveMapData = (newManualPois, updatedCounts) => {
        const freshFormData = { ...formData, poi_data: newManualPois, ...updatedCounts };
        METRIC_GROUPS.flatMap(g => g.fields).forEach(f => {
            if (f.type === 'number' && f.key.includes('_count') && !updatedCounts[f.key]) freshFormData[f.key] = 0;
        });
        setFormData(freshFormData);
    };

    const handleCancel = () => {
        setSelectedDistrict(null); 
        localStorage.removeItem(`draft_district_${selectedDistrict?.id}`);
    };

    const completeness = {
        geo: formData.geojson ? 'green' : 'red',
        photo: photoPreview ? 'green' : 'red',
        pop: formData.population > 0 ? 'green' : 'red',
        prices: (formData.average_property_price > 0 && formData.average_rent_price > 0) ? 'green' : (formData.average_property_price > 0 || formData.average_rent_price > 0) ? 'yellow' : 'red',
        infra: formData.poi_data?.length > 0 ? 'green' : 'yellow'
    };

    return {
        formData, photoPreview, loading, isMapEditorOpen, setIsMapEditorOpen,
        updatingOtodom, updatingGUS, updatingEco, updatingGroups, isFullParsing,
        completeness, handleFileChange, handleSaveDistrict, handleFieldChange,
        handleSingleOtodomUpdate, handleGusUpdate, handleEcoUpdate,
        handleGroupOsmUpdate, handleFullParse, handleSaveMapData, handleCancel
    };
};