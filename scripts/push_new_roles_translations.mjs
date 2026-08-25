import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://puwcmmwlpxxcolwifexp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1d2NtbXdscHh4Y29sd2lmZXhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxOTg2NiwiZXhwIjoyMDcxMTk1ODY2fQ.MgV5upRhqi1AXKhHOQzO76auhHTIJekojSUcM6-LwY8';

async function updateTranslations() {
    const translations = [
        { translation_key: 'admin_roles.actions.manual_create', uk: 'Створення (райони, міста, країни)' },
        { translation_key: 'admin_roles.actions.manual_gis', uk: 'GIS Карта (маркери та полігони)' },
        { translation_key: 'admin_roles.actions.manual_delete', uk: 'Видалення даних' }
    ];

    for (const item of translations) {
        try {
            // Upsert translation
            const response = await fetch(`${SUPABASE_URL}/rest/v1/translations?translation_key=eq.${item.translation_key}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uk: item.uk })
            });
            
            if (!response.ok) {
                console.error(`Failed to update ${item.translation_key}: ${response.status}`);
            } else {
                console.log(`Successfully updated ${item.translation_key}`);
            }
        } catch (e) {
            console.error('Error updating:', e);
        }
    }
}

updateTranslations();
