import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([
    { workerId: 'WRK-8821', password: '1234', phone: '9876543210', email: 'suresh@sahakari.in', name: 'Suresh Patel', coopId: 'SAH-COOP-8821', role: 'Senior Master Plumber & HVAC Specialist' },
    { workerId: 'WRK-0001', password: '0000', phone: '9000000001', email: 'demo@sahakari.in', name: 'Demo Worker', coopId: 'SAH-COOP-0001', role: 'Electrician' },
  ]);

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: 'Suresh Patel',
    email: 'suresh@sahakari.in',
    coopId: 'SAH-COOP-8821',
    role: 'Senior Master Plumber & HVAC Specialist',
    workerId: 'WRK-8821',
  });
  const [authError, setAuthError] = useState('');
  const [pendingSignUp, setPendingSignUp] = useState(null);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpToastMsg, setOtpToastMsg] = useState('');

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

  const initiateSignUp = (name, email, password) => {
    setAuthError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('All fields are required.');
      return false;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const newWorkerId = `WRK-${Math.floor(1000 + Math.random() * 9000)}`;
    setPendingSignUp({ name, email, password, otp, workerId: newWorkerId });
    setGeneratedOtp(otp);
    setOtpToastMsg(`Verification OTP: ${otp}`);
    return true;
  };

  const verifyOtpAndRegister = (otpInput) => {
    setAuthError('');
    if (!pendingSignUp) return false;
    if (otpInput.trim() !== pendingSignUp.otp) {
      setAuthError('Incorrect OTP. Please check the code.');
      return false;
    }
    const newUser = {
      workerId: pendingSignUp.workerId,
      password: pendingSignUp.password,
      phone: '9876543210',
      email: pendingSignUp.email,
      name: pendingSignUp.name,
      coopId: `SAH-COOP-${pendingSignUp.workerId.replace('WRK-', '')}`,
      role: 'Gig Worker Member',
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser({
      name: newUser.name,
      email: newUser.email,
      coopId: newUser.coopId,
      role: newUser.role,
      workerId: newUser.workerId,
    });
    setIsAuthenticated(true);
    setPendingSignUp(null);
    setGeneratedOtp(null);
    setOtpToastMsg('');
    return true;
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        authError,
        pendingSignUp,
        generatedOtp,
        otpToastMsg,
        signIn,
        initiateSignUp,
        verifyOtpAndRegister,
        signOut,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
