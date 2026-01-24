import express from "express";
import { protect } from "../middleware/auth.js";
import { canCreateUser } from "../middleware/role.js";
import { createUser, getUsers, updateUser, deleteUser,getMyProfile } from "../controllers/userController.js";

const router = express.Router();

router.post("/create", protect, canCreateUser, createUser);
router.get("/all", protect, getUsers);
router.put("/:id", protect, canCreateUser, updateUser);
router.delete("/:id", protect, canCreateUser, deleteUser);
// routes/users.js
router.get("/me", protect, getMyProfile);

export default router;
