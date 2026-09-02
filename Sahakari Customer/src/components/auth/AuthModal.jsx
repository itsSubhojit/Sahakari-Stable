import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { SegmentedOtpModal } from '../common/SegmentedOtpModal';
import { PasswordConfirmModal } from '../common/PasswordConfirmModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { PasswordChecklist } from '../common/PasswordChecklist';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { validateEmail, validatePassword, validateOtp } from '../../utils/validation';

export const AuthModal = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    closeAuthModal,
    login,
    signup,
    logout,
    updateUser,
    verifyPassword,
    updateAuthEmail,
  } = useAuth();

  const fileInputRef = useRef(null);

  // Forgot Password Modal State
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState('');

  // Profile View & Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);

  // Password Confirmation Pop-up Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState('');
  const [passwordModalLoading, setPasswordModalLoading] = useState(false);

  // Segmented 6-Digit OTP Modal state (for Profile Email/Phone updates)
  const [isSegmentedOtpModalOpen, setIsSegmentedOtpModalOpen] = useState(false);
  const [segmentedOtpType, setSegmentedOtpType] = useState('EMAIL'); // 'EMAIL' | 'PHONE'
  const [segmentedOtpError, setSegmentedOtpError] = useState('');
  const [segmentedOtpLoading, setSegmentedOtpLoading] = useState(false);
  const [pendingChangeData, setPendingChangeData] = useState(null);

  // Segmented 6-Digit OTP Modal state (for Signup)
  const [isSignupOtpModalOpen, setIsSignupOtpModalOpen] = useState(false);
  const [signupOtpError, setSignupOtpError] = useState('');
  const [signupOtpLoading, setSignupOtpLoading] = useState(false);

  const [profileEditForm, setProfileEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    houseNo: '',
    currentLocation: '',
    landmark: '',
    city: '',
    pincode: '',
    avatar: '',
  });

  // Sync profile edit form with active user
  useEffect(() => {
    if (user) {
      // Clean phone number to 10 digits
      const cleanedPhone = (user.phone || '').replace(/[^0-9]/g, '');
      const tenDigitPhone = cleanedPhone.length === 12 && cleanedPhone.startsWith('91') 
        ? cleanedPhone.slice(2) 
        : cleanedPhone.slice(-10);

      setProfileEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: tenDigitPhone || '9876543210',
        houseNo: user.houseNo || '',
        currentLocation: user.currentLocation || user.address || '',
        landmark: user.landmark || '',
        city: user.city || '',
        pincode: user.pincode || '',
        avatar: user.avatar || user.photoUrl || '',
      });
      setProfileErrorMsg('');
      setIsPasswordModalOpen(false);
      setIsSegmentedOtpModalOpen(false);
    }
  }, [user, isEditingProfile]);

  // Sign In form state (Email & Password)
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up form state (Name, Email, Phone, Password & Email OTP)
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Validate 10-Digit Mobile Phone with fixed +91
  const validatePhone10Digits = (phoneStr) => {
    const digitsOnly = String(phoneStr || '').replace(/[^0-9]/g, '');
    const tenDigits = digitsOnly.length === 12 && digitsOnly.startsWith('91') 
      ? digitsOnly.slice(2) 
      : digitsOnly;

    if (tenDigits.length !== 10) {
      return { valid: false, error: 'Mobile phone must be exactly 10 digits' };
    }
    return { valid: true, formatted: `+91 ${tenDigits}`, raw: tenDigits };
  };

  // Handle Avatar Image File Upload
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result;
        setProfileEditForm((prev) => ({ ...prev, avatar: base64Url }));
      };
      reader.readAsDataURL(file);

      updateUser({ file }).then(() => {
        setProfileSuccessMsg('Profile photo uploaded & saved!');
        setTimeout(() => setProfileSuccessMsg(''), 2500);
      }).catch((err) => {
        console.warn('Image upload notice:', err.message);
      });
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
  ];

  const handleSelectSampleAvatar = (url) => {
    setProfileEditForm((prev) => ({ ...prev, avatar: url }));
    updateUser({ avatar: url });
    setProfileSuccessMsg('Avatar updated!');
    setTimeout(() => setProfileSuccessMsg(''), 2000);
  };

  // Profile Save Click -> Opens Password Confirmation Modal
  const handleSaveProfileClick = (e) => {
    e?.preventDefault();
    setProfileErrorMsg('');

    if (!profileEditForm.name.trim()) {
      setProfileErrorMsg('Full Name cannot be empty');
      return;
    }

    const emailVal = validateEmail(profileEditForm.email);
    if (!emailVal.valid) {
      setProfileErrorMsg(emailVal.error);
      return;
    }

    const phoneVal = validatePhone10Digits(profileEditForm.phone);
    if (!phoneVal.valid) {
      setProfileErrorMsg(phoneVal.error);
      return;
    }

    setPasswordModalError('');
    setIsPasswordModalOpen(true);
  };

  // Password Confirmation Handler
  const handleConfirmPassword = async (password) => {
    setPasswordModalLoading(true);
    setPasswordModalError('');

    try {
      const passwordCheck = await verifyPassword(password);
      if (!passwordCheck.success) {
        setPasswordModalError(passwordCheck.error || 'Incorrect account password.');
        setPasswordModalLoading(false);
        return;
      }

      const currentEmail = (user?.email || '').trim().toLowerCase();
      const newEmail = profileEditForm.email.trim().toLowerCase();
      const isEmailChanged = currentEmail && newEmail && currentEmail !== newEmail;

      const currentPhoneDigits = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const newPhoneDigits = (profileEditForm.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const isPhoneChanged = currentPhoneDigits && newPhoneDigits && currentPhoneDigits !== newPhoneDigits;

      if (isEmailChanged) {
        await api.sendEmailOtp(newEmail, profileEditForm.name.trim(), 'Email Address Update');
        setPendingChangeData({
          ...profileEditForm,
          phone: `+91 ${newPhoneDigits}`,
          verifiedPassword: password,
          changeType: 'EMAIL',
          targetEmail: newEmail,
        });
        setSegmentedOtpType('EMAIL');
        setSegmentedOtpError('');
        setIsPasswordModalOpen(false);
        setIsSegmentedOtpModalOpen(true);
        setPasswordModalLoading(false);
        return;
      }

      if (isPhoneChanged) {
        const targetEmail = currentEmail || newEmail;
        await api.sendEmailOtp(targetEmail, profileEditForm.name.trim(), 'Mobile Phone Update');
        setPendingChangeData({
          ...profileEditForm,
          phone: `+91 ${newPhoneDigits}`,
          verifiedPassword: password,
          changeType: 'PHONE',
          targetEmail: targetEmail,
        });
        setSegmentedOtpType('PHONE');
        setSegmentedOtpError('');
        setIsPasswordModalOpen(false);
        setIsSegmentedOtpModalOpen(true);
        setPasswordModalLoading(false);
        return;
      }

      await updateUser({
        name: profileEditForm.name.trim(),
        email: newEmail,
        phone: `+91 ${newPhoneDigits}`,
        houseNo: profileEditForm.houseNo.trim(),
        currentLocation: profileEditForm.currentLocation.trim(),
        address: profileEditForm.currentLocation.trim(),
        landmark: profileEditForm.landmark.trim(),
        city: profileEditForm.city.trim(),
        pincode: profileEditForm.pincode.trim(),
        avatar: profileEditForm.avatar,
        photoUrl: profileEditForm.avatar,
      });

      setIsPasswordModalOpen(false);
      setIsEditingProfile(false);
      setProfileSuccessMsg('Profile changes saved successfully to database!');
      setTimeout(() => setProfileSuccessMsg(''), 3500);
    } catch (err) {
      setPasswordModalError(err.message || 'Failed to save profile changes.');
    } finally {
      setPasswordModalLoading(false);
    }
  };

  // Verify Segmented OTP for Profile Changes
  const handleVerifySegmentedOtp = async (otpCode) => {
    setSegmentedOtpLoading(true);
    setSegmentedOtpError('');

    try {
      const targetEmail = pendingChangeData.targetEmail;
      await api.verifyEmailOtp(targetEmail, otpCode);

      if (pendingChangeData.changeType === 'EMAIL') {
        await updateAuthEmail(targetEmail, pendingChangeData.verifiedPassword);
      }

      await updateUser({
        name: pendingChangeData.name.trim(),
        email: pendingChangeData.email.trim().toLowerCase(),
        phone: pendingChangeData.phone,
        houseNo: pendingChangeData.houseNo.trim(),
        currentLocation: pendingChangeData.currentLocation.trim(),
        address: pendingChangeData.currentLocation.trim(),
        landmark: pendingChangeData.landmark.trim(),
        city: pendingChangeData.city.trim(),
        pincode: pendingChangeData.pincode.trim(),
        avatar: pendingChangeData.avatar,
        photoUrl: pendingChangeData.avatar,
      });

      setIsSegmentedOtpModalOpen(false);
      setIsEditingProfile(false);
      setPendingChangeData(null);

      const msg = pendingChangeData.changeType === 'EMAIL' 
        ? 'Email address verified & updated successfully!' 
        : 'Mobile phone number verified & updated successfully!';
      setProfileSuccessMsg(msg);
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      setSegmentedOtpError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setSegmentedOtpLoading(false);
    }
  };

  const handleResendSegmentedOtp = async () => {
    if (!pendingChangeData?.targetEmail) return;
    try {
      const purpose = pendingChangeData.changeType === 'EMAIL' ? 'Email Address Update' : 'Mobile Phone Update';
      await api.sendEmailOtp(pendingChangeData.targetEmail, pendingChangeData.name.trim(), purpose);
    } catch (err) {
      setSegmentedOtpError(err.message || 'Failed to resend OTP.');
    }
  };

  // Sign In with Email & Password
  const handleSignInSubmit = async (e) => {
    e?.preventDefault();
    const emailVal = validateEmail(signInEmail);
    if (!emailVal.valid) {
      setSignInError(emailVal.error);
      return;
    }
    const passVal = validatePassword(signInPassword);
    if (!passVal.valid) {
      setSignInError(passVal.error);
      return;
    }

    setSignInError('');
    setSignInLoading(true);

    // 1. Check if user exists before attempting sign in
    const check = await api.checkUserExists(signInEmail.trim());
    if (!check.exists) {
      setSignInError('No account found with this email address. Please Sign Up first.');
      setSignInLoading(false);
      return;
    }

    const result = await login(signInEmail, signInPassword);
    setSignInLoading(false);
    if (!result?.success && result?.error) {
      setSignInError(result.error);
    }
  };

  // Sign Up: Step 1 - Send 6-Digit OTP to Email & Open Segmented OTP Modal
  const handleSendSignupEmailOtp = async (e) => {
    e?.preventDefault();
    if (!signupForm.name.trim()) {
      setSignupError('Please enter your full name');
      return;
    }
    const emailVal = validateEmail(signupForm.email);
    if (!emailVal.valid) {
      setSignupError(emailVal.error);
      return;
    }
    const passVal = validatePassword(signupForm.password);
    if (!passVal.valid) {
      setSignupError(passVal.error);
      return;
    }

    const phoneVal = validatePhone10Digits(signupForm.phone);
    if (!phoneVal.valid) {
      setSignupError(phoneVal.error);
      return;
    }

    setSignupError('');
    setSignupLoading(true);

    try {
      // 1. Check if user account already exists before sending signup OTP
      const check = await api.checkUserExists(signupForm.email.trim());
      if (check.exists) {
        setSignupError('An account with this email address already exists. Please Sign In instead.');
        setSignupLoading(false);
        return;
      }

      await api.sendEmailOtp(signupForm.email.trim(), signupForm.name.trim(), 'Account Signup');
      setSignupOtpError('');
      setIsSignupOtpModalOpen(true);
    } catch (err) {
      setSignupError(err.message || 'Failed to send OTP to email.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Sign Up: Step 2 - Verify 6-Digit Segmented OTP & Complete Account Creation
  const handleVerifySignupOtp = async (otpCode) => {
    setSignupOtpLoading(true);
    setSignupOtpError('');

    try {
      // 1. Verify OTP with Backend
      await api.verifyEmailOtp(signupForm.email.trim(), otpCode);

      // 2. Complete Firebase + Database signup (triggers Welcome Email internally)
      const phoneFormatted = `+91 ${signupForm.phone.replace(/[^0-9]/g, '').slice(-10)}`;
      const result = await signup({
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        phone: phoneFormatted,
        password: signupForm.password,
        otp: otpCode,
      });

      if (!result?.success) {
        setSignupOtpError(result?.error || 'Failed to create account');
      } else {
        setIsSignupOtpModalOpen(false);
        setSignupForm({ name: '', email: '', phone: '', password: '' });
        closeAuthModal();
        navigate('/services'); // Redirect customer to services dashboard!
      }
    } catch (err) {
      setSignupOtpError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    try {
      await api.sendEmailOtp(signupForm.email.trim(), signupForm.name.trim(), 'Account Signup');
    } catch (err) {
      setSignupOtpError(err.message || 'Failed to resend OTP.');
    }
  };

  const activeTab = isAuthenticated && authModalTab === 'profile' ? 'profile' : authModalTab;

  return (
    <>
      <Modal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        title={
          isAuthenticated && activeTab === 'profile'
            ? isEditingProfile
              ? 'Edit Full Profile'
              : 'My Account & Full Profile'
            : 'Sahakari Account'
        }
        maxWidth={isAuthenticated && activeTab === 'profile' ? 'max-w-2xl' : 'max-w-md'}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* VIEW 1: FULL USER PROFILE */}
        {isAuthenticated && activeTab === 'profile' ? (
          <div className="space-y-4">
            {profileSuccessMsg && (
              <div className="bg-indigo-50 border border-indigo-300 text-indigo-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">
                  check_circle
                </span>
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <div className="bg-gradient-to-r from-primary/10 via-surface to-indigo-500/10 border border-outline-variant/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs">
              <div className="relative group flex-shrink-0">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                  }
                  alt={user?.name || 'User Avatar'}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-primary shadow-sm ring-2 ring-primary/20"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload your photo"
                  className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span className="text-[8px] font-bold">Photo</span>
                </button>

                <span className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 rounded-full border-2 border-surface flex items-center justify-center text-white text-[10px] shadow-xs">
                  ✓
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-base sm:text-lg font-bold text-on-surface truncate">
                        {user?.name || 'Aaditya Dey'}
                      </h3>
                      <span className="material-symbols-outlined text-primary text-[18px]" title="Verified Customer">
                        verified
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium truncate">
                      {user?.email || 'customer@sahakari.in'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingProfile((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 flex-shrink-0 ${
                      isEditingProfile
                        ? 'bg-surface-container-high text-on-surface border border-outline-variant'
                        : 'bg-primary text-on-primary hover:bg-primary/90'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isEditingProfile ? 'visibility' : 'edit'}
                    </span>
                    {isEditingProfile ? 'View' : 'Edit Profile'}
                  </button>
                </div>
              </div>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfileClick} className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Aaditya Dey"
                    value={profileEditForm.name}
                    onChange={(e) => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                    icon="person"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. yourname@example.com"
                    value={profileEditForm.email}
                    onChange={(e) => setProfileEditForm({ ...profileEditForm, email: e.target.value })}
                    icon="mail"
                    required
                  />

                  <div>
                    <label className="text-label-sm font-semibold text-on-surface-variant block mb-1">
                      Mobile Phone Number <span className="text-error">*</span>
                    </label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface font-semibold text-xs flex-shrink-0">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit number"
                        value={profileEditForm.phone}
                        onChange={(e) => setProfileEditForm({ ...profileEditForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-outline-variant/60">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Service & Delivery Address
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Flat / House / Building"
                      placeholder="e.g. Flat 4B, Silver Oak Heights"
                      value={profileEditForm.houseNo}
                      onChange={(e) => setProfileEditForm({ ...profileEditForm, houseNo: e.target.value })}
                      icon="apartment"
                    />

                    <Input
                      label="Street / Area Location"
                      placeholder="e.g. 123 Safdarjung Enclave"
                      value={profileEditForm.currentLocation}
                      onChange={(e) => setProfileEditForm({ ...profileEditForm, currentLocation: e.target.value })}
                      icon="location_on"
                    />

                    <Input
                      label="Landmark"
                      placeholder="e.g. Near Safdarjung Club"
                      value={profileEditForm.landmark}
                      onChange={(e) => setProfileEditForm({ ...profileEditForm, landmark: e.target.value })}
                      icon="pin_drop"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="City"
                        placeholder="New Delhi"
                        value={profileEditForm.city}
                        onChange={(e) => setProfileEditForm({ ...profileEditForm, city: e.target.value })}
                      />
                      <Input
                        label="Pincode"
                        placeholder="110029"
                        value={profileEditForm.pincode}
                        onChange={(e) => setProfileEditForm({ ...profileEditForm, pincode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {profileErrorMsg && (
                  <p className="text-xs text-error font-semibold bg-red-50 p-2 rounded-xl border border-red-200">{profileErrorMsg}</p>
                )}

                <div className="pt-2 border-t border-outline-variant/60 flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon="save"
                    loading={profileSaveLoading}
                    className="flex-1 font-bold text-xs"
                  >
                    Save Full Profile
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface border border-outline-variant/70 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-1.5">
                      <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[16px]">badge</span>
                        Personal & Contact
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-on-surface-variant text-[10px] block">Full Name</span>
                        <span className="font-bold text-on-surface">{user?.name || 'Aaditya Dey'}</span>
                      </div>

                      <div>
                        <span className="text-on-surface-variant text-[10px] block">Verified Email</span>
                        <span className="font-medium text-on-surface truncate block">
                          {user?.email || 'customer@sahakari.in'}
                        </span>
                      </div>

                      <div className="pt-1">
                        <span className="text-on-surface-variant text-[10px] block">Mobile Phone</span>
                        <span className="font-mono font-bold text-primary text-[11px]">
                          {user?.phone || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface border border-outline-variant/70 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-1.5">
                      <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[16px]">home_pin</span>
                        Service Address
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-on-surface">
                        {[user?.houseNo, user?.currentLocation].filter(Boolean).join(', ') || 'Address not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setAuthModalTab('signin');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">logout</span>
                    Sign Out
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeAuthModal}
                    className="px-5 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SIGN IN / SIGN UP MODAL */
          <div className="space-y-4 py-1">
            {forgotPasswordNotice && (
              <div className="bg-indigo-50 border border-indigo-300 text-indigo-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">
                  check_circle
                </span>
                <span>{forgotPasswordNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-2 p-1 bg-surface-container-high rounded-xl border border-outline-variant/60">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('signin');
                  setSignInError('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('signup');
                  setSignupError('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Sign Up
              </button>
            </div>

            {/* TAB 1: SIGN IN */}
            {activeTab === 'signin' && (
              <div className="space-y-3.5">
                <form onSubmit={handleSignInSubmit} className="space-y-3">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. yourname@example.com"
                    value={signInEmail}
                    onChange={(e) => {
                      setSignInEmail(e.target.value);
                      setSignInError('');
                    }}
                    icon="mail"
                    required
                    autoFocus
                  />

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-label-sm font-semibold text-on-surface-variant">
                        Password
                      </label>

                      {/* DEDICATED FORGOT PASSWORD LINK */}
                      <button
                        type="button"
                        onClick={() => {
                          closeAuthModal();
                          setIsForgotPasswordModalOpen(true);
                        }}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={signInPassword}
                        onChange={(e) => {
                          setSignInPassword(e.target.value);
                          setSignInError('');
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showSignInPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {signInError && (
                    <p className="text-xs text-error font-semibold">{signInError}</p>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="primary"
                    size="md"
                    loading={signInLoading}
                    className="py-2.5 font-bold text-xs"
                  >
                    Sign In
                  </Button>
                </form>

                <div className="pt-2.5 border-t border-outline-variant/60">
                  <p className="text-[11px] text-center text-on-surface-variant">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthModalTab('signup')}
                      className="text-secondary font-bold hover:underline cursor-pointer"
                    >
                      Sign Up here
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: SIGN UP WITH SEGMENTED OTP MODAL */}
            {activeTab === 'signup' && (
              <div className="space-y-3.5">
                <form onSubmit={handleSendSignupEmailOtp} className="space-y-3">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Aaditya Dey"
                    value={signupForm.name}
                    onChange={(e) => {
                      setSignupForm({ ...signupForm, name: e.target.value });
                      setSignupError('');
                    }}
                    icon="person"
                    required
                    autoFocus
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. yourname@example.com"
                    value={signupForm.email}
                    onChange={(e) => {
                      setSignupForm({ ...signupForm, email: e.target.value });
                      setSignupError('');
                    }}
                    icon="mail"
                    required
                  />

                  <div>
                    <label className="text-label-sm font-semibold text-on-surface-variant block mb-1">
                      Mobile Phone Number <span className="text-error">*</span>
                    </label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface font-semibold text-xs flex-shrink-0">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit number"
                        value={signupForm.phone}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) });
                          setSignupError('');
                        }}
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-label-sm font-semibold text-on-surface-variant block mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="e.g. @Admin123"
                        value={signupForm.password}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, password: e.target.value });
                          setSignupError('');
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showSignupPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>

                    {/* Password Validation Checklist matching user design mockup */}
                    <PasswordChecklist password={signupForm.password} />
                  </div>

                  {signupError && (
                    <p className="text-xs text-error font-semibold">{signupError}</p>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="primary"
                    size="md"
                    loading={signupLoading}
                    icon="mark_email_read"
                    className="py-2.5 font-bold text-xs"
                  >
                    Get 5-Min OTP on Email
                  </Button>

                  <div className="pt-2 border-t border-outline-variant/60 text-center">
                    <p className="text-[11px] text-on-surface-variant">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthModalTab('signin')}
                        className="text-secondary font-bold hover:underline cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* DEDICATED FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onBackToLogin={() => {
          setIsForgotPasswordModalOpen(false);
          setAuthModalTab('signin');
        }}
        onResetSuccess={(msg) => {
          setIsForgotPasswordModalOpen(false);
          setForgotPasswordNotice(msg);
          setAuthModalTab('signin');
          setTimeout(() => setForgotPasswordNotice(''), 5000);
        }}
      />

      {/* POP-UP MODAL 1: PASSWORD CONFIRMATION FOR PROFILE EDIT */}
      <PasswordConfirmModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handleConfirmPassword}
        loading={passwordModalLoading}
        error={passwordModalError}
      />

      {/* POP-UP MODAL 2: 6-DIGIT SEGMENTED OTP FOR PROFILE EMAIL/PHONE CHANGE */}
      <SegmentedOtpModal
        isOpen={isSegmentedOtpModalOpen}
        onClose={() => setIsSegmentedOtpModalOpen(false)}
        title={segmentedOtpType === 'EMAIL' ? 'Verify New Email Address' : 'Verify Mobile Phone Number'}
        subtitle={segmentedOtpType === 'EMAIL' ? '6-Digit OTP sent to your new email' : '6-Digit OTP sent to registered email'}
        targetInfo={pendingChangeData?.targetEmail || ''}
        onVerify={handleVerifySegmentedOtp}
        onResend={handleResendSegmentedOtp}
        loading={segmentedOtpLoading}
        error={segmentedOtpError}
      />

      {/* POP-UP MODAL 3: 6-DIGIT SEGMENTED OTP FOR SIGNUP */}
      <SegmentedOtpModal
        isOpen={isSignupOtpModalOpen}
        onClose={() => setIsSignupOtpModalOpen(false)}
        title="Verify Email to Complete Sign Up"
        subtitle="Enter the 6-digit OTP code sent to your email to activate account"
        targetInfo={signupForm.email.trim()}
        onVerify={handleVerifySignupOtp}
        onResend={handleResendSignupOtp}
        loading={signupOtpLoading}
        error={signupOtpError}
      />
    </>
  );
};
