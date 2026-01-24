import Grievance from "../models/Grievance.js";
import { supabase } from "../config/supabase.js";

// Upload helper
const uploadToSupabase = async (file, folder) => {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  const { error } = await supabase.storage
    .from("tvk-grievance")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("tvk-grievance")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// 1. CREATE
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
      location
    } = req.body;

    const imageUrls = [];
    if (req.files?.images) {
      for (let img of req.files.images) {
        imageUrls.push(await uploadToSupabase(img, "img"));
      }
    }

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
      audio: audioUrl
    });

    res.status(201).json({
      success: true,
      message: "Grievance submitted",
      data: grievance
    });

  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
};

// 2. READ (role based)
export const getGrievances = async (req,res)=>{
  try{
    const user = req.user;
    let filter = {};

    if(user.role === "user"){
      filter = {
        mainRegion: user.mainRegion,
        subRegion: user.subRegion
      };
    }

    const grievances = await Grievance
      .find(filter)
      .sort({ createdAt: -1 });

    res.json({
      count: grievances.length,
      data: grievances
    });

  }catch(err){
    res.status(500).json({error:err.message});
  }
};

// 3. UPDATE
export const updateStatus = async (req,res)=>{
  try{
    const { id } = req.params;
    const { status } = req.body;

    const grievance = await Grievance.findByIdAndUpdate(
      id,
      { status },
      { new:true }
    );

    if(!grievance)
      return res.status(404).json({msg:"Not found"});

    res.json({
      success:true,
      data: grievance
    });
  }catch(err){
    res.status(500).json({error:err.message});
  }
};

// 4. DELETE
export const deleteGrievance = async (req,res)=>{
  try{
    const { id } = req.params;
    const user = req.user;

    const grievance = await Grievance.findById(id);
    if(!grievance) 
      return res.status(404).json({msg:"Not found"});

    if(user.role === "user"){
      if(
        grievance.mainRegion !== user.mainRegion ||
        grievance.subRegion !== user.subRegion
      ){
        return res.status(403).json({msg:"Access denied"});
      }
    }

    await grievance.deleteOne();

    res.json({
      success:true,
      message:"Grievance deleted"
    });

  }catch(err){
    res.status(500).json({error:err.message});
  }
};
