import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { config } from '../config/env.js';
import {
  signupSchema,
  loginSchema,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
  googleAuthSchema,
  addressSchema,
} from '../validators/authValidators.js';
import { logAudit } from '../utils/auditLogger.js';

const signToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as any);
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const parsed = signupSchema.parse(req.body);

  const existingUser = await User.findOne({ email: parsed.email.toLowerCase() });
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(parsed.password, salt);

  const user = await User.create({
    name: parsed.name,
    email: parsed.email.toLowerCase(),
    phone: parsed.phone,
    passwordHash,
    role: 'customer',
  });

  const token = signToken(user._id.toString(), user.role);

  await logAudit({
    req,
    user,
    action: 'USER_SIGNUP',
    resource: 'User',
    resourceId: user._id.toString(),
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.parse(req.body);

  const user = await User.findOne({ email: parsed.email.toLowerCase() });
  if (!user || !(await user.comparePassword(parsed.password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status === 'disabled') {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user._id.toString(), user.role);

  await logAudit({
    req,
    user,
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: user._id.toString(),
  });

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
    },
  });
});

export const requestPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = phoneOtpRequestSchema.parse(req.body);

  // In production, integrate Twilio/Fast2SMS/Firebase Phone Auth.
  // In demo mode, standard OTP is 123456 with clear labeling.
  res.status(200).json({
    success: true,
    message: 'OTP has been dispatched. (Demo OTP is 123456)',
    phone,
    isDemo: true,
  });
});

export const verifyPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp, name } = phoneOtpVerifySchema.parse(req.body);

  // Validate OTP (Demo OTP 123456 or Firebase phone token verification)
  if (otp !== '123456') {
    throw new AppError('Invalid verification code. Please enter the valid OTP (Demo: 123456).', 400);
  }

  let user = await User.findOne({ phone });
  if (!user) {
    const dummyEmail = `phone_${phone.replace(/\D/g, '')}@aura-store.local`;
    user = await User.create({
      name: name || `Customer ${phone.slice(-4)}`,
      email: dummyEmail,
      phone,
      role: 'customer',
    });
  }

  if (user.status === 'disabled') {
    throw new AppError('Your account is deactivated.', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user._id.toString(), user.role);

  res.status(200).json({
    success: true,
    message: 'Phone verified successfully.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
    },
  });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, avatar, firebaseUid } = googleAuthSchema.parse(req.body);

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      avatar: avatar || '',
      role: 'customer',
      firebaseUid,
    });
  } else {
    if (avatar && !user.avatar) user.avatar = avatar;
    if (firebaseUid && !user.firebaseUid) user.firebaseUid = firebaseUid;
  }

  if (user.status === 'disabled') {
    throw new AppError('Your account is deactivated.', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user._id.toString(), user.role);

  res.status(200).json({
    success: true,
    message: 'Google sign-in successful.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
    },
  });
});

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  if (!user) throw new AppError('User not found.', 404);

  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const { name, phone, avatar, notificationPreferences } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatar) user.avatar = avatar;
  if (notificationPreferences) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...notificationPreferences,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
      notificationPreferences: user.notificationPreferences,
    },
  });
});

export const addAddress = asyncHandler(async (req: any, res: Response) => {
  const parsed = addressSchema.parse(req.body);
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  if (parsed.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  } else if (user.addresses.length === 0) {
    parsed.isDefault = true;
  }

  user.addresses.push(parsed as any);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully.',
    addresses: user.addresses,
  });
});

export const updateAddress = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const parsed = addressSchema.parse(req.body);
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  const address = (user.addresses as any).find((addr: any) => addr._id?.toString() === id);
  if (!address) throw new AppError('Address not found.', 404);

  if (parsed.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  Object.assign(address, parsed);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address updated successfully.',
    addresses: user.addresses,
  });
});

export const deleteAddress = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  const addressIndex = user.addresses.findIndex((addr: any) => addr._id.toString() === id);
  if (addressIndex === -1) throw new AppError('Address not found.', 404);

  const wasDefault = user.addresses[addressIndex].isDefault;
  user.addresses.splice(addressIndex, 1);

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address removed successfully.',
    addresses: user.addresses,
  });
});
