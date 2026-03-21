const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send registration confirmation email
 */
const sendConfirmationEmail = async (studentEmail, studentName, examTitle, rollNumber, mode) => {
  const dashboardLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #1A2E1A; color: #F5F0E8; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Registration Confirmed!</h1>
      </div>
      <div style="padding: 30px; color: #333; line-height: 1.6;">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>We are pleased to inform you that your registration for <strong>${examTitle}</strong> has been successfully verified and <strong>CONFIRMED</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px dashed #7A9B7A;">
          <p style="margin: 0;"><strong>Exam:</strong> ${examTitle}</p>
          <p style="margin: 5px 0;"><strong>Roll Number:</strong> <span style="color: #C8A96E; font-weight: bold; font-size: 1.1em;">${rollNumber}</span></p>
          <p style="margin: 5px 0;"><strong>Mode:</strong> ${mode.toUpperCase()}</p>
        </div>

        ${mode === 'offline' 
          ? `<p>Since you are appearing for an <strong>OFFLINE</strong> exam, please log in to your dashboard to download your <strong>Admit Card</strong>.</p>`
          : `<p>For your <strong>ONLINE</strong> exam, you can access the link on your dashboard on the day of the exam.</p>`
        }

        <div style="text-align: center; margin-top: 30px;">
          <a href="${dashboardLink}" style="background-color: #C8A96E; color: #1A2E1A; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </div>
      </div>
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 0.8em; color: #666;">
        &copy; 2026 CET Management Portal. All rights reserved.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: studentEmail,
    subject: `Registration Confirmed: ${examTitle}`,
    html,
  });
};

/**
 * Send registration rejection email
 */
const sendRejectionEmail = async (studentEmail, studentName, examTitle, reason) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Registration Update</h1>
      </div>
      <div style="padding: 30px; color: #333; line-height: 1.6;">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your registration for <strong>${examTitle}</strong> has been reviewed. Unfortunately, we could not confirm your registration at this time.</p>
        
        <div style="background-color: #fff1f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca; color: #be123c;">
          <strong>Reason for Rejection:</strong><br/>
          ${reason || 'Payment verification failed or incomplete details provided.'}
        </div>

        <p>If you believe this is a mistake, please re-upload your payment proof or contact support.</p>
      </div>
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 0.8em; color: #666;">
        &copy; 2026 CET Management Portal. All rights reserved.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: studentEmail,
    subject: `Update on Registration: ${examTitle}`,
    html,
  });
};

module.exports = {
  sendConfirmationEmail,
  sendRejectionEmail
};
