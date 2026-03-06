import React from 'react';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import MapEditorModal from '../map/MapEditorModal'; 
import { useManualEditor } from '../../hooks/useManualEditor';
import { FaMapMarkedAlt, FaImage, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSyncAlt, FaSave, FaTimes } from 'react-icons/fa';
import styles from './ManualEditor.module.css';
import { useTranslation } from 'react-i18next';

const DataBadge = ({ icon: Icon, label, status }) => {
    const colors = {
        green: { bg: '#dcfce7', text: '#166534', icon: <FaCheckCircle /> },
        yellow: { bg: '#fef3c7', text: '#854d0e', icon: <FaExclamationTriangle /> },
        red: { bg: '#fee2e2', text: '#991b1b', icon: <FaTimesCircle /> }
    };
    const c = colors[status] || colors.red;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', backgroundColor: c.bg, color: c.text, fontSize: '0.85rem', fontWeight: '600', border: `1px solid ${c.text}30` }}>
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
                <h3 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '1.2rem' }}>{t('manualEditor.inactiveTitle')}</h3>
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#334155', background: '#f1f5f9', padding: '8px 16px', borderRadius: '10px' }}>
                        <input type="checkbox" checked={!!logic.formData.is_available} onChange={e => logic.handleFieldChange('is_available', e.target.checked, 'boolean')} style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }} />
                        {t('manualEditor.publiclyAvailable')}
                    </label>
                    <button onClick={logic.handleFullParse} disabled={logic.isFullParsing} className={`${styles.btn} ${styles.actionBtn}`}>
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
                                <FaImage size={32} color="#94a3b8" />
                                <span>{t('manualEditor.uploadPrompt')}</span>
                            </div>
                        )}
                    </label>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{t('manualEditor.mapPoisTitle')}</h3>
                    <button onClick={() => logic.setIsMapEditorOpen(true)} className={`${styles.btn} ${styles.mapBtn}`}>
                        <FaMapMarkedAlt /> {t('manualEditor.openGisBtn')}
                    </button>
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#475569' }}>
                    <strong>{t('manualEditor.totalPoints')}</strong> {logic.formData.poi_data?.length || 0}. 
                    {t('manualEditor.gisHint')}
                </div>
            </div>

            {METRIC_GROUPS.map(group => {
                const isOtodom = group.id === 'real_estate';
                const isGus = group.id === 'demographics';
                const isEco = group.id === 'ecology';
                const isOsm = !isOtodom && !isGus && !isEco;

                return (
                    <div key={group.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{group.icon} {group.label}</h3>
                            {isOtodom && (
                                <button onClick={logic.handleSingleOtodomUpdate} disabled={logic.updatingOtodom} className={`${styles.btn} ${styles.ghostBtn}`}>
                                    <FaSyncAlt className={logic.updatingOtodom ? styles.spinIcon : ''} /> {logic.updatingOtodom ? '...' : 'Otodom'}
                                </button>
                            )}
                            {isGus && (
                                <button onClick={logic.handleGusUpdate} disabled={logic.updatingGUS} className={`${styles.btn} ${styles.ghostBtn}`}>
                                    <FaSyncAlt className={logic.updatingGUS ? styles.spinIcon : ''} /> {logic.updatingGUS ? '...' : 'GUS'}
                                </button>
                            )}
                            {isEco && (
                                <button onClick={logic.handleEcoUpdate} disabled={logic.updatingEco} className={`${styles.btn} ${styles.ghostBtn}`}>
                                    <FaSyncAlt className={logic.updatingEco ? styles.spinIcon : ''} /> {logic.updatingEco ? '...' : 'WAQI'}
                                </button>
                            )}
                            {isOsm && (
                                <button onClick={() => logic.handleGroupOsmUpdate(group.id)} disabled={logic.updatingGroups[group.id]} className={`${styles.btn} ${styles.ghostBtn}`}>
                                    <FaSyncAlt className={logic.updatingGroups[group.id] ? styles.spinIcon : ''} /> {logic.updatingGroups[group.id] ? '...' : 'OSM'}
                                </button>
                            )}
                        </div>
                        <div className={styles.formGrid}>
                            {group.fields.map(field => (
                                <div key={field.key} className={styles.inputGroup}>
                                    <label className={styles.label}>{field.label}</label>
                                    <input 
                                        type={field.type === 'text' ? 'text' : 'number'} 
                                        className={styles.input} 
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

            <div className={styles.stickyActions}>
                <button onClick={logic.handleCancel} className={`${styles.btn} ${styles.cancelBtn}`}>
                    <FaTimes /> {t('manualEditor.cancelBtn')}
                </button>
                <button onClick={logic.handleSaveDistrict} disabled={logic.loading} className={`${styles.btn} ${styles.saveBtn}`}>
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