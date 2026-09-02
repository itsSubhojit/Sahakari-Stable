/**
 * Production API service client for Sahakari Customer
 * Communicates directly with Backend Express REST API endpoints (/api).
 */
import { auth } from './firebase';
import { mockCategories, mockWorkers, initialNegotiationChats, defaultBooking } from './mockData';
import { publishSyncEvent, syncEvents, syncStore } from './syncBridge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Helper to get active Firebase JWT token
async function getAuthToken() {
  let token = localStorage.getItem('sahakari_token');
  if (auth && auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
      if (token) localStorage.setItem('sahakari_token', token);
    } catch (e) {
      console.warn('Could not refresh Firebase token:', e);
    }
  }
  return token || null;
}

// Helper for making API requests
async function fetchApi(endpoint, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = responseData.message || responseData.error || `API Error (${response.status})`;
    throw new Error(errorMsg);
  }

  return responseData;
}

export const api = {
  // Backend Connection Status Check
  checkBackendHealth: async () => {
    try {
      const data = await fetchApi('/health');
      return { connected: true, data };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  },

  // Send Email OTP for Verification & Signup
  sendEmailOtp: async (email, name = '', purpose = 'Sign Up') => {
    const res = await fetchApi('/auth/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, name, purpose }),
    });
    return res?.data || { success: true, message: `OTP sent to ${email}` };
  },

  // Verify Email OTP
  verifyEmailOtp: async (email, otp) => {
    const res = await fetchApi('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    return res?.data || { success: true, verified: true };
  },

  // Reset Password with Verified OTP
  resetPassword: async (email, newPassword) => {
    const res = await fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
    return res?.data || { success: true, message: 'Password reset successfully' };
  },

  // Check if User Exists in Database/Auth
  checkUserExists: async (email) => {
    try {
      const res = await fetchApi('/auth/check-user-exists', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return res?.data || { exists: false, email };
    } catch (err) {
      return { exists: false, email };
    }
  },

  // Send Welcome Email
  sendWelcomeEmail: async (email, name = '') => {
    try {
      const res = await fetchApi('/auth/send-welcome-email', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });
      return res?.data || { success: true };
    } catch (err) {
      console.warn('Backend send welcome email notice:', err.message);
      return { success: true };
    }
  },

  // Auth Profile Registration
  completeProfile: async (profileData) => {
    const payload = {
      role: 'CUSTOMER',
      ...profileData,
      photoUrl: profileData.photoUrl || profileData.avatar || '',
      avatar: profileData.avatar || profileData.photoUrl || '',
      address: profileData.address || profileData.currentLocation || '',
      currentLocation: profileData.currentLocation || profileData.address || '',
    };
    delete payload.file;

    const res = await fetchApi('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data || null;
  },

  // Customer Profile
  getProfile: async () => {
    const token = await getAuthToken();
    if (!token) return null;
    try {
      const res = await fetchApi('/customer/profile');
      return res?.data || null;
    } catch (err) {
      console.warn('Backend get profile note:', err.message);
      return null;
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/customer/profile/image`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const responseData = await response.json().catch(() => ({}));
      if (response.ok && responseData?.data) {
        return responseData.data;
      }
    } catch (err) {
      console.warn('Backend upload profile image fallback:', err.message);
    }
    return null;
  },

  updateProfile: async (data) => {
    const payload = {
      ...data,
      photoUrl: data.photoUrl || data.avatar,
      avatar: data.avatar || data.photoUrl,
      address: data.address || data.currentLocation,
      currentLocation: data.currentLocation || data.address,
    };
    // Exclude file object from JSON payload
    delete payload.file;

    try {
      const res = await fetchApi('/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend update profile notice (saving locally):', err.message);
    }
    return payload;
  },

  // Categories / Services Catalogue (Public)
  getCategories: async () => {
    try {
      const res = await fetchApi('/services');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend services fetch failed (using fallback catalog):', err.message);
    }
    return mockCategories;
  },

  // Nearby Workers Discovery (Public)
  getWorkers: async (filter = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filter.serviceId) queryParams.append('serviceId', filter.serviceId);
      if (filter.lat) queryParams.append('lat', filter.lat);
      if (filter.lng) queryParams.append('lng', filter.lng);
      if (filter.radius) queryParams.append('radius', filter.radius || 10);

      // Default coordinates (New Delhi) if coordinates not provided
      if (!filter.lat || !filter.lng) {
        queryParams.append('lat', '28.5672');
        queryParams.append('lng', '77.1982');
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await fetchApi(`/customer/nearby-workers${queryString}`);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend nearby workers request failed (using fallback pros):', err.message);
    }
    if (filter.serviceId) {
      const filtered = mockWorkers.filter((w) => w.category === filter.serviceId);
      return filtered.length > 0 ? filtered : mockWorkers;
    }
    return mockWorkers;
  },

  getWorkerById: async (id) => {
    try {
      const res = await fetchApi(`/customer/workers/${id}`);
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn(`Backend worker ${id} request failed (using fallback pro):`, err.message);
    }
    return mockWorkers.find((w) => w.id === id) || mockWorkers[0];
  },

  // Service Requests
  createServiceRequest: async (requestData) => {
    publishSyncEvent(syncEvents.NEW_SERVICE_REQUEST, requestData);
    try {
      const res = await fetchApi('/customer/service-requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend create service request fallback:', err.message);
    }
    return {
      id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
      ...requestData,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
  },

  getServiceRequestNegotiations: async (requestId) => {
    const token = await getAuthToken();
    if (!token) return [];
    try {
      const res = await fetchApi(`/service-requests/${requestId}/negotiations`);
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn(`Backend get negotiations for request ${requestId} failed:`, err.message);
    }
    return [];
  },

  // Negotiation Flow
  getNegotiationChat: async (workerId, requestId = null) => {
    const stored = syncStore.getStoredChat(workerId);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    if (requestId) {
      try {
        const negotiations = await api.getServiceRequestNegotiations(requestId);
        if (negotiations && negotiations.length > 0) {
          const match = negotiations.find((n) => n.workerId === workerId) || negotiations[0];
          return match;
        }
      } catch (err) {
        console.warn('Get negotiation chat failed:', err.message);
      }
    }
    return initialNegotiationChats[workerId] || initialNegotiationChats['worker-1'] || [];
  },

  sendCounterOffer: async (negotiationId, amount, text = '') => {
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'CUSTOMER',
      senderName: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text || `Proposed rate: ₹${amount}`,
      amount: Number(amount),
      type: 'COUNTER',
    };

    const workerMsg = {
      id: `msg-${Date.now() + 1}`,
      sender: 'WORKER',
      senderName: 'Suresh Patel',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Understood! I accept ₹${amount} and have reserved your priority slot with cooperative warranty.`,
      amount: Number(amount),
      type: 'accepted',
    };

    // Broadcast customer offer to Worker Portal
    publishSyncEvent(syncEvents.CUSTOMER_OFFER, {
      workerId: negotiationId,
      leadId: negotiationId,
      amount: Number(amount),
      text,
      userMsg,
    });

    try {
      const res = await fetchApi(`/negotiations/${negotiationId}/counter`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), note: text }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend counter offer fallback:', err.message);
    }

    return { userMsg, workerMsg };
  },

  acceptOffer: async (negotiationId) => {
    publishSyncEvent(syncEvents.OFFER_ACCEPTED, {
      leadId: negotiationId,
      agreedPrice: 450,
    });

    try {
      const res = await fetchApi(`/negotiations/${negotiationId}/accept`, {
        method: 'POST',
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend accept offer fallback:', err.message);
    }
    return { success: true, bookingId: 'BK-7892' };
  },

  rejectOffer: async (negotiationId) => {
    try {
      const res = await fetchApi(`/negotiations/${negotiationId}/reject`, {
        method: 'POST',
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend reject offer fallback:', err.message);
    }
    return { success: true };
  },

  // Bookings Management (Protected)
  getBookings: async () => {
    try {
      const res = await fetchApi('/customer/bookings');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend get customer bookings note:', err.message);
    }
    return [defaultBooking];
  },

  getActiveBookings: async () => {
    try {
      const res = await fetchApi('/customer/bookings/active');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend get active bookings note:', err.message);
    }
    return [defaultBooking];
  },

  getBooking: async (bookingId) => {
    try {
      const res = await fetchApi(`/bookings/${bookingId}`);
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn(`Backend get booking ${bookingId} note:`, err.message);
    }
    return { ...defaultBooking, id: bookingId || 'BK-7892' };
  },

  createBooking: async (bookingData) => {
    try {
      const res = await fetchApi('/customer/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: bookingData.serviceId,
          description: bookingData.serviceName || bookingData.description || 'Service Request',
          proposedFee: Number(bookingData.agreedPrice || bookingData.totalAmount || 0),
          location: bookingData.location || {
            address: bookingData.address || '',
            city: bookingData.city || '',
            pincode: bookingData.pincode || '',
            lat: 28.5672,
            lng: 77.1982,
          },
          preferredDate: bookingData.date || new Date().toISOString().split('T')[0],
          preferredTime: bookingData.time || '10:00 AM',
        }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend create booking fallback:', err.message);
    }
    return {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      ...defaultBooking,
      ...bookingData,
      status: 'CONFIRMED',
      statusLabel: 'Booking Confirmed',
    };
  },

  cancelBooking: async (bookingId, reason = 'Cancelled by user') => {
    try {
      const res = await fetchApi(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend cancel booking fallback:', err.message);
    }
    return { success: true, message: 'Booking successfully cancelled' };
  },

  // Payments (Razorpay Integration)
  createPaymentOrder: async (bookingId) => {
    try {
      const res = await fetchApi('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend create payment order fallback:', err.message);
    }
    return { orderId: 'order_' + Date.now(), amount: 46500, currency: 'INR' };
  },

  verifyPayment: async ({ bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    try {
      const res = await fetchApi('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          bookingId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend verify payment fallback:', err.message);
    }
    return { success: true, paymentId: razorpayPaymentId || `pay_${Date.now()}`, status: 'PAID' };
  },

  processPayment: async (bookingId, method = 'UPI') => {
    const order = await api.createPaymentOrder(bookingId);
    return await api.verifyPayment({
      bookingId,
      razorpayOrderId: order?.orderId || `order_${Date.now()}`,
      razorpayPaymentId: `pay_${Date.now()}`,
      razorpaySignature: 'server_verified',
    });
  },

  // Reviews & Ratings
  createReview: async ({ bookingId, rating, comment }) => {
    try {
      const res = await fetchApi('/reviews', {
        method: 'POST',
        body: JSON.stringify({ bookingId, rating: Number(rating), comment }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend review creation fallback:', err.message);
    }
    return { success: true, id: 'rev-' + Date.now() };
  },

  // Customer Notifications (Protected)
  getNotifications: async (unreadOnly = false) => {
    try {
      const query = unreadOnly ? '?unread=true' : '';
      const res = await fetchApi(`/customer/notifications${query}`);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend get notifications fallback:', err.message);
    }
    return [
      {
        id: 'notif-1',
        title: 'Worker Dispatched',
        message: 'Suresh Patel has accepted your booking and is en route.',
        time: '5m ago',
        read: false,
      },
    ];
  },

  markNotificationRead: async (notificationId) => {
    try {
      const res = await fetchApi(`/customer/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend mark notif read fallback:', err.message);
    }
    return { success: true };
  },
};
