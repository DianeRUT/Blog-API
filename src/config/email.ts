import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a test transporter to verify configuration
const testTransporter = async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use Gmail service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    await transporter.verify();
    console.log('Email configuration is working!');
    return transporter;
  } catch (error) {
    console.error('Email configuration error:', error);
    throw error;
  }
};

// Initialize transporter
let transporter: nodemailer.Transporter;

// Initialize the transporter when the application starts
testTransporter()
  .then((t) => {
    transporter = t;
  })
  .catch((error) => {
    console.error('Failed to initialize email transporter:', error);
  });

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    const info = await transporter.sendMail({
      from: {
        name: 'Blog API',
        address: process.env.EMAIL_USER || ''
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