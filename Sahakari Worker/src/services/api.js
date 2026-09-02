/**
 * Sahakari Worker API Integration Client (Standalone Worker App)
 */
import { initialLeads, mockWorkerProfile } from '../data/mockLeads';
import { publishSyncEvent, syncEvents, syncStore } from './syncBridge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthToken = () => {
  return localStorage.getItem('sahakari_worker_token') || localStorage.getItem('sahakari_token');
};

const fetchWorkerApi = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Worker API Error (${response.status})`);
  }
  return data;
};

export const workerApi = {
  getProfile: async () => {
    try {
      const res = await fetchWorkerApi('/worker/profile');
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Worker get profile fallback:', err.message);
    }
    return mockWorkerProfile;
  },

  updateProfile: async (data) => {
    try {
      const res = await fetchWorkerApi('/worker/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Worker update profile fallback:', err.message);
    }
    return { ...mockWorkerProfile, ...data };
  },

  updateAvailability: async (status) => {
    try {
      const res = await fetchWorkerApi('/worker/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: status === 'ONLINE', status }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Worker update availability fallback:', err.message);
    }
    publishSyncEvent(syncEvents.WORKER_STATUS_CHANGED, { status });
    return { success: true, status };
  },

  getRequests: async () => {
    try {
      const res = await fetchWorkerApi('/worker/requests');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Worker requests fallback:', err.message);
    }
    const stored = syncStore.getStoredLeads();
    return stored || initialLeads;
  },

  sendCounterOffer: async (leadId, amount, note = '', terms = {}) => {
    const numAmount = Number(amount);
    const workerMsg = {
      id: `counter-${Date.now()}`,
      sender: 'WORKER',
      senderName: 'You (Suresh Patel)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: note || `Counter offer: ₹${numAmount}`,
      amount: numAmount,
      type: 'COUNTER',
      terms,
    };

    try {
      const res = await fetchWorkerApi(`/negotiations/${leadId}/counter`, {
        method: 'POST',
        body: JSON.stringify({ amount: numAmount, note, terms }),
      });
      if (res?.data) {
        publishSyncEvent(syncEvents.WORKER_COUNTER, { leadId, workerMsg, agreedAmount: numAmount });
        return res.data;
      }
    } catch (err) {
      console.warn('Worker send counter fallback:', err.message);
    }

    publishSyncEvent(syncEvents.WORKER_COUNTER, { leadId, workerMsg, agreedAmount: numAmount });
    return { success: true, workerMsg };
  },

  acceptJobOffer: async (leadId, agreedPrice) => {
    try {
      const res = await fetchWorkerApi(`/negotiations/${leadId}/accept`, {
        method: 'POST',
      });
      if (res?.data) {
        publishSyncEvent(syncEvents.OFFER_ACCEPTED, { leadId, agreedPrice });
        return res.data;
      }
    } catch (err) {
      console.warn('Worker accept offer fallback:', err.message);
    }

    publishSyncEvent(syncEvents.OFFER_ACCEPTED, { leadId, agreedPrice });
    return { success: true, bookingId: 'BK-7892' };
  },

  rejectJobOffer: async (leadId, reason = 'Schedule conflict') => {
    try {
      const res = await fetchWorkerApi(`/negotiations/${leadId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res?.data) {
        publishSyncEvent(syncEvents.OFFER_REJECTED, { leadId, reason });
        return res.data;
      }
    } catch (err) {
      console.warn('Worker reject fallback:', err.message);
    }

    publishSyncEvent(syncEvents.OFFER_REJECTED, { leadId, reason });
    return { success: true };
  },

  updateBookingStatus: async (bookingId, status) => {
    try {
      const res = await fetchWorkerApi(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res?.data) {
        publishSyncEvent(syncEvents.BOOKING_UPDATED, { bookingId, status });
        return res.data;
      }
    } catch (err) {
      console.warn('Worker update booking fallback:', err.message);
    }

    publishSyncEvent(syncEvents.BOOKING_UPDATED, { bookingId, status });
    return { success: true, bookingId, status };
  },

  getEarnings: async () => {
    try {
      const res = await fetchWorkerApi('/worker/earnings');
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Worker earnings fallback:', err.message);
    }
    return {
      todayEarnings: 1850,
      weekEarnings: 9400,
      monthlyEarnings: 38200,
      coopDividendAccrued: 1420,
      completedJobsCount: 312,
    };
  },
};
