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
        
        // Inject a demo COMPLETED request if it doesn't exist
        if (!mergedList.some(b => b.id === 'BK-DEMO-COMPLETED')) {
          mergedList.push({
            id: 'BK-DEMO-COMPLETED',
            customerId: activeUid || 'demo-user',
            customerName: user?.name || 'Customer',
            serviceId: 'appliance',
            serviceName: 'Washing Machine Repair',
            category: 'appliance',
            workerId: 'worker-2',
            workerName: 'Amit Verma',
            workerPhone: '+91 88888 77777',
            date: new Date().toISOString().split('T')[0],
            time: '02:00 PM',
            address: user?.address || '123 Main St, New Delhi',
            city: 'New Delhi',
            pincode: '110001',
            agreedPrice: 850,
            platformFee: 42,
            taxes: 45,
            totalPrice: 937,
            status: 'COMPLETED',
            statusLabel: 'SERVICE COMPLETED',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            worker: {
              id: 'worker-2',
              name: 'Amit Verma',
              rating: 4.9,
              avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400'
            }
          });
        }

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

  const updateBookingStatus = (arg1, arg2, arg3) => {
    let targetId, status, statusLabel;
    
    const KNOWN_STATUSES = ['REQUEST_SUBMITTED', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'ON_THE_WAY', 'IN_PROGRESS'];
    
    // Support (bookingId, status, statusLabel) OR (status, statusLabel)
    if (arg3 !== undefined || (typeof arg1 === 'string' && !KNOWN_STATUSES.includes(arg1))) {
      targetId = arg1;
      status = arg2;
      statusLabel = arg3 || arg2;
    } else {
      targetId = currentBooking?.id;
      status = arg1;
      statusLabel = arg2 || arg1;
    }

    console.log('[updateBookingStatus]', { arg1, arg2, arg3, targetId, status, statusLabel });

    if (!targetId) return;

    setCurrentBooking((prev) => {
      if (!prev || prev.id !== targetId) return prev;
      return { ...prev, status, statusLabel };
    });

    setBookings((prev) => {
      const updatedList = prev.map((b) =>
        b.id === targetId ? { ...b, status, statusLabel } : b
      );
      localStorage.setItem('sahakari_bookings', JSON.stringify(updatedList));
      return updatedList;
    });

    firebaseDb.updateBookingStatus(targetId, status, statusLabel).catch(() => {});
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
    
    setBookings((prev) => {
      if (prev.some((b) => b.id === formattedBooking.id)) return prev;
      const updated = [formattedBooking, ...prev];
      localStorage.setItem('sahakari_bookings', JSON.stringify(updated));
      return updated;
    });
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
