import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const phoneOtpRequestSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
});

export const phoneOtpVerifySchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  name: z.string().optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().optional(),
  email: z.string().email('Valid email required'),
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().optional(),
  firebaseUid: z.string().optional(),
});

export const addressSchema = z.object({
  name: z.string().min(2, 'Full name required'),
  phone: z.string().min(10, 'Phone number required'),
  street: z.string().min(5, 'Street address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  postalCode: z.string().min(4, 'Postal/PIN code required'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});
