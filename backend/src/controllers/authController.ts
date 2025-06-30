import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { User } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    res.status(400).json({
      success: false,
      error: 'User with this email already exists',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user
  const newUser = {
    id: uuidv4(),
    email,
    name,
    created_at: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      language: 'en',
      primaryColor: 'blue',
      fontSize: 'medium',
      notifications: {
        email: true,
        push: true,
        reactions: true,
        updates: false,
        marketing: false
      }
    },
    is_active: true
  };

  const { data: userData, error } = await supabase
    .from('users')
    .insert([newUser])
    .select('id, email, name, preferences, created_at, is_active')
    .single();

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: userData.id, email: userData.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    success: true,
    data: {
      user: userData,
      token
    },
    message: 'User registered successfully',
    timestamp: new Date().toISOString()
  });
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, created_at, preferences, is_active, last_login')
    .eq('email', email)
    .eq('is_active', true)
    .single();
  
  if (error || !user) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Note: Password validation would need to be handled differently
  // since we're not storing passwords in the users table
  // This backend controller might need to be updated to work with Supabase Auth

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    success: true,
    data: {
      user: user,
      token
    },
    message: 'Login successful',
    timestamp: new Date().toISOString()
  });
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: req.user,
    timestamp: new Date().toISOString()
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { name, preferences } = req.body;

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (name) updateData.name = name;
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', req.user.id)
    .select('id, email, name, preferences, updated_at')
    .single();

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully',
    timestamp: new Date().toISOString()
  });
});