import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { BookingProvider } from './store/BookingContext';
import { ThemeProvider } from './store/ThemeContext';
import { LanguageProvider } from './store/LanguageContext';

// Pages
import { Services } from './pages/customer/Services';
import { NearbyWorkers } from './pages/customer/NearbyWorkers';
import { Negotiation } from './pages/customer/Negotiation';
import { BookingDetail } from './pages/customer/BookingDetail';
import { BookingRequest } from './pages/customer/BookingRequest';
import { LiveTracking } from './pages/customer/LiveTracking';

export function App() {
  return (
    <LanguageProvider>
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/services" replace />} />
              <Route path="/services" element={<Services />} />
              <Route path="/workers" element={<Navigate to="/services" replace />} />
              <Route path="/book" element={<BookingRequest />} />
              <Route path="/negotiation/:workerId" element={<Negotiation />} />
              <Route path="/negotiation" element={<Negotiation />} />
              <Route path="/booking/:bookingId" element={<BookingDetail />} />
              <Route path="/booking" element={<BookingDetail />} />
              <Route path="/tracking/:bookingId" element={<LiveTracking />} />
              <Route path="/tracking" element={<LiveTracking />} />
              <Route path="/login" element={<Navigate to="/services" replace />} />
              <Route path="/signup" element={<Navigate to="/services" replace />} />
              <Route path="*" element={<Navigate to="/services" replace />} />
            </Routes>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
