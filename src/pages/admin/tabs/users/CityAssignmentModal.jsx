import React from 'react';
import { FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';
import styles from './UsersTab.module.css';

const CityAssignmentModal = ({ 
    isOpen, onClose, selectedAdmin, availableCities, adminCities, 
    toggleCitySelection, saveCityAssignments, processingId, t 
}) => {
    if (!isOpen || !selectedAdmin) return null;

    const modalTitle = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaMapMarkerAlt style={{ color: 'var(--primary)' }} /> 
            <span>{t('usersTab.cityModal.title')}</span>
        </div>
    );

    const modalActions = (
        <>
            <button className={`${uiStyles.btn} ${uiStyles.btnCancel}`} onClick={onClose} disabled={processingId === selectedAdmin.id}>
                {t('usersTab.cityModal.cancel')}
            </button>
            <button className={`${uiStyles.btn} ${uiStyles.btnPrimary}`} onClick={saveCityAssignments} disabled={processingId === selectedAdmin.id}>
                {processingId === selectedAdmin.id ? t('usersTab.cityModal.saving') : <><FaSave /> {t('usersTab.cityModal.save')}</>}
            </button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="450px" actions={modalActions}>
            <div className={styles.modalFormWrapper}>
                <p className={uiStyles.modalSubtitle}>
                    {t('usersTab.cityModal.assignTo')} <strong style={{color: 'var(--primary)'}}>{selectedAdmin.email}</strong>. 
                    {' '}{t('usersTab.cityModal.assignDesc')}
                </p>
                
                <div className={styles.cityChecklist}>
                    {availableCities.length === 0 ? (
                        <div className={styles.placeholderWrapper}>
                            <span className={styles.placeholder}>{t('usersTab.cityModal.empty')}</span>
                        </div>
                    ) : (
                        availableCities.map(city => (
                            <label key={city.id} className={`${styles.cityCheckbox} ${adminCities.includes(city.id) ? styles.cityCheckboxActive : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={adminCities.includes(city.id)}
                                    onChange={() => toggleCitySelection(city.id)}
                                    className={styles.hiddenInput}
                                />
                                <span className={styles.checkboxFake}></span>
                                <span className={styles.cityName}>{city.name}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default React.memo(CityAssignmentModal);