import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  mainRegion: String,
  subRegion: String,
  grievanceType: String,
  details: String,
  location: String,
  images: [String],   // supabase urls
  audio: String   ,
  status: {
    type: String,
    enum: ["pending", "inprogress", "completed"],
    default: "pending"
  }
    // supabase url
}, { timestamps: true });

export default mongoose.model("Grievance", grievanceSchema);
