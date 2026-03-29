import express from "express";
import * as dbController from "../controllers/dbController.js";
import * as parserController from "../controllers/parserController.js";
import { requireAuth } from "../middleware/auth.js";
import * as configController from "../controllers/configController.js";
import * as translationController from "../controllers/translationController.js";
import * as scraperRulesController from "../controllers/scraperRulesController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/db/stats", dbController.getDashboardStats);
router.get("/db/countries", dbController.getCountries);
router.post("/db/countries", dbController.createCountry);
router.get("/db/cities/:countryId", dbController.getCities);
router.post("/db/cities", dbController.createCity);
router.delete("/db/cities/:id", dbController.deleteCity);
router.get("/db/districts/:cityId", dbController.getDistricts);
router.post("/db/districts", dbController.createDistrict);
router.delete("/db/districts/:id", dbController.deleteDistrict);
router.patch("/db/districts/:id/status", dbController.updateDistrictStatus);
router.get("/db/cities/:cityId/map", dbController.getCityMapData);
router.get("/db/district-data/:districtId", dbController.getDistrictData);
router.post("/db/save-results", dbController.saveResults);
router.delete("/db/countries/:id", dbController.deleteCountry);
router.get("/status", parserController.getStatus);
router.get("/current-log", parserController.getCurrentLog);
router.get("/download-log", parserController.downloadLog);
router.get("/pbf-files", parserController.getPbfFiles);
router.get("/pending-results", parserController.getPendingResults);
router.delete("/pending-results", parserController.deletePendingResults);
router.post("/update-pending", parserController.updatePendingResults);
router.post("/find-districts", parserController.findDistricts);
router.post("/run-osm-parser", parserController.runOsmParser);

router.get("/config/fields", configController.getFields);
router.get("/config/groups", configController.getGroups);
router.post("/config/fields", configController.createField);
router.put("/config/fields/:id", configController.updateField);
router.delete("/config/fields/:id", configController.deleteField);

router.get("/config/translations", translationController.getTranslations);
router.post("/config/translations", translationController.saveTranslation);
router.delete("/config/translations/:key", translationController.deleteTranslation);
router.get("/config/scraper-rules", scraperRulesController.getRules);
router.post("/config/scraper-rules", scraperRulesController.saveRule);
router.delete("/config/scraper-rules/:id", scraperRulesController.deleteRule);

export default router;