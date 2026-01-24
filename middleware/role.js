export const canCreateUser = (req,res,next)=>{
  const r = req.user.role;
  if(r==="superadmin" || r==="admin" || r==="manager"){
    next();
  }else{
    res.status(403).json({msg:"No permission"});
  }
};
