import express from "express";
import * as dbController from "../controllers/dbController.js";
import * as parserController from "../controllers/parserController.js";
import { requireAuth } from "../middleware/auth.js";

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

router.get("/status", parserController.getStatus);
router.get("/current-log", parserController.getCurrentLog);
router.get("/download-log", parserController.downloadLog);
router.get("/pbf-files", parserController.getPbfFiles);
router.get("/pending-results", parserController.getPendingResults);
router.delete("/pending-results", parserController.deletePendingResults);
router.post("/update-pending", parserController.updatePendingResults);
router.post("/find-districts", parserController.findDistricts);
router.post("/single-otodom", parserController.singleOtodom);
router.post("/single-gus", parserController.singleGus);
router.post("/single-waqi", parserController.singleWaqi);
router.post("/single-osm", parserController.singleOsm);
router.post("/run-osm-parser", parserController.runOsmParser);

export default router;