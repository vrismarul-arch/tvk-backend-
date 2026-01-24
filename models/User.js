import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type:String, required:true },
  email: { type:String, required:true, unique:true },
  password: { type:String, required:true, select:false },

  role: {
    type:String,
    enum:["superadmin","admin","user"],
    default:"user"
  },

 mainRegion: [{ type:String, required:true }],
  subRegion: [{ type:String, required:true }],
  isActive: { type:Boolean, default:true }
},{ timestamps:true });

export default mongoose.model("User", userSchema);
