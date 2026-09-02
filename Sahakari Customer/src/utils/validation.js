/**
 * Validation utilities for Sahakari auth and booking forms
 */

// Validate Email Address
export const validateEmail = (email) => {
  const cleaned = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(cleaned)) {
    return { valid: true, value: cleaned };
  }
  return { valid: false, error: 'Please enter a valid email address (e.g. name@example.com)' };
};

// Validate Password (at least 8 characters, uppercase, lowercase, number, special character, e.g. @Admin123)
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter (A-Z)' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter (a-z)' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number (0-9)' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (e.g. @, #, $, !)' };
  }
  return { valid: true, value: password };
};

// Validate 10-digit Indian Mobile number
export const validateIndianPhone = (phone) => {
  const cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, value: cleaned };
  }
  return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number' };
};

// Validate OTP (4-6 digits)
export const validateOtp = (otp) => {
  const cleaned = (otp || '').trim();
  if (/^\d{4,6}$/.test(cleaned)) {
    return { valid: true, value: cleaned };
  }
  return { valid: false, error: 'Please enter a valid 6-digit OTP' };
};

// Validate negotiation counter offer
export const validateOffer = (offerAmount, originalAmount) => {
  const offer = Number(offerAmount);
  const original = Number(originalAmount);
  
  if (isNaN(offer) || offer <= 0) {
    return { valid: false, error: 'Please enter a valid amount' };
  }
  if (offer < original * 0.3) {
    return { valid: false, error: 'Offer is too low (minimum 30% of original quote)' };
  }
  if (offer > original * 1.5) {
    return { valid: false, error: 'Offer exceeds maximum allowed limit' };
  }
  return { valid: true };
};
