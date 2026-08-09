// @ts-nocheck
// src/utils/propertyHelpers.js

const REGIONS = {
    PL: [
        'dolnoslaskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
        'lodzkie', 'malopolskie', 'mazowieckie', 'opolskie',
        'podkarpackie', 'podlaskie', 'pomorskie', 'slaskie',
        'swietokrzyskie', 'warminsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
    ],
    UA: [
        'kyiv', 'lviv', 'odesa', 'kharkiv', 'dnipro', 
        'ivano-frankivsk', 'zakarpattia', 'volyn', 'vinnytsia', 'zhytomyr',
        'zaporizhzhia', 'kirovohrad', 'mykolaiv', 'poltava', 'rivne',
        'sumy', 'ternopil', 'kherson', 'khmelnytskyi', 'cherkasy',
        'chernivtsi', 'chernihiv'
    ]
};

/**
 * Універсальний slugify для польських та українських назв
 */
export const slugify = (text) => {
    if (!text) return '';
    
    const charMap = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
        // Базова транслітерація для UA (для OLX лінків)
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 'ж': 'zh', 
        'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia'
    };

    return text.toString()
        .toLowerCase()
        .trim()
        .split('')
        .map(c => charMap[c] || c)
        .join('')
        .replace(/\s+/g, '-')           // Пробіли на дефіси
        .replace(/[^\w-]+/g, '')       // Видалити все крім літер та дефісів
        .replace(/--+/g, '-')          // Видалити подвійні дефіси
        .replace(/^-+/, '')            // Видалити дефіси на початку
        .replace(/-+$/, '');           // Видалити дефіси в кінці
};

export const getRegionsForCountry = (identifier) => {
    if (!identifier) return [];
    let key = identifier.toString().toUpperCase();
    const NAME_TO_CODE = { 
        'POLAND': 'PL', 'POLSKA': 'PL', 'ПОЛЬЩА': 'PL', 
        'UKRAINE': 'UA', 'UKRAINA': 'UA', 'УКРАЇНА': 'UA' 
    };
    if (NAME_TO_CODE[key]) key = NAME_TO_CODE[key];
    return REGIONS[key] || [];
};

export const generatePropertyLink = (countryName, city, district, region) => {
    const code = countryName?.toLowerCase();
    const isPL = ['poland', 'pl', 'polska', 'польща'].includes(code);
    const isUA = ['ukraine', 'ua', 'ukraina', 'україна'].includes(code);

    if (isPL) {
        let rSlug = slugify(region);
        if (!rSlug) rSlug = 'cala-polska'; 
        
        // Специфічне форматування Otodom для воєводств
        if (['kujawsko-pomorskie', 'warminsko-mazurskie', 'zachodniopomorskie'].includes(rSlug)) {
            rSlug = rSlug.replace('-', '--');
        }
        
        const cSlug = slugify(city);
        let dSlug = slugify(district);
        
        // Якщо назва району включає назву міста, видаляємо її (стандарт Otodom)
        if (dSlug.startsWith(`${cSlug}-`)) dSlug = dSlug.replace(`${cSlug}-`, ''); 

        return `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/${rSlug}/${cSlug}/${cSlug}/${cSlug}/${dSlug}?limit=36`;
    }

    if (isUA) {
        // OLX.ua використовує кириличні слаги або ID. 
        // Якщо передано назву міста кирилицею, slugify її очистить для URL.
        return `https://www.olx.ua/uk/nedvizhimost/kvartiry/${slugify(city)}/?search%5Bdistrict_id%5D=${slugify(district)}`;
    }

    return ''; 
};
