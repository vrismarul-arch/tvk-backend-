// models/Grievance.js
import mongoose from "mongoose";

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

  // 🔥 Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  assignedName: String,

  history: [historySchema]
},{ timestamps:true });

export default mongoose.model("Grievance", grievanceSchema);
