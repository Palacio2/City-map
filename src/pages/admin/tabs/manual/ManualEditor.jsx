import React from 'react';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import MapEditorModal from '../map/MapEditorModal'; 
import { useManualEditor } from '../../hooks/useManualEditor';
import { FaMapMarkedAlt, FaImage, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSyncAlt, FaSave, FaTimes } from 'react-icons/fa';
import styles from './ManualEditor.module.css';
import uiStyles from '../../ui/AdminUI.module.css';
import { useTranslation } from 'react-i18next';

const DataBadge = ({ icon: Icon, label, status }) => {
    const statusConfig = {
        green: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)', icon: <FaCheckCircle /> },
        yellow: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)', icon: <FaExclamationTriangle /> },
        red: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--danger)', icon: <FaTimesCircle /> }
    };
    const c = statusConfig[status] || statusConfig.red;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: c.bg, color: c.text, fontSize: '0.85rem', fontWeight: '600', border: `1px solid ${c.text}30` }}>
            <Icon size={16} /><span>{label}</span><span style={{ marginLeft: 'auto', paddingLeft: '8px' }}>{c.icon}</span>
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
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '1.2rem' }}>{t('manualEditor.inactiveTitle')}</h3>
                <p>{t('manualEditor.inactiveDesc')}</p>
            </div>
        );
    }

    return (
        <div className={styles.editor}>
            <div className={styles.editorHeader}>
                <div className={styles.headerInfo}>
                    <h2 className={styles.editorTitle}>{selectedDistrict.name}</h2>
                    <span className={styles.breadcrumbs}>{selectedCountry?.name} / {selectedCity?.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', background: 'var(--bg-main)', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
                        <input type="checkbox" checked={!!logic.formData.is_available} onChange={e => logic.handleFieldChange('is_available', e.target.checked, 'boolean')} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                        {t('manualEditor.publiclyAvailable')}
                    </label>
                    <button onClick={logic.handleFullParse} disabled={logic.isFullParsing} className={`${uiStyles.btn} ${uiStyles.btnPrimary}`}>
                        <FaSyncAlt className={logic.isFullParsing ? styles.spinIcon : ''} />
                        {logic.isFullParsing ? t('manualEditor.collecting') : t('manualEditor.updateParserBtn')}
                    </button>
                </div>
            </div>

            <div className={styles.statusGrid}>
                <DataBadge icon={FaMapMarkedAlt} label={t('manualEditor.badgeGeo')} status={logic.completeness.geo} />
                <DataBadge icon={FaImage} label={t('manualEditor.badgePhoto')} status={logic.completeness.photo} />
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{t('manualEditor.photoTitle')}</h3>
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
                                <FaImage size={32} color="var(--text-muted)" />
                                <span>{t('manualEditor.uploadPrompt')}</span>
                            </div>
                        )}
                    </label>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{t('manualEditor.mapPoisTitle')}</h3>
                    <button onClick={() => logic.setIsMapEditorOpen(true)} className={`${uiStyles.btn} ${styles.mapBtn}`}>
                        <FaMapMarkedAlt /> {t('manualEditor.openGisBtn')}
                    </button>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <strong>{t('manualEditor.totalPoints')}</strong> {logic.formData.poi_data?.length || 0}. 
                    {t('manualEditor.gisHint')}
                </div>
            </div>

            {METRIC_GROUPS.map(group => {
                return (
                    <div key={group.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            {/* ВСІ КНОПКИ "ОНОВИТИ" (singleOtodom, singleGus, тощо) БУЛО ВИДАЛЕНО ЗВІДСИ */}
                            <h3 className={styles.cardTitle}>{group.icon} {group.label}</h3>
                        </div>
                        <div className={styles.formGrid}>
                            {group.fields.map(field => (
                                <div key={field.key} className={uiStyles.formGroup}>
                                    <label className={uiStyles.label}>{field.label}</label>
                                    <input 
                                        type={field.type === 'text' ? 'text' : 'number'} 
                                        className={uiStyles.input} 
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

            <div className={styles.actionsRow}>
                <button onClick={logic.handleCancel} className={`${uiStyles.btn} ${uiStyles.btnCancel}`}>
                    <FaTimes /> {t('manualEditor.cancelBtn')}
                </button>
                <button onClick={logic.handleSaveDistrict} disabled={logic.loading} className={`${uiStyles.btn} ${uiStyles.btnPrimary}`}>
                    <FaSave /> {logic.loading ? t('manualEditor.saving') : t('manualEditor.saveBtn')}
                </button>
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