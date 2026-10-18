import express from "express";
import * as dbController from "../controllers/dbController.js";
import * as parserController from "../controllers/parserController.js";
import { requireAuth, requireTab, requireSuperAdminAccess } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/db/save-results", requireTab('manual.save'), dbController.saveResults);

router.get("/status", requireTab('parser'), parserController.getStatus);
router.get("/current-log", requireTab('parser'), parserController.getCurrentLog);
router.get("/download-log", requireTab('parser'), parserController.downloadLog);
router.get("/pbf-files", requireTab('parser'), parserController.getPbfFiles);
router.get("/pending-results", requireTab('parser'), parserController.getPendingResults);
router.delete("/pending-results", requireTab('parser.run_offline'), parserController.deletePendingResults);
router.post("/update-pending", requireTab('parser.run_offline'), parserController.updatePendingResults);
router.post("/find-districts", requireTab('parser.scan_osm'), parserController.findDistricts);
router.post("/run-osm-parser", requireTab('parser.run_offline'), parserController.runOsmParser);

// Deploy webhook proxy — keeps DEPLOY_WEBHOOK_URL server-side only
router.post("/deploy", requireSuperAdminAccess, async (req, res) => {
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