// src/utils/phoneUtils.js

// Список кодів країн з правилами валідації (min/max - це загальна кількість цифр у номері разом з кодом)
export const countryCodes = [
  { name: 'Україна', code: '+380', minLength: 12, maxLength: 12 }, // 380 + 9 цифр = 12
  { name: 'Польща', code: '+48', minLength: 11, maxLength: 11 },   // 48 + 9 цифр = 11
  { name: 'Німеччина', code: '+49', minLength: 11, maxLength: 14 },
  { name: 'США', code: '+1', minLength: 11, maxLength: 11 }        // 1 + 10 цифр = 11
];

// Форматування для красивого відображення
export const formatPhoneNumber = (phoneStr) => {
    if (!phoneStr || phoneStr === 'Не вказано') return 'Не вказано';
    
    // Залишаємо тільки цифри та плюс
    const clean = phoneStr.replace(/[^\d+]/g, '');

    // Україна: +380 XX XXX-XX-XX (13 символів разом з "+")
    // Якщо номер правильний (наприклад +380501234567)
    if (clean.startsWith('+380') && clean.length === 13) {
        return clean.replace(/(\+380)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3-$4-$5');
    }

    // Польща: +48 XXX XXX XXX (12 символів разом з "+")
    if (clean.startsWith('+48') && clean.length === 12) {
        return clean.replace(/(\+48)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }

    // Якщо формат не розпізнано, повертаємо як є
    return phoneStr;
};

// Парсинг повного номера на Код та Номер (для форми редагування)
export const parsePhoneNumber = (fullPhone) => {
    if (!fullPhone) return { code: '+380', number: '' };
    
    const foundCode = countryCodes.find(item => fullPhone.startsWith(item.code));
    
    if (foundCode) {
        const number = fullPhone.substring(foundCode.code.length).trim();
        return { code: foundCode.code, number: number };
    }
    
    return { code: '+380', number: fullPhone };
};

// Очистка номера перед збереженням (видаляє пробіли, дужки, залишає + та цифри)
export const cleanPhoneNumberForSave = (countryCode, phoneNumber) => {
    if (!phoneNumber.trim()) return null;
    const cleanNumber = phoneNumber.replace(/\D/g, ''); // Тільки цифри
    return `${countryCode}${cleanNumber}`;
};

// Валідація довжини номера
export const validatePhoneNumber = (code, number) => {
    if (!number || !number.trim()) return null; 

    // Склеюємо код і введену частину, щоб перевірити повну довжину
    const fullNumberDigits = (code + number).replace(/\D/g, '');
    const countryRule = countryCodes.find(c => c.code === code);

    if (!countryRule) return null; 

    if (fullNumberDigits.length < countryRule.minLength) {
        return `Номер має містити ${countryRule.minLength - code.replace(/\D/g, '').length} цифр після коду.`;
    }
    
    if (fullNumberDigits.length > countryRule.maxLength) {
        return `Номер занадто довгий.`;
    }

    return null;
};