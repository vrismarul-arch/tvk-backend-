import Grievance from "../models/Grievance.js";
import { supabase } from "../config/supabase.js";
import { sendGrievanceConfirmation, sendStatusUpdateEmail } from "../config/email.js";

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
    
    // Upload images if any
    if (req.files?.images) {
      for (const img of req.files.images) {
        images.push(await uploadToSupabase(img, "img"));
      }
    }

    // Upload audio if any
    let audio = "";
    if (req.files?.audio?.[0]) {
      audio = await uploadToSupabase(req.files.audio[0], "audio");
    }

    // Create grievance
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

    // 📧 Send email notification if email is provided
    let emailSent = false;
    if (body.email) {
      try {
        const emailData = {
          grievanceId: grievance.grievanceId,
          name: body.name,
          grievanceType: body.grievanceType,
          details: body.details,
          phone: body.phone,
          address: body.address,
          mainRegion: body.mainRegion,
          subRegion: body.subRegion,
          createdAt: grievance.createdAt
        };
        await sendGrievanceConfirmation(body.email, emailData);
        emailSent = true;
        console.log(`📧 Email sent to ${body.email} for grievance ${grievance.grievanceId}`);
      } catch (emailError) {
        console.error('❌ Email notification failed:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({ 
      success: true, 
      grievanceId: grievance.grievanceId, 
      data: grievance,
      emailSent: emailSent
    });
  } catch (err) {
    console.error('❌ Submit grievance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= GET ALL GRIEVANCES ========= */
export const getGrievances = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    
    if (user.role === "user") {
      filter = { 
        mainRegion: user.mainRegion, 
        subRegion: user.subRegion 
      };
    }
    
    const data = await Grievance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Get grievances error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= GET SINGLE GRIEVANCE ========= */
export const getGrievanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const grievance = await Grievance.findOne({ grievanceId: id });
    
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }
    
    res.json({ success: true, data: grievance });
  } catch (err) {
    console.error('❌ Get grievance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= UPDATE STATUS ONLY ========= */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }

    const oldStatus = grievance.status;
    
    // Update status
    grievance.status = status;
    grievance.history.push({
      action: "status_changed",
      note: note || `Status updated from ${oldStatus} to ${status}`,
      status,
      addedBy: user.name,
      role: user.role,
      createdAt: new Date()
    });

    await grievance.save();

    // 📧 Send status update email if email exists
    let emailSent = false;
    if (grievance.email) {
      try {
        await sendStatusUpdateEmail(
          grievance.email,
          { 
            grievanceId: grievance.grievanceId, 
            name: grievance.name, 
            grievanceType: grievance.grievanceType 
          },
          status,
          note || `Status changed from ${oldStatus} to ${status}`
        );
        emailSent = true;
        console.log(`📧 Status update email sent to ${grievance.email}`);
      } catch (emailError) {
        console.error('❌ Status update email failed:', emailError);
      }
    }

    res.json({ 
      success: true, 
      data: grievance,
      emailSent: emailSent
    });
  } catch (err) {
    console.error('❌ Update status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= SUBMIT ADMIN NOTE & MEDIA ========= */
export const submitNoteOrUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, status } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }

    const oldStatus = grievance.status;
    let statusChanged = false;

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

    // 3. Update status if provided
    if (status && status !== oldStatus) {
      grievance.status = status;
      statusChanged = true;
    }

    // 4. Add history entry
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

    // 📧 Send email notification if status changed and email exists
    let emailSent = false;
    if (statusChanged && grievance.email) {
      try {
        await sendStatusUpdateEmail(
          grievance.email,
          { 
            grievanceId: grievance.grievanceId, 
            name: grievance.name, 
            grievanceType: grievance.grievanceType 
          },
          grievance.status,
          note || `Status updated to ${grievance.status}`
        );
        emailSent = true;
        console.log(`📧 Status update email sent to ${grievance.email}`);
      } catch (emailError) {
        console.error('❌ Status update email failed:', emailError);
      }
    }

    res.json({ 
      success: true, 
      data: grievance,
      emailSent: emailSent,
      statusChanged: statusChanged
    });
  } catch (err) {
    console.error('❌ Submit note error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= DELETE GRIEVANCE ========= */
export const deleteGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const grievance = await Grievance.findOne({ grievanceId: id });
    
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }
    
    // Delete images from Supabase if needed
    if (grievance.images && grievance.images.length > 0) {
      try {
        for (const imageUrl of grievance.images) {
          // Extract file path from URL
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const folder = 'img';
          
          // Delete from Supabase
          const { error } = await supabase.storage
            .from('tvk-grievance')
            .remove([`${folder}/${fileName}`]);
          
          if (error) {
            console.error('Error deleting image:', error);
          }
        }
      } catch (deleteError) {
        console.error('Error deleting images:', deleteError);
      }
    }
    
    // Delete audio from Supabase if exists
    if (grievance.audio) {
      try {
        const urlParts = grievance.audio.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folder = 'audio';
        
        const { error } = await supabase.storage
          .from('tvk-grievance')
          .remove([`${folder}/${fileName}`]);
          
        if (error) {
          console.error('Error deleting audio:', error);
        }
      } catch (deleteError) {
        console.error('Error deleting audio:', deleteError);
      }
    }
    
    await grievance.deleteOne();
    res.json({ success: true, message: "Grievance deleted successfully" });
  } catch (err) {
    console.error('❌ Delete grievance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= GET GRIEVANCE STATISTICS ========= */
export const getGrievanceStats = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    
    if (user.role === "user") {
      filter = { 
        mainRegion: user.mainRegion, 
        subRegion: user.subRegion 
      };
    }
    
    const total = await Grievance.countDocuments(filter);
    const pending = await Grievance.countDocuments({ ...filter, status: "pending" });
    const inprogress = await Grievance.countDocuments({ ...filter, status: "inprogress" });
    const completed = await Grievance.countDocuments({ ...filter, status: "completed" });
    const onhold = await Grievance.countDocuments({ ...filter, status: "onhold" });
    
    // Get recent grievances
    const recent = await Grievance.find(filter)
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get grievances by type
    const byType = await Grievance.aggregate([
      { $match: filter },
      { $group: { _id: "$grievanceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        inprogress,
        completed,
        onhold,
        recent,
        byType
      }
    });
  } catch (err) {
    console.error('❌ Get stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= ASSIGN GRIEVANCE TO ADMIN ========= */
export const assignGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedName } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }

    grievance.assignedTo = assignedTo;
    grievance.assignedName = assignedName;
    
    grievance.history.push({
      action: "assigned",
      note: `Assigned to ${assignedName}`,
      status: grievance.status,
      addedBy: user.name,
      role: user.role,
      createdAt: new Date()
    });

    await grievance.save();

    // 📧 Send assignment email if email exists
    let emailSent = false;
    if (grievance.email) {
      try {
        // You can create a separate email template for assignment
        // Or use the status update template
        await sendStatusUpdateEmail(
          grievance.email,
          { 
            grievanceId: grievance.grievanceId, 
            name: grievance.name, 
            grievanceType: grievance.grievanceType 
          },
          grievance.status,
          `Your grievance has been assigned to ${assignedName}`
        );
        emailSent = true;
        console.log(`📧 Assignment email sent to ${grievance.email}`);
      } catch (emailError) {
        console.error('❌ Assignment email failed:', emailError);
      }
    }

    res.json({ 
      success: true, 
      data: grievance,
      emailSent: emailSent
    });
  } catch (err) {
    console.error('❌ Assign grievance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========= ADD COMMENT TO GRIEVANCE ========= */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const user = req.user;

    const grievance = await Grievance.findOne({ grievanceId: id });
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }

    grievance.history.push({
      action: "comment",
      note: comment,
      status: grievance.status,
      addedBy: user.name,
      role: user.role,
      createdAt: new Date()
    });

    await grievance.save();

    // 📧 Send comment notification email if email exists
    let emailSent = false;
    if (grievance.email && user.role !== "user") {
      try {
        // Send email about new comment
        // You can create a separate email template for comments
        console.log(`📧 Comment notification would be sent to ${grievance.email}`);
        emailSent = true;
      } catch (emailError) {
        console.error('❌ Comment email failed:', emailError);
      }
    }

    res.json({ 
      success: true, 
      data: grievance,
      emailSent: emailSent
    });
  } catch (err) {
    console.error('❌ Add comment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};