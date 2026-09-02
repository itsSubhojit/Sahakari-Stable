// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Web app's Firebase configuration with support for multiple env key naming patterns
const env = import.meta.env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.VITE_API_KEY || env.API_KEY || "AIzaSyDT9IQV2HqhiXq8VN9KZEK4Y1rddTjNZvM",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.VITE_AUTH_DOMAIN || env.AUTH_DOMAIN || "sahakari26089.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.VITE_PROJECT_ID || env.PROJECT_ID || "sahakari26089",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.VITE_STORAGE_BUCKET || env.STORAGE_BUCKET || "sahakari26089.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.VITE_MESSAGING_SENDER_ID || env.MESSAGING_SENDER_ID || "1045242684512",
  appId: env.VITE_FIREBASE_APP_ID || env.VITE_APP_ID || env.APP_ID || "1:1045242684512:web:3d3f1240c91fff6efa4f05",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.VITE_MEASUREMENT_ID || env.MEASUREMENT_ID || "G-SRSKGP6KKC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore Database & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics safe stub (prevents adblockers from throwing ERR_BLOCKED_BY_CLIENT)
export const analytics = null;

/**
 * Firebase Firestore Complete Helper Methods for Sahakari
 */
export const firebaseDb = {
  // Save or update customer profile directly in Firestore
  saveCustomerProfile: async (uid, profileData) => {
    if (!uid) return null;
    try {
      const customerRef = doc(db, 'customers', uid);
      const cleanData = {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        houseNo: profileData.houseNo || '',
        currentLocation: profileData.currentLocation || profileData.address || '',
        address: profileData.currentLocation || profileData.address || '',
        landmark: profileData.landmark || '',
        city: profileData.city || '',
        pincode: profileData.pincode || '',
        avatar: profileData.avatar || profileData.photoUrl || '',
        photoUrl: profileData.avatar || profileData.photoUrl || '',
        role: 'CUSTOMER',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(customerRef, cleanData, { merge: true });
      return { id: uid, ...cleanData };
    } catch (error) {
      console.warn('Direct Firestore saveCustomerProfile notice:', error.message);
      return null;
    }
  },

  // Fetch customer profile directly from Firestore
  getCustomerProfile: async (uid) => {
    if (!uid) return null;
    try {
      const customerRef = doc(db, 'customers', uid);
      const snap = await getDoc(customerRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (error) {
      console.warn('Direct Firestore getCustomerProfile notice:', error.message);
    }
    return null;
  },

  // Create or sync a new service booking request in Firestore
  createBooking: async (bookingData) => {
    try {
      const docData = {
        ...bookingData,
        status: bookingData.status || 'CONFIRMED',
        statusLabel: bookingData.statusLabel || 'Booking Confirmed',
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'bookings'), docData);
      // Also add to service_requests for dual compatibility
      await setDoc(doc(db, 'service_requests', docRef.id), docData, { merge: true });
      return { id: docRef.id, ...docData };
    } catch (error) {
      console.warn('Direct Firestore createBooking notice:', error.message);
      return {
        id: `BK-${Date.now()}`,
        ...bookingData,
      };
    }
  },

  // Fetch all bookings for customer from Firestore
  getBookings: async (customerId) => {
    try {
      const bookingsList = [];
      const colRef = collection(db, 'bookings');
      const querySnapshot = await getDocs(colRef);
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (!customerId || d.customerId === customerId || d.userId === customerId) {
          bookingsList.push({ id: docSnap.id, ...d });
        }
      });
      return bookingsList;
    } catch (error) {
      console.warn('Direct Firestore getBookings notice:', error.message);
      return [];
    }
  },

  // Update booking status in Firestore
  updateBookingStatus: async (bookingId, status, statusLabel) => {
    if (!bookingId) return;
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await setDoc(
        bookingRef,
        {
          status,
          statusLabel: statusLabel || status,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Direct Firestore updateBookingStatus notice:', error.message);
    }
  },

  // Save negotiation chat messages to Firestore
  saveNegotiationMessage: async (negotiationId, message) => {
    if (!negotiationId) return;
    try {
      const chatRef = doc(db, 'negotiations', String(negotiationId));
      await addDoc(collection(chatRef, 'messages'), {
        ...message,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Direct Firestore saveNegotiationMessage notice:', error.message);
    }
  },
};

export default app;
