import React from 'react';
import { FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';
import styles from './UsersTab.module.css';

const CityAssignmentModal = ({ 
    isOpen, onClose, selectedAdmin, availableCities, adminCities, 
    toggleCitySelection, saveCityAssignments, processingId 
}) => {
    if (!isOpen || !selectedAdmin) return null;

    const modalTitle = (
        <>
            <FaMapMarkerAlt className={styles.sortIconActive} /> 
            <span>Manage Territories</span>
        </>
    );

    const modalActions = (
        <>
            <button className={`${uiStyles.btn} ${uiStyles.btnCancel}`} onClick={onClose} disabled={processingId === selectedAdmin.id}>
                Cancel
            </button>
            <button className={`${uiStyles.btn} ${uiStyles.btnPrimary}`} onClick={saveCityAssignments} disabled={processingId === selectedAdmin.id}>
                {processingId === selectedAdmin.id ? 'Saving...' : <><FaSave /> Save Changes</>}
            </button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="400px" actions={modalActions}>
            <div className={styles.modalFormWrapper}>
                <p className={styles.modalSubtitle}>
                    Assign cities to <strong>{selectedAdmin.email}</strong>. 
                    They will only be able to view and edit data for these selected locations.
                </p>
                
                <div className={styles.cityChecklist}>
                    {availableCities.length === 0 ? (
                        <div className={styles.placeholderWrapper}>
                            <span className={styles.placeholder}>No cities found in database.</span>
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
                                {city.name}
                            </label>
                        ))
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default React.memo(CityAssignmentModal);