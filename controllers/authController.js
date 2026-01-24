import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req,res)=>{
  const { email,password } = req.body;

  const user = await User.findOne({email}).select("+password");
  if(!user) return res.status(404).json({msg:"User not found"});

  const ok = await bcrypt.compare(password,user.password);
  if(!ok) return res.status(400).json({msg:"Wrong password"});

  const token = jwt.sign({
    id:user._id,
    role:user.role,
    mainRegion:user.mainRegion,
    subRegion:user.subRegion
  }, process.env.JWT_SECRET, { expiresIn:"1d" });

  res.json({ token, user });
};
