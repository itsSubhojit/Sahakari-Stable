import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([
    { workerId: 'WRK-8821', password: '1234', phone: '9876543210', email: 'suresh@sahakari.in', name: 'Suresh Patel', coopId: 'SAH-COOP-8821', role: 'Senior Master Plumber & HVAC Specialist' },
    { workerId: 'WRK-0001', password: '0000', phone: '9000000001', email: 'demo@sahakari.in', name: 'Demo Worker', coopId: 'SAH-COOP-0001', role: 'Electrician' },
  ]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');

  // Sign-up pending state
  const [pendingSignUp, setPendingSignUp] = useState(null); // { name, email, password, otp, workerId }
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpToastMsg, setOtpToastMsg] = useState(''); // simulates email

  // ── Sign In ──
  const signIn = (workerId, password) => {
    setAuthError('');
    if (!workerId.trim() || !password.trim()) {
      setAuthError('Worker ID and Password are required.');
      return false;
    }
    const user = users.find(
      (u) =>
        u.workerId.toLowerCase() === workerId.trim().toLowerCase() &&
        u.password === password.trim()
    );
    if (user) {
      setCurrentUser({
        name: user.name,
        email: user.email,
        coopId: user.coopId,
        role: user.role,
        workerId: user.workerId,
      });
      setIsAuthenticated(true);
      return true;
    }
    setAuthError('Invalid Worker ID or Password. Please try again.');
    return false;
  };

  // ── Sign Up Step 1: Register & generate OTP + Worker ID ──
  const initiateSignUp = (name, email, password) => {
    setAuthError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('All fields are required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setAuthError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return false;
    }

    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setAuthError('This email is already registered.');
      return false;
    }

    // Auto-generate unique Worker ID (e.g. WRK-1234)
    let uniqueId;
    do {
      uniqueId = `WRK-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (users.some(u => u.workerId === uniqueId));

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setPendingSignUp({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      workerId: uniqueId,
    });

    // Simulate sending email — show Worker ID & OTP in the message
    setOtpToastMsg(`Email sent! Your unique Worker ID is: ${uniqueId} | Your OTP code is: ${otp}`);
    // keep it visible for easy entry
    return true;
  };

  // ── Sign Up Step 2: Verify OTP ──
  const verifyOtpAndRegister = (enteredOtp) => {
    setAuthError('');
    if (!enteredOtp.trim()) {
      setAuthError('Please enter the OTP.');
      return false;
    }
    if (enteredOtp.trim() !== generatedOtp) {
      setAuthError('Incorrect OTP. Please try again.');
      return false;
    }

    // Register user permanently in state
    const newUser = {
      workerId: pendingSignUp.workerId,
      password: pendingSignUp.password,
      name: pendingSignUp.name,
      email: pendingSignUp.email,
      coopId: `SAH-COOP-${pendingSignUp.workerId.split('-')[1]}`,
      role: 'New Cooperative Worker',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setPendingSignUp(null);
    setGeneratedOtp(null);
    setOtpToastMsg('');
    return true;
  };

  const cancelSignUp = () => {
    setPendingSignUp(null);
    setGeneratedOtp(null);
    setOtpToastMsg('');
    setAuthError('');
  };

  // ── Sign Out ──
  const signOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthError('');
    setPendingSignUp(null);
    setGeneratedOtp(null);
    setOtpToastMsg('');
  };

  return (
    <AuthContext.Provider value={{
      users,
      isAuthenticated, currentUser,
      authError, setAuthError,
      signIn, signOut,
      initiateSignUp, verifyOtpAndRegister, cancelSignUp,
      pendingSignUp,
      otpToastMsg, setOtpToastMsg,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
