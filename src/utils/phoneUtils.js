export const countryCodes = [
  { name: 'Ukraine', code: '+380', minLength: 12, maxLength: 12 },
  { name: 'Poland', code: '+48', minLength: 11, maxLength: 11 },
  { name: 'Germany', code: '+49', minLength: 11, maxLength: 14 },
  { name: 'USA', code: '+1', minLength: 11, maxLength: 11 }
];

export const formatPhoneNumber = (phoneStr) => {
    if (!phoneStr || phoneStr === 'Не вказано') return 'Не вказано';
    
    const clean = phoneStr.replace(/[^\d+]/g, '');

    if (clean.startsWith('+380') && clean.length === 13) {
        return clean.replace(/(\+380)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3-$4-$5');
    }

    if (clean.startsWith('+48') && clean.length === 12) {
        return clean.replace(/(\+48)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }

    return phoneStr;
};

export const parsePhoneNumber = (fullPhone) => {
    if (!fullPhone) return { code: '+380', number: '' };
    
    const foundCode = [...countryCodes]
        .sort((a, b) => b.code.length - a.code.length)
        .find(item => fullPhone.startsWith(item.code));
    
    if (foundCode) {
        const number = fullPhone.substring(foundCode.code.length).trim();
        return { code: foundCode.code, number: number };
    }
    
    return { code: '+380', number: fullPhone };
};

export const cleanPhoneNumberForSave = (countryCode, phoneNumber) => {
    if (!phoneNumber || !phoneNumber.trim()) return null;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return `${countryCode}${cleanNumber}`;
};

export const validatePhoneNumber = (code, number, t) => {
    if (!number || !number.trim()) return null; 

    const fullNumberDigits = (code + number).replace(/\D/g, '');
    const countryRule = countryCodes.find(c => c.code === code);

    if (!countryRule) return null; 

    const codeLength = code.replace(/\D/g, '').length;
    
    if (fullNumberDigits.length < countryRule.minLength) {
        const requiredDigits = countryRule.minLength - codeLength;
        return t('edit_page.errors.phone_length', { count: requiredDigits });
    }
    
    if (fullNumberDigits.length > countryRule.maxLength) {
        return t('edit_page.errors.phone_too_long');
    }

    return null;
};