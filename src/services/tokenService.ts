import crypto from 'crypto';
import { AppDataSource } from '../config/database.js';
import { Token } from '../entities/Token.js';
import { MoreThan } from 'typeorm';

const TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const createToken = async (userId: number, type: 'verification' | 'reset') => {
  try {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

    console.log('Creating token with data:', {
      token,
      userId,
      type,
      expiresAt
    });

    const tokenRepository = AppDataSource.getRepository(Token);
    
    // Check if token table exists
    const tableExists = await tokenRepository.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'token')"
    );
    console.log('Token table exists:', tableExists[0].exists);

    // Create token record
    const tokenRecord = await tokenRepository.save({
      token,
      userId,
      type,
      expiresAt,
    });

    console.log('Token record created:', {
      id: tokenRecord.id,
      token: tokenRecord.token,
      type: tokenRecord.type,
      userId: tokenRecord.userId,
      expiresAt: tokenRecord.expiresAt,
      createdAt: tokenRecord.createdAt
    });

    // Verify token was saved
    const savedToken = await tokenRepository.findOne({
      where: { token }
    });
    console.log('Verified saved token:', savedToken);

    return token;
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
};

export const validateToken = async (token: string, type: 'verification' | 'reset') => {
  try {
    console.log('Validating token:', { token, type });
    
    const tokenRepository = AppDataSource.getRepository(Token);
    
    // Debug: List all tokens of this type
    const allTokens = await tokenRepository.find({ where: { type } });
    console.log('All reset tokens in DB:', allTokens.map(t => t.token));

    // Check if token exists
    const tokenRecord = await tokenRepository.findOne({
      where: {
        token,
        type,
        expiresAt: MoreThan(new Date()),
      },
    });

    console.log('Found token record:', tokenRecord);

    if (!tokenRecord) {
      // Check if token exists but is expired
      const expiredToken = await tokenRepository.findOne({
        where: {
          token,
          type
        }
      });
      
      if (expiredToken) {
        console.log('Token found but expired:', {
          token: expiredToken.token,
          expiresAt: expiredToken.expiresAt,
          currentTime: new Date()
        });
      } else {
        console.log('Token not found in database');
      }
      
      return null;
    }

    // Only delete the token if it's a reset token
    if (type === 'reset') {
      await tokenRepository.remove(tokenRecord);
      console.log('Reset token deleted after validation');
    }

    return tokenRecord.userId;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}; 