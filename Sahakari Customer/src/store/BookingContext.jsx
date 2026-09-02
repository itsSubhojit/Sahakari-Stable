import React, { createContext, useState, useEffect, useContext } from 'react';
import { calculatePaymentSummary } from '../utils/formatters';
import { api } from '../services/api';
import { firebaseDb } from '../services/firebase';
import { AuthContext } from './AuthContext';

export const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext) || {};

  // Initialize from localStorage immediately so bookings persist across page reloads
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('sahakari_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentBooking, setCurrentBooking] = useState(() => {
    try {
      const saved = localStorage.getItem('sahakari_current_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeNegotiation, setActiveNegotiation] = useState(null);

  // Sync with Firestore & Backend on mount / user change
  useEffect(() => {
    const fetchUserBookings = async () => {
      const activeUid = user?.id || user?.uid;
      try {
        const [firestoreBookings, backendBookings] = await Promise.all([
          activeUid ? firebaseDb.getBookings(activeUid).catch(() => []) : Promise.resolve([]),
          api.getBookings().catch(() => []),
        ]);

        const combinedMap = new Map();

        // 1. Add current state bookings first
        bookings.forEach((b) => {
          if (b && b.id) combinedMap.set(b.id, b);
        });

        // 2. Add backend bookings
        if (Array.isArray(backendBookings)) {
          backendBookings.forEach((b) => {
            if (b && b.id) combinedMap.set(b.id, { ...b, id: b.id });
          });
        }

        // 3. Add firestore bookings
        if (Array.isArray(firestoreBookings)) {
          firestoreBookings.forEach((b) => {
            if (b && b.id) combinedMap.set(b.id, { ...(combinedMap.get(b.id) || {}), ...b });
          });
        }

        const mergedList = Array.from(combinedMap.values());
        if (mergedList.length > 0) {
          setBookings(mergedList);
          localStorage.setItem('sahakari_bookings', JSON.stringify(mergedList));
          if (!currentBooking && mergedList[0]) {
            setCurrentBooking(mergedList[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to sync bookings:', err);
      }
    };

    fetchUserBookings();
  }, [user?.id, user?.uid, isAuthenticated]);

  // Persist currentBooking whenever it updates
  useEffect(() => {
    if (currentBooking) {
      localStorage.setItem('sahakari_current_booking', JSON.stringify(currentBooking));
    }
  }, [currentBooking]);

  const updateAgreedPrice = (price) => {
    const summary = calculatePaymentSummary(price);
    setCurrentBooking((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        agreedPrice: summary.basePrice,
        platformFee: summary.platformFee,
        taxes: summary.taxes,
        totalPrice: summary.total,
      };
      if (updated.id) {
        firebaseDb.updateBookingStatus(updated.id, updated.status, updated.statusLabel);
      }
      return updated;
    });
    setActiveNegotiation((prev) => (prev ? { ...prev, agreedPrice: price } : null));
  };

  const updateBookingStatus = (status, statusLabel) => {
    setCurrentBooking((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        status,
        statusLabel: statusLabel || status,
      };
      if (updated.id) {
        firebaseDb.updateBookingStatus(updated.id, status, statusLabel);
      }
      return updated;
    });

    setBookings((prev) => {
      const updatedList = prev.map((b) =>
        b.id === currentBooking?.id ? { ...b, status, statusLabel: statusLabel || status } : b
      );
      localStorage.setItem('sahakari_bookings', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const setBookingDetails = (details) => {
    const price = details.agreedPrice || details.startingPrice || 0;
    const summary = calculatePaymentSummary(price);

    const formattedBooking = {
      ...details,
      agreedPrice: summary.basePrice,
      platformFee: summary.platformFee,
      taxes: summary.taxes,
      totalPrice: summary.total,
      status: details.status || 'CONFIRMED',
      statusLabel: details.statusLabel || 'Booking Confirmed',
    };

    setCurrentBooking(formattedBooking);
  };

  const addBooking = async (newBooking) => {
    const activeUid = user?.id || user?.uid || `cust_${Date.now()}`;
    const summary = calculatePaymentSummary(newBooking.agreedPrice || newBooking.startingPrice || 0);

    const bookingObj = {
      id: `BK-${Date.now()}`,
      customerId: activeUid,
      customerName: user?.name || 'Customer',
      customerPhone: user?.phone || '+91 98765 43210',
      serviceId: newBooking.serviceId || 'SVR-CUSTOM',
      serviceName: newBooking.serviceName || 'Custom Service',
      category: newBooking.category || 'General',
      workerId: newBooking.workerId || 'worker-1',
      workerName: newBooking.workerName || 'Suresh Patel',
      workerPhone: newBooking.workerPhone || '+91 98765 43210',
      date: newBooking.date || new Date().toISOString().split('T')[0],
      time: newBooking.time || '10:00 AM',
      address: newBooking.address || user?.address || user?.currentLocation || 'User Address',
      city: newBooking.city || user?.city || 'Delhi',
      pincode: newBooking.pincode || user?.pincode || '110001',
      agreedPrice: summary.basePrice,
      platformFee: summary.platformFee,
      taxes: summary.taxes,
      totalPrice: summary.total,
      status: 'CONFIRMED',
      statusLabel: 'Booking Confirmed',
      createdAt: new Date().toISOString(),
    };

    // 1. Direct Firestore Persistence
    try {
      const fsResult = await firebaseDb.createBooking(bookingObj);
      if (fsResult?.id) {
        bookingObj.id = fsResult.id;
      }
    } catch (fsErr) {
      console.warn('Firestore createBooking notice:', fsErr);
    }

    // 2. Backend API persistence
    try {
      await api.createBooking(bookingObj);
    } catch (err) {
      console.warn('Backend createBooking notice:', err.message);
    }

    // 3. Local state and localStorage update
    setBookings((prev) => {
      const updated = [bookingObj, ...prev];
      localStorage.setItem('sahakari_bookings', JSON.stringify(updated));
      return updated;
    });
    setCurrentBooking(bookingObj);

    return bookingObj;
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        currentBooking,
        activeNegotiation,
        setCurrentBooking,
        setActiveNegotiation,
        updateAgreedPrice,
        updateBookingStatus,
        setBookingDetails,
        addBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
