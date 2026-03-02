export async function launchBrowser() {
    return await puppeteer.launch({
        headless: "new", // Використовуємо новий стабільний режим
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--single-process',           // КРИТИЧНО: економить RAM на безкоштовному тарифі
            '--disable-extensions',       // Вимикає зайві плагіни браузера
            '--no-zygote'                 // Зменшує кількість фонових процесів
        ]
    });
}