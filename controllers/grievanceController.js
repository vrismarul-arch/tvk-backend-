import Grievance from "../models/Grievance.js";
import { supabase } from "../config/supabase.js";

/* ========= SUPABASE UPLOAD HELPER ========= */
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

/* ========= CREATE GRIEVANCE ========= */
export const submitGrievance = async (req, res) => {
  try {
    const body = req.body;
    const images = [];
    if (req.files?.images) {
      for (const img of req.files.images) {
        images.push(await uploadToSupabase(img, "img"));
      }
    }

    let audio = "";
    if (req.files?.audio?.[0]) {
      audio = await uploadToSupabase(req.files.audio[0], "audio");
    }

    const grievance = await Grievance.create({
      ...body,
      images,
      audio,
      status: "pending",
      history: [{
        action: "submitted",
        note: "Grievance created",
        images,
        audio,
        status: "pending",
        addedBy: body.name || "Citizen",
        role: "user",
        createdAt: new Date()
      }]
    });

    res.status(201).json({ success: true, grievanceId: grievance.grievanceId, data: grievance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= GET ALL GRIEVANCES ========= */
export const getGrievances = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    if (user.role === "user") {
      filter = { mainRegion: user.mainRegion, subRegion: user.subRegion };
    }
    const data = await Grievance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= UPDATE STATUS ONLY ========= */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance) return res.status(404).json({ message: "Not found" });

    grievance.status = status;
    grievance.history.push({
      action: "status_changed",
      note: `Status updated to ${status}`,
      status,
      addedBy: user.name,
      role: user.role,
      createdAt: new Date()
    });

    await grievance.save();
    res.json({ success: true, data: grievance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= SUBMIT ADMIN NOTE & MEDIA (The Critical Fix) ========= */
/* ========= SUBMIT ADMIN NOTE & MEDIA ========= */
export const submitNoteOrUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, status } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance) return res.status(404).json({ message: "Not found" });

    // 1. Process New Images
    const newImages = [];
    if (req.files?.images) {
      for (const img of req.files.images) {
        const url = await uploadToSupabase(img, "img");
        newImages.push(url);
      }
      // Combine existing images with new ones
      grievance.images = [...(grievance.images || []), ...newImages];
    }

    // 2. Process New Audio
    let newAudio = "";
    if (req.files?.audio?.[0]) {
      newAudio = await uploadToSupabase(req.files.audio[0], "audio");
      grievance.audio = newAudio; // Main audio record updated to latest
    }

    if (status) grievance.status = status;

    // 3. Add specific media to THIS history entry
    grievance.history.push({
      action: "admin_note",
      note: note || `Update recorded`,
      images: newImages, // Saved only what was uploaded NOW
      audio: newAudio,   // Saved only what was uploaded NOW
      status: grievance.status,
      addedBy: user.name,
      role: user.role,
      createdAt: new Date()
    });

    await grievance.save();
    res.json({ success: true, data: grievance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= DELETE ========= */
export const deleteGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance) return res.status(404).json({ message: "Not found" });
    await grievance.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};