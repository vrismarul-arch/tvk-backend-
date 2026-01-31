import mongoose from "mongoose";
import Counter from "./Counter.js";

const historySchema = new mongoose.Schema({
  action: String,
  note: String,
  images: [String],
  audio: String,
  status: String,
  addedBy: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});

const grievanceSchema = new mongoose.Schema({
  grievanceId: {
    type: String,
    unique: true
  },

  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: String,

  mainRegion: String,
  subRegion: String,

  grievanceType: String,
  details: String,
  location: String,

  images: [String],
  audio: String,

  status: {
    type: String,
    enum: ["pending", "inprogress", "completed"],
    default: "pending"
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  assignedName: String,

  history: [historySchema]
}, { timestamps: true });

/* 🔥 AUTO-GENERATE C-XXX (NO next()) */
grievanceSchema.pre("save", async function () {
  if (this.grievanceId) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "grievance" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.grievanceId = `C-${counter.seq}`;
});

export default mongoose.model("Grievance", grievanceSchema);
