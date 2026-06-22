import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('📧 Email Configuration Check:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '587');

// Create transporter with explicit configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email transporter error:', error.message);
    console.log('Please check:');
    console.log('1. EMAIL_USER is set correctly');
    console.log('2. EMAIL_PASS is the app password (16 characters without spaces)');
    console.log('3. 2-Step Verification is enabled in Google Account');
    console.log('4. App password was generated for "Mail" app');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Email template for grievance confirmation
export const sendGrievanceConfirmation = async (email, grievanceData) => {
  if (!email) {
    console.log('⚠️ No email provided, skipping notification');
    return null;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials missing!');
    return null;
  }

  const { grievanceId, name, grievanceType, details, phone, address, mainRegion, subRegion, createdAt } = grievanceData;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `TVK Namma Madhavaram <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Grievance Confirmation - ${grievanceId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  background:#f4f5f7;
  font-family:'Segoe UI',Arial,sans-serif;
  color:#333;
}

.container{
  max-width:650px;
  margin:40px auto;
  background:#fff;
  border-radius:20px;
  overflow:hidden;
  box-shadow:0 15px 50px rgba(0,0,0,0.1);
}

/* HEADER */
.header{
  background:linear-gradient(135deg,#84010a,#a5000d);
  padding:50px 30px;
  text-align:center;
  color:#fff;
}

.logo-circle{
  width:90px;
  height:90px;
  background:#ffe600;
  border-radius:50%;
  margin:auto;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:40px;
  color:#84010a;
  font-weight:bold;
}

.header h1{
  margin-top:20px;
  font-size:32px;
}

.header p{
  margin-top:8px;
  opacity:.9;
  font-size:16px;
}

/* CONTENT */
.content{
  padding:40px;
}

.greeting h2{
  color:#84010a;
  margin-bottom:10px;
}

.greeting p{
  color:#666;
  line-height:1.8;
}

.grievance-box{
  margin:30px 0;
  text-align:center;
}

.grievance-id{
  background:#ffe600;
  color:#84010a;
  display:inline-block;
  padding:18px 35px;
  border-radius:15px;
  font-size:28px;
  font-weight:700;
}

.section-title{
  font-size:22px;
  color:#84010a;
  margin-bottom:20px;
  font-weight:700;
}

.card{
  background:#fafafa;
  padding:18px;
  border-radius:12px;
  margin-bottom:15px;
}

.label{
  font-size:12px;
  text-transform:uppercase;
  color:#999;
  margin-bottom:5px;
  font-weight:600;
}

.value{
  font-size:16px;
  color:#333;
}

.status{
  display:inline-block;
  padding:10px 22px;
  background:#ffe600;
  color:#84010a;
  border-radius:50px;
  font-weight:700;
}

/* BUTTON */
.track-box{
  margin-top:35px;
  background:#fff8b0;
  border-radius:15px;
  padding:25px;
  text-align:center;
}

.track-box h3{
  color:#84010a;
}

.track-btn{
  display:inline-block;
  margin-top:20px;
  background:#84010a;
  color:#fff !important;
  padding:14px 35px;
  border-radius:50px;
  text-decoration:none;
  font-weight:bold;
}

/* CONTACT */
.contact{
  margin-top:30px;
  background:#84010a;
  color:#fff;
  padding:25px;
  border-radius:15px;
}

.contact h3{
  color:#ffe600;
  margin-bottom:15px;
}

.contact p{
  margin:8px 0;
}

/* FOOTER */
.footer{
  padding:25px;
  text-align:center;
  font-size:13px;
  color:#999;
  border-top:1px solid #eee;
}

.footer a{
  color:#84010a;
  text-decoration:none;
  font-weight:bold;
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo-circle">🏛</div>
    <h1>TVK Namma Madhavaram</h1>
    <p>Your Voice, Our Action</p>
  </div>
  
  <div class="content">
    <div class="greeting">
      <h2>Dear ${name},</h2>
      <p>Thank you for submitting your grievance. We have successfully received your complaint and our team will review it shortly.</p>
    </div>
    
    <div class="grievance-box">
      <div class="grievance-id">📋 ${grievanceId}</div>
    </div>
    
    <h3 class="section-title">Grievance Details</h3>
    
    <div class="card">
      <div class="label">Grievance Type</div>
      <div class="value">${grievanceType || 'Not specified'}</div>
    </div>
    
    <div class="card">
      <div class="label">Description</div>
      <div class="value">${details || 'No description provided'}</div>
    </div>
    
    <div class="card">
      <div class="label">Region</div>
      <div class="value">${mainRegion || 'Not specified'} ${subRegion ? ` - ${subRegion}` : ''}</div>
    </div>
    
    ${address ? `
    <div class="card">
      <div class="label">Address</div>
      <div class="value">${address}</div>
    </div>
    ` : ''}
    
    <div class="card">
      <div class="label">Phone</div>
      <div class="value">${phone}</div>
    </div>
    
    <div class="card">
      <div class="label">Status</div>
      <div class="value"><span class="status">Pending</span></div>
    </div>
    
    <div class="card">
      <div class="label">Submitted On</div>
      <div class="value">${new Date(createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div>
    </div>
    
    <div class="track-box">
      <h3>Track Your Grievance</h3>
      <p>Use your grievance ID: <strong>${grievanceId}</strong></p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${grievanceId}" class="track-btn">Track Status</a>
    </div>
    
    <div class="contact">
      <h3>Need Immediate Help?</h3>
      <p>📱 9600 83 2026</p>
      <p>📧 tvk@nammamadhavaram.in</p>
      <p>🌐 www.tvknammamadhavaram.in</p>
    </div>
  </div>
  
  <div class="footer">
    <p>This is an automated email. Please do not reply.</p>
    <p style="margin-top:10px;">© ${new Date().getFullYear()} TVK Namma Madhavaram</p>
  </div>
</div>
</body>
</html>
    `
  };

  try {
    console.log(`📧 Attempting to send email to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully! Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error details:', error);
    return null;
  }
};

// Email template for status update
export const sendStatusUpdateEmail = async (email, grievanceData, newStatus, note) => {
  if (!email) {
    console.log('⚠️ No email provided, skipping notification');
    return null;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials missing!');
    return null;
  }

  const { grievanceId, name, grievanceType } = grievanceData;

  const statusColors = {
    pending: '#FFA500',
    inprogress: '#007bff',
    completed: '#28a745',
    onhold: '#6c757d'
  };

  const statusEmojis = {
    pending: '⏳',
    inprogress: '🔄',
    completed: '✅',
    onhold: '⏸️'
  };

  const statusMessages = {
    pending: 'Your grievance is pending review. We will get back to you soon.',
    inprogress: 'We are actively working on your grievance and will update you soon.',
    completed: 'Your grievance has been resolved successfully. Thank you for your patience.',
    onhold: 'Your grievance is temporarily on hold. We will update you when we resume.'
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || `TVK Namma Madhavaram <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Status Update - ${grievanceId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;color:#333;}
.container{max-width:650px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 15px 50px rgba(0,0,0,0.1);}
.header{background:linear-gradient(135deg,#84010a,#a5000d);padding:40px 30px;text-align:center;color:#fff;}
.header h1{font-size:28px;}
.content{padding:40px;}
.greeting h2{color:#84010a;margin-bottom:10px;}
.greeting p{color:#666;line-height:1.8;}
.status-box{text-align:center;padding:25px;background:#f9f9f9;border-radius:15px;margin:25px 0;border:2px solid ${statusColors[newStatus] || '#FFD700'};}
.status-badge{display:inline-block;padding:10px 30px;background:${statusColors[newStatus] || '#FFD700'};color:#fff;border-radius:25px;font-weight:bold;font-size:20px;}
.status-icon{font-size:40px;display:block;margin-bottom:10px;}
.grievance-id{font-size:20px;font-weight:bold;color:#333;margin:10px 0;}
.note-box{background:#f0f8ff;padding:15px;border-radius:8px;border-left:4px solid #007bff;margin:20px 0;}
.status-message{margin:20px 0;padding:15px;background:#f8f9fa;border-radius:8px;color:#666;}
.button{display:inline-block;padding:12px 30px;background:#84010a;color:#fff !important;text-decoration:none;border-radius:50px;font-weight:bold;margin:20px 0;}
.footer{margin-top:30px;padding-top:20px;border-top:2px solid #f0f0f0;text-align:center;font-size:13px;color:#999;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🏛️ TVK Namma Madhavaram</h1>
  </div>
  
  <div class="content">
    <div class="greeting">
      <h2>Dear ${name},</h2>
      <p>We have an update regarding your grievance.</p>
    </div>
    
    <div class="status-box">
      <span class="status-icon">${statusEmojis[newStatus] || '📋'}</span>
      <div class="grievance-id">📋 ${grievanceId}</div>
      <div class="status-badge">${newStatus.toUpperCase()}</div>
      <div class="status-message">${statusMessages[newStatus] || 'Status updated'}</div>
    </div>
    
    ${note ? `
    <div class="note-box">
      <strong>📝 Admin Note:</strong>
      <p style="margin-top: 8px;">${note}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${grievanceId}" class="button">🔍 Track Details</a>
    </div>
    
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p style="margin-top:10px;">© ${new Date().getFullYear()} TVK Namma Madhavaram. All rights reserved.</p>
    </div>
  </div>
</div>
</body>
</html>
    `
  };

  try {
    console.log(`📧 Attempting to send status update email to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Status update email sent successfully! Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Status update email failed:', error.message);
    return null;
  }
};

// Also export as default for compatibility
export default {
  sendGrievanceConfirmation,
  sendStatusUpdateEmail
};