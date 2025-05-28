import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: {
        name: 'Blog API',
        address: process.env.EMAIL_USER || ''
      },
      to,
      subject,
      html
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const generateVerificationEmail = (token: string) => {
  return `
    <h1>Verify Your Email</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="http://localhost:3000/api/verify-email/${token}">Verify Email</a>
    <p>If you did not request this verification, please ignore this email.</p>
  `;
};

export const generatePasswordResetEmail = (token: string) => {
  return `
    <h1>Reset Your Password</h1>
    <p>Please click the link below to reset your password:</p>
    <a href="http://localhost:3000/api/reset-password?token=${token}">Reset Password</a>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>This link will expire in <b>10 minutes</b>.</p>
  `;
}; 