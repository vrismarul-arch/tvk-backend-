import Grievance from "../models/Grievance.js";
import { supabase } from "../config/supabase.js";

/* ================= SUPABASE UPLOAD ================= */
const uploadToSupabase = async (file, folder) => {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  const { error } = await supabase.storage
    .from("tvk-grievance")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("tvk-grievance")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

/* ================= CREATE GRIEVANCE ================= */
export const submitGrievance = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      mainRegion,
      subRegion,
      grievanceType,
      details,
      location,
    } = req.body;

    /* Upload images */
    const imageUrls = [];
    if (req.files?.images) {
      for (const img of req.files.images) {
        imageUrls.push(await uploadToSupabase(img, "img"));
      }
    }

    /* Upload audio */
    let audioUrl = "";
    if (req.files?.audio?.[0]) {
      audioUrl = await uploadToSupabase(req.files.audio[0], "audio");
    }

    const grievance = await Grievance.create({
      name,
      phone,
      address,
      mainRegion,
      subRegion,
      grievanceType,
      details,
      location,
      images: imageUrls,
      audio: audioUrl,
      status: "pending",

      history: [
        {
          action: "submitted",
          note: "Grievance created",
          images: imageUrls,
          audio: audioUrl,
          status: "pending",
          addedBy: name || "Citizen",
          role: "user",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Grievance submitted",
      grievanceId: grievance.grievanceId, // 🔥 IMPORTANT
      data: grievance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET ALL GRIEVANCES ================= */
export const getGrievances = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    if (user?.role === "user") {
      filter = {
        mainRegion: user.mainRegion,
        subRegion: user.subRegion,
      };
    }

    const grievances = await Grievance.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: grievances.length,
      data: grievances,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET SINGLE BY grievanceId ================= */
export const getGrievanceById = async (req, res) => {
  try {
    const { id } = req.params; // C-122

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance)
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });

    res.json({ success: true, data: grievance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE STATUS (BY grievanceId) ================= */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params; // C-122
    const { status, note } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance)
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });

    grievance.status = status;

    grievance.history.push({
      action: "status_changed",
      note: note || `Status updated to ${status}`,
      status,
      images: [],
      audio: "",
      addedBy: user.name,
      role: user.role,
    });

    await grievance.save();

    res.json({
      success: true,
      message: "Status updated",
      data: grievance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= ADD NOTE / UPDATE ================= */
export const submitNoteOrUpdate = async (req, res) => {
  try {
    const { id } = req.params; // C-122
    const { note, action, status } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance)
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });

    /* Upload images */
    const imageUrls = [];
    if (req.files?.images) {
      for (const img of req.files.images) {
        imageUrls.push(await uploadToSupabase(img, "img"));
      }
      grievance.images.push(...imageUrls);
    }

    /* Upload audio */
    let audioUrl = "";
    if (req.files?.audio?.[0]) {
      audioUrl = await uploadToSupabase(req.files.audio[0], "audio");
      grievance.audio = audioUrl;
    }

    if (status) grievance.status = status;

    grievance.history.push({
      action: action || "admin_note",
      note: note || "",
      images: imageUrls,
      audio: audioUrl,
      status: grievance.status,
      addedBy: user.name,
      role: user.role,
    });

    await grievance.save();

    res.json({
      success: true,
      message: "Grievance updated",
      data: grievance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE (BY grievanceId) ================= */
export const deleteGrievance = async (req, res) => {
  try {
    const { id } = req.params; // C-122
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance)
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });

    if (
      user.role === "user" &&
      (grievance.mainRegion !== user.mainRegion ||
        grievance.subRegion !== user.subRegion)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    await grievance.deleteOne();

    res.json({ success: true, message: "Grievance deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
