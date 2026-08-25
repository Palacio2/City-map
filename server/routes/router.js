import express from "express";
import * as dbController from "../controllers/dbController.js";
import * as parserController from "../controllers/parserController.js";
import { requireAuth, requireTab } from "../middleware/auth.js";
import * as configController from "../controllers/configController.js";
import * as translationController from "../controllers/translationController.js";
import * as scraperRulesController from "../controllers/scraperRulesController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/db/stats", dbController.getDashboardStats);
router.get("/db/countries", dbController.getCountries);
router.post("/db/countries", requireTab('manual.create.country'), dbController.createCountry);
router.get("/db/cities/:countryId", dbController.getCities);
router.post("/db/cities", requireTab('manual.create.city'), dbController.createCity);
router.delete("/db/cities/:id", requireTab('manual.delete'), dbController.deleteCity);
router.get("/db/districts/:cityId", dbController.getDistricts);
router.post("/db/districts", requireTab('manual.create.district'), dbController.createDistrict);
router.delete("/db/districts/:id", requireTab('manual.delete'), dbController.deleteDistrict);
router.patch("/db/districts/:id/status", requireTab('manual.edit'), dbController.updateDistrictStatus);
router.get("/db/cities/:cityId/map", dbController.getCityMapData);
router.get("/db/district-data/:districtId", dbController.getDistrictData);
router.post("/db/save-results", requireTab('manual.save'), dbController.saveResults);
router.delete("/db/countries/:id", requireTab('manual.delete'), dbController.deleteCountry);
router.get("/status", parserController.getStatus);
router.get("/current-log", parserController.getCurrentLog);
router.get("/download-log", parserController.downloadLog);
router.get("/pbf-files", parserController.getPbfFiles);
router.get("/pending-results", parserController.getPendingResults);
router.delete("/pending-results", requireTab('parser.run_offline'), parserController.deletePendingResults);
router.post("/update-pending", requireTab('parser.run_offline'), parserController.updatePendingResults);
router.post("/find-districts", requireTab('parser.run_offline'), parserController.findDistricts);
router.post("/run-osm-parser", requireTab('parser.run_offline'), parserController.runOsmParser);

router.get("/config/fields", configController.getFields);
router.get("/config/groups", configController.getGroups);
router.post("/config/fields", requireTab('fields.add'), configController.createField);
router.put("/config/fields/:id", requireTab('fields.edit'), configController.updateField);
router.delete("/config/fields/:id", requireTab('fields.delete'), configController.deleteField);

router.get("/config/translations", translationController.getTranslations);
router.post("/config/translations", requireTab('translations.edit'), translationController.saveTranslation);
router.delete("/config/translations/:key", requireTab('translations.delete'), translationController.deleteTranslation);
router.get("/config/scraper-rules", scraperRulesController.getRules);
router.post("/config/scraper-rules", requireTab('scraper.add_rule'), scraperRulesController.saveRule);
router.delete("/config/scraper-rules/:id", requireTab('scraper.delete_rule'), scraperRulesController.deleteRule);

// Deploy webhook proxy — keeps DEPLOY_WEBHOOK_URL server-side only
router.post("/deploy", requireTab('dashboard'), async (req, res) => {
    const webhookUrl = process.env.DEPLOY_WEBHOOK_URL;
    if (!webhookUrl) {
        return res.status(500).json({ error: 'DEPLOY_WEBHOOK_URL is not configured on the server.' });
    }
    try {
        const response = await fetch(webhookUrl, { method: 'POST' });
        if (!response.ok) {
            return res.status(502).json({ error: `Deploy webhook returned ${response.status}` });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(502).json({ error: 'Failed to trigger deploy webhook.' });
    }
});

export default router;