import React from 'react';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import MapEditorModal from '../map/MapEditorModal'; 
import { useManualEditor } from '../../hooks/useManualEditor';
import { FaMapMarkedAlt, FaImage, FaUsers, FaMoneyBillWave, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaBuilding, FaSyncAlt, FaRocket } from 'react-icons/fa';
import styles from './ManualEditor.module.css';

const DataBadge = ({ icon: Icon, label, status }) => {
    const colors = {
        green: { bg: '#dcfce7', text: '#166534', icon: <FaCheckCircle /> },
        yellow: { bg: '#fef3c7', text: '#854d0e', icon: <FaExclamationTriangle /> },
        red: { bg: '#fee2e2', text: '#991b1b', icon: <FaTimesCircle /> }
    };
    const c = colors[status] || colors.red;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: c.bg, color: c.text, fontSize: '0.85rem', fontWeight: '600', border: `1px solid ${c.text}20` }}>
            <Icon size={16} /><span>{label}</span><span style={{ marginLeft: 'auto', paddingLeft: '4px' }}>{c.icon}</span>
        </div>
    );
};

export default function ManualEditor({ selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict }) {
    const logic = useManualEditor(selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict);

    if (!selectedDistrict) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>👈</div>
                <h3>Оберіть або створіть район зліва</h3>
                <p>Щоб почати редагування або завантаження фото</p>
            </div>
        );
    }

    return (
        <div className={styles.editor}>
            <MapEditorModal isOpen={logic.isMapEditorOpen} onClose={() => logic.setIsMapEditorOpen(false)} rowData={{ ...logic.formData, district_name: selectedDistrict?.name }} onSaveMapData={logic.handleSaveMapData} />
            
            <div className={styles.editorHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={styles.headerInfo}>
                    <h2 className={styles.editorTitle}>
                        {selectedDistrict.name}
                        <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', marginLeft: '12px', background: logic.formData.is_available ? '#dcfce7' : '#f1f5f9', color: logic.formData.is_available ? '#166534' : '#64748b' }}>
                            {logic.formData.is_available ? '👁️ Опубліковано' : '🙈 Приховано'}
                        </span>
                    </h2>
                    <span className={styles.breadcrumbs}>{selectedCountry?.name} / {selectedCity?.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={logic.handleFullParse} disabled={logic.isFullParsing} className={`${styles.btn} ${styles.warningBtn}`} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {logic.isFullParsing ? <FaSyncAlt className={styles.spin} /> : <FaRocket />} 
                        {logic.isFullParsing ? 'Парсинг...' : 'Парсити повністю'}
                    </button>
                    <button onClick={() => logic.setIsMapEditorOpen(true)} className={`${styles.btn} ${styles.accentBtn}`} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🗺️ Редактор Карти
                    </button>
                </div>
            </div>

            <div className={styles.card} style={{ borderLeft: logic.formData.is_available ? '4px solid #22c55e' : '4px solid #94a3b8', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Налаштування публікації</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            {logic.formData.is_available ? "Цей район бачать користувачі у додатку." : "Район приховано. Використовуйте це, поки заповнюєте дані."}
                        </p>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={!!logic.formData.is_available} onChange={(e) => logic.handleFieldChange('is_available', e.target.checked, 'boolean')} style={{ width: '20px', height: '20px', marginRight: '10px', cursor: 'pointer' }} />
                        Публічний доступ
                    </label>
                </div>
                <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#475569' }}>Повнота заповнення даних:</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <DataBadge icon={FaImage} label="Головне фото" status={logic.completeness.photo} />
                        <DataBadge icon={FaMapMarkedAlt} label="Межі (GeoJSON)" status={logic.completeness.geo} />
                        <DataBadge icon={FaMoneyBillWave} label="Ціни нерухомості" status={logic.completeness.prices} />
                        <DataBadge icon={FaUsers} label="Населення" status={logic.completeness.pop} />
                        <DataBadge icon={FaBuilding} label="Інфраструктура" status={logic.completeness.infra} />
                    </div>
                </div>
            </div>
            
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>📸 Головне фото району</h3>
                <div className={styles.photoDropzone}>
                    {logic.photoPreview ? (
                        <div className={styles.previewContainer}>
                            <img src={logic.photoPreview} alt="Preview" className={styles.previewImage} />
                            <div className={styles.previewOverlay}>
                                <label htmlFor="photo-upload" className={`${styles.btn} ${styles.primaryBtn}`} style={{cursor: 'pointer'}}>🔄 Замінити фото</label>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyPhotoState}>
                            <span className={styles.emptyPhotoIcon}>🏞️</span>
                            <p>Немає головного фото</p>
                            <label htmlFor="photo-upload" className={`${styles.btn} ${styles.defaultBtn}`} style={{cursor: 'pointer'}}>Вибрати фотографію</label>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={logic.handleFileChange} id="photo-upload" style={{display: 'none'}} />
                </div>
            </div>

            {METRIC_GROUPS.map(group => {
                const isOsmGroup = ['utilities', 'security', 'education', 'medicine', 'transport', 'commerce', 'services', 'leisure'].includes(group.id);
                return (
                    <div key={group.id} className={styles.card}>
                        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className={styles.cardTitle}>{group.icon} {group.label}</h3>
                            {group.id === 'finance' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={logic.handleSingleOtodomUpdate} disabled={logic.updatingOtodom} className={`${styles.btn} ${styles.warningBtn}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                        <FaSyncAlt className={logic.updatingOtodom ? styles.spin : ''} style={{ marginRight: '6px' }}/>{logic.updatingOtodom ? 'Парсинг...' : 'Otodom'}
                                    </button>
                                    <button onClick={logic.handleGusUpdate} disabled={logic.updatingGUS} className={`${styles.btn} ${styles.defaultBtn}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                        <FaSyncAlt className={logic.updatingGUS ? styles.spin : ''} style={{ marginRight: '6px' }}/>{logic.updatingGUS ? 'Оновлення...' : 'Макро (GUS)'}
                                    </button>
                                </div>
                            )}
                            {group.id === 'eco' && (
                                <button onClick={logic.handleEcoUpdate} disabled={logic.updatingEco} className={`${styles.btn} ${styles.defaultBtn}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                    <FaSyncAlt className={logic.updatingEco ? styles.spin : ''} style={{ marginRight: '6px' }}/>{logic.updatingEco ? 'Оновлення...' : 'Екологія (WAQI)'}
                                </button>
                            )}
                            {isOsmGroup && (
                                <button onClick={() => logic.handleGroupOsmUpdate(group.id)} disabled={logic.updatingGroups[group.id]} className={`${styles.btn} ${styles.defaultBtn}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                    <FaSyncAlt className={logic.updatingGroups[group.id] ? styles.spin : ''} style={{ marginRight: '6px' }}/>{logic.updatingGroups[group.id] ? 'Оновлення...' : 'Оновити (OSM)'}
                                </button>
                            )}
                        </div>
                        <div className={styles.formGrid}>
                            {group.fields.map(field => (
                                <div key={field.key} className={styles.inputGroup}>
                                    <label className={styles.label}>{field.label}</label>
                                    <input type={field.type === 'text' ? 'text' : 'number'} className={styles.input} value={logic.formData[field.key] === undefined || logic.formData[field.key] === null ? '' : logic.formData[field.key]} onChange={e => logic.handleFieldChange(field.key, e.target.value, field.type)} placeholder={`Введіть ${field.label.toLowerCase()}...`} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            <div className={styles.stickyActions}>
                <button onClick={logic.handleCancel} className={`${styles.btn} ${styles.defaultBtn}`}>Скасувати</button>
                <button onClick={logic.handleSaveDistrict} disabled={logic.loading} className={`${styles.btn} ${styles.saveBtn}`}>
                    {logic.loading ? '⏳ Зберігаємо...' : '💾 Зберегти зміни'}
                </button>
            </div>
        </div>
    );
}