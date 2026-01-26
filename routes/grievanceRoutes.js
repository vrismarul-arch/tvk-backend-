import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import {
  submitGrievance,
  getGrievances,
  updateStatus,
  submitNoteOrUpdate,
  deleteGrievance
} from "../controllers/grievanceController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create new grievance
router.post(
  "/submit",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "audio", maxCount: 1 }
  ]),
  submitGrievance
);

// Get grievances (role-based)
router.get("/get", protect, getGrievances);

// Update status only
router.patch("/:id/status", protect, updateStatus);

// Add note / update grievance (images/audio/status)
router.patch(
  "/:id",
  protect,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "audio", maxCount: 1 }
  ]),
  submitNoteOrUpdate
);

// Delete grievance
router.delete("/:id", protect, deleteGrievance);

export default router;
