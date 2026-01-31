import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 121 } // 🔥 starts before C-122
});

export default mongoose.model("Counter", counterSchema);
