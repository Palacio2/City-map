const REGIONS = {
    PL: [
        'dolnoslaskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
        'lodzkie', 'malopolskie', 'mazowieckie', 'opolskie',
        'podkarpackie', 'podlaskie', 'pomorskie', 'slaskie',
        'swietokrzyskie', 'warminsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
    ],
    UA: [
        'Київська', 'Львівська', 'Одеська', 'Харківська', 'Дніпропетровська', 
        'Івано-Франківська', 'Закарпатська', 'Волинська', 'Вінницька', 'Житомирська',
        'Запорізька', 'Кіровоградська', 'Миколаївська', 'Полтавська', 'Рівненська',
        'Сумська', 'Тернопільська', 'Херсонська', 'Хмельницька', 'Черкаська',
        'Чернівецька', 'Чернігівська'
    ]
};

const slugifyPL = (text) => {
    if (!text) return '';
    const map = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 
        'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    
    return text.toString()
        .split('').map(c => map[c] || c).join('')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

export const getRegionsForCountry = (identifier) => {
    if (!identifier) return [];
    let key = identifier.toString().toUpperCase();
    const NAME_TO_CODE = { 'POLAND': 'PL', 'POLSKA': 'PL', 'ПОЛЬЩА': 'PL', 'UKRAINE': 'UA', 'UKRAINA': 'UA', 'УКРАЇНА': 'UA' };
    if (NAME_TO_CODE[key]) key = NAME_TO_CODE[key];
    return REGIONS[key] || [];
};

export const generatePropertyLink = (countryName, city, district, region) => {
    const name = countryName?.toLowerCase();
    
    if (['poland', 'pl', 'polska', 'польща'].includes(name)) {
        let rSlug = slugifyPL(region);
        if (!rSlug) rSlug = 'cala-polska'; 
        
        if (rSlug === 'kujawsko-pomorskie') rSlug = 'kujawsko--pomorskie';
        if (rSlug === 'warminsko-mazurskie') rSlug = 'warminsko--mazurskie';
        if (rSlug === 'zachodniopomorskie') rSlug = 'zachodnio--pomorskie';
        
        const cSlug = slugifyPL(city);
        let dSlug = slugifyPL(district);
        
        if (dSlug.startsWith(`${cSlug}-`)) dSlug = dSlug.replace(`${cSlug}-`, ''); 

        return `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/${rSlug}/${cSlug}/${cSlug}/${cSlug}/${dSlug}?limit=36`;
    }

    if (['ukraine', 'ua', 'ukraina', 'україна'].includes(name)) {
        return `https://www.olx.ua/uk/nedvizhimost/kvartiry/${slugifyPL(city)}/?search%5Bdistrict_id%5D=${slugifyPL(district)}`;
    }

    return '';
};