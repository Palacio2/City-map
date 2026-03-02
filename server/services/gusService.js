import axios from 'axios';
import * as cheerio from 'cheerio';

export const fetchCityMacroStats = async (cityName) => {
    if (!cityName) return { salary: 0, unemployment: 0 };
    
    const normalizedCity = cityName
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l").replace(/ /g, "-");

    const url = `https://wskazniki.gospodarka.gov.pl/miasto/${normalizedCity}`;

    try {
        const { data } = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(data);
        let salary = 0;
        let unemployment = 0;

        const textContent = $('body').text();
        
        const salaryMatch = textContent.match(/przeciętne\s+wynagrodzenie[^\d]*?([\d\s]+[,.]?\d*)\s*zł/i);
        if (salaryMatch) {
            salary = parseFloat(salaryMatch[1].replace(/\s/g, '').replace(',', '.'));
        }

        const unempMatch = textContent.match(/stopa\s+bezrobocia[^\d]*?([\d]+[,.]?\d*)\s*%/i);
        if (unempMatch) {
            unemployment = parseFloat(unempMatch[1].replace(',', '.'));
        }

        return { 
            salary: Math.round(salary) || 0, 
            unemployment: unemployment || 0 
        };
    } catch (error) {
        return { salary: 0, unemployment: 0 };
    }
};