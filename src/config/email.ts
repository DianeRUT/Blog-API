import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
  process.exit(1);
}

// Create and initialize the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify the transporter configuration
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is working!');
  } catch (error) {
    console.error('Email configuration error:', error);
    throw error;
  }
};

// Verify the transporter when the application starts
verifyTransporter().catch((error) => {
  console.error('Failed to verify email transporter:', error);
  process.exit(1); // Exit if email configuration fails
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (!process.env.EMAIL_USER) {
      throw new Error('Email configuration missing');
    }

    const info = await transporter.sendMail({
      from: {
        name: 'Blog API',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      html
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: info.accepted,
      rejected: info.rejected
    });

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const generateVerificationEmail = (token: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Verify Your Email</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="http://localhost:3000/api/auth/verify-email/${token}" 
         style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>If you did not request this verification, please ignore this email.</p>
      <p>This link will expire in 10 minutes.</p>
    </div>
  `;
};

export const generatePasswordResetEmail = (token: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Reset Your Password</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="http://localhost:3000/api/auth/reset-password?token=${token}" 
         style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>This link will expire in 10 minutes.</p>
    </div>
  `;
}; 