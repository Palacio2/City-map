import React from 'react';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import MapEditorModal from '../map/MapEditorModal'; 
import { useManualEditor } from '../../hooks/useManualEditor';
import { FaMapMarkedAlt, FaImage, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSyncAlt, FaSave } from 'react-icons/fa';
import styles from './ManualEditor.module.css';
import uiStyles from '../../ui/AdminUI.module.css';
import { useTranslation } from 'react-i18next';

const DataBadge = ({ icon: Icon, label, status }) => {
    const statusConfig = {
        green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: 'var(--success)', icon: <FaCheckCircle /> },
        yellow: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: 'var(--warning)', icon: <FaExclamationTriangle /> },
        red: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: 'var(--danger)', icon: <FaTimesCircle /> }
    };
    const c = statusConfig[status] || statusConfig.red;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: 'var(--radius-full)', backgroundColor: c.bg, color: c.text, fontSize: '0.9rem', fontWeight: '700', border: `1px solid ${c.border}`, boxShadow: `0 2px 8px ${c.bg}` }}>
            <Icon size={16} /><span>{label}</span><span style={{ marginLeft: '12px', fontSize: '1.1rem' }}>{c.icon}</span>
        </div>
    );
};

export default function ManualEditor({ selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict }) {
    const { t } = useTranslation('admin');
    const logic = useManualEditor(selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict);

    if (!selectedDistrict) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>✏️</div>
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 800 }}>{t('manualEditor.inactiveTitle')}</h3>
                <p style={{ fontSize: '1rem' }}>{t('manualEditor.inactiveDesc')}</p>
            </div>
        );
    }

    return (
        <div className={styles.editor}>
            {/* ОНОВЛЕНА ЛИПКА ШАПКА */}
            <div className={styles.editorHeader}>
                <div className={styles.headerInfo}>
                    <h2 className={styles.editorTitle}>{selectedDistrict.name}</h2>
                    <span className={styles.breadcrumbs}>{selectedCountry?.name} <span style={{opacity: 0.5}}>/</span> {selectedCity?.name}</span>
                </div>
                
                <div className={styles.controlsGroup}>
                    {/* Інструменти */}
                    <div className={styles.toolsGroup}>
                        <label className={styles.switchWrapper}>
                            <div className={styles.switch}>
                                <input 
                                    type="checkbox" 
                                    checked={!!logic.formData.is_available} 
                                    onChange={e => logic.handleFieldChange('is_available', e.target.checked, 'boolean')} 
                                />
                                <span className={styles.slider}></span>
                            </div>
                            <span className={styles.switchLabel}>{t('manualEditor.publiclyAvailable')}</span>
                        </label>

                        <button 
                            onClick={logic.handleFullParse} 
                            disabled={logic.isFullParsing} 
                            className={`${uiStyles.btn} ${styles.parserBtn}`} 
                        >
                            <FaSyncAlt className={logic.isFullParsing ? styles.spinIcon : ''} />
                            <span>{logic.isFullParsing ? t('manualEditor.collecting') : t('manualEditor.updateParserBtn')}</span>
                        </button>
                    </div>

                    {/* Головні дії (Зберегти/Скасувати) */}
                    <div className={styles.actionGroup}>
                        <button onClick={logic.handleCancel} className={`${uiStyles.btn} ${uiStyles.btnCancel} ${styles.btnCancelCustom}`}>
                            {t('manualEditor.cancelBtn')}
                        </button>
                        <button onClick={logic.handleSaveDistrict} disabled={logic.loading} className={`${uiStyles.btn} ${uiStyles.btnPrimary} ${styles.saveBtn}`}>
                            <FaSave /> {logic.loading ? t('manualEditor.saving') : t('manualEditor.saveBtn')}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.editorContent}>
                <div className={styles.statusGrid}>
                    <DataBadge icon={FaMapMarkedAlt} label={t('manualEditor.badgeGeo')} status={logic.completeness.geo} />
                    <DataBadge icon={FaImage} label={t('manualEditor.badgePhoto')} status={logic.completeness.photo} />
                </div>

                <div className={styles.topCards}>
                    <div className={styles.card} style={{ flex: 1 }}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}><FaImage style={{color: 'var(--primary)'}}/> {t('manualEditor.photoTitle')}</h3>
                        </div>
                        <div className={styles.photoUploadArea}>
                            <input type="file" accept="image/*" onChange={logic.handleFileChange} className={styles.fileInput} id="district-photo" />
                            <label htmlFor="district-photo" className={styles.fileLabel}>
                                {logic.photoPreview ? (
                                    <div className={styles.previewContainer}>
                                        <img src={logic.photoPreview} alt="Preview" className={styles.previewImg} />
                                        <div className={styles.previewOverlay}><span>{t('manualEditor.changePhoto')}</span></div>
                                    </div>
                                ) : (
                                    <div className={styles.uploadPlaceholder}>
                                        <FaImage size={40} color="var(--primary)" style={{ opacity: 0.5 }} />
                                        <span>{t('manualEditor.uploadPrompt')}</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className={styles.card} style={{ flex: 1 }}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}><FaMapMarkedAlt style={{color: 'var(--primary)'}}/> {t('manualEditor.mapPoisTitle')}</h3>
                            <button onClick={() => logic.setIsMapEditorOpen(true)} className={`${uiStyles.btn} ${styles.mapBtn}`}>
                                {t('manualEditor.openGisBtn')}
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <span style={{ fontWeight: 600 }}>{t('manualEditor.totalPoints')}</span>
                                    <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>{logic.formData.poi_data?.length || 0}</span>
                                </div>
                                <p style={{ margin: 0, lineHeight: 1.5 }}>{t('manualEditor.gisHint')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.metricsContainer}>
                    {METRIC_GROUPS.map(group => {
                        return (
                            <div key={group.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}><span style={{fontSize: '1.2rem'}}>{group.icon}</span> {group.label}</h3>
                                </div>
                                <div className={styles.formGrid}>
                                    {group.fields.map(field => (
                                        <div key={field.key} className={uiStyles.formGroup}>
                                            <label className={uiStyles.label} style={{ color: 'var(--text-muted)' }}>{field.label}</label>
                                            <input 
                                                type={field.type === 'text' ? 'text' : 'number'} 
                                                className={uiStyles.input} 
                                                style={{ fontWeight: 600 }}
                                                value={logic.formData[field.key] === undefined || logic.formData[field.key] === null ? '' : logic.formData[field.key]} 
                                                onChange={e => logic.handleFieldChange(field.key, e.target.value, field.type)} 
                                                placeholder={t('manualEditor.inputPlaceholder')} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <MapEditorModal 
                isOpen={logic.isMapEditorOpen} 
                onClose={() => logic.setIsMapEditorOpen(false)}
                rowData={logic.formData}
                onSaveMapData={logic.handleSaveMapData}
            />
        </div>
    );
}