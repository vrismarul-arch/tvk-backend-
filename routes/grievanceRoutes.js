import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import {
  submitGrievance,
  getGrievances,
  updateStatus,
  deleteGrievance
} from "../controllers/grievanceController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/submit",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "audio", maxCount: 1 }
  ]),
  submitGrievance
);

router.get("/get", protect, getGrievances);
router.patch("/:id/status", protect, updateStatus);

router.delete("/:id", protect, deleteGrievance);

export default router;
