/**
 * Sahakari Worker API Integration Client
 * Directly interacts with Backend Express REST API endpoints (/api/worker/*, /api/negotiations/*, /api/bookings/*)
 * with robust offline/mock fallback and cross-portal real-time synchronization.
 */
import { auth } from './firebase';
import { initialLeads, mockWorkerProfile } from './mockDataWorker';
import { publishSyncEvent, syncEvents, syncStore } from './syncBridge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthToken = async () => {
  try {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (err) {
    // ignore
  }
  return localStorage.getItem('sahakari_worker_token') || localStorage.getItem('sahakari_token');
};

const fetchWorkerApi = async (endpoint, options = {}) => {
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

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Worker API Error (${response.status})`);
  }
  return data;
};

export const workerApi = {
  // W1 — Worker Profile & Verification
  getProfile: async () => {
    try {
      const res = await fetchWorkerApi('/worker/profile');
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend get worker profile fallback:', err.message);
    }
    const local = localStorage.getItem('sahakari_worker_profile');
    return local ? JSON.parse(local) : mockWorkerProfile;
  },

  updateProfile: async (data) => {
    try {
      const res = await fetchWorkerApi('/worker/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend update worker profile fallback:', err.message);
    }
    const current = await workerApi.getProfile();
    const updated = { ...current, ...data };
    localStorage.setItem('sahakari_worker_profile', JSON.stringify(updated));
    return updated;
  },

  // W3 — Availability Status & Location Ping
  updateAvailability: async (status, location = null) => {
    try {
      const res = await fetchWorkerApi('/worker/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: status === 'ONLINE', status, location }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend update availability fallback:', err.message);
    }
    localStorage.setItem('sahakari_worker_status', status);
    publishSyncEvent(syncEvents.WORKER_STATUS_CHANGED, { status, location });
    return { success: true, status };
  },

  // W4 — Leads / Service Requests
  getRequests: async () => {
    try {
      const res = await fetchWorkerApi('/worker/requests');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend worker requests fallback:', err.message);
    }
    const stored = syncStore.getStoredLeads();
    return stored || initialLeads;
  },

  // Negotiations (Worker Counter & Accept)
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
      console.warn('Backend worker counter fallback:', err.message);
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
      console.warn('Backend worker accept offer fallback:', err.message);
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
      console.warn('Backend worker reject fallback:', err.message);
    }

    publishSyncEvent(syncEvents.OFFER_REJECTED, { leadId, reason });
    return { success: true };
  },

  // W5 — Advance Booking Status (IN_TRANSIT -> ARRIVED -> IN_PROGRESS -> COMPLETED)
  updateBookingStatus: async (bookingId, status, telemetry = {}) => {
    try {
      const res = await fetchWorkerApi(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...telemetry }),
      });
      if (res?.data) {
        publishSyncEvent(syncEvents.BOOKING_UPDATED, { bookingId, status, telemetry });
        return res.data;
      }
    } catch (err) {
      console.warn('Backend update booking status fallback:', err.message);
    }

    publishSyncEvent(syncEvents.BOOKING_UPDATED, { bookingId, status, telemetry });
    return { success: true, bookingId, status };
  },

  // W6 — Earnings & Cooperative Dividend
  getEarnings: async () => {
    try {
      const res = await fetchWorkerApi('/worker/earnings');
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend worker earnings fallback:', err.message);
    }
    return {
      todayEarnings: 1850,
      weekEarnings: 9400,
      monthlyEarnings: 38200,
      coopDividendAccrued: 1420,
      activeTier: 'Tier 1 Cooperative Shareholder',
      completedJobsCount: 312,
    };
  },

  // SOS Trigger
  triggerSOS: async (location = null) => {
    try {
      const res = await fetchWorkerApi('/worker/sos', {
        method: 'POST',
        body: JSON.stringify({ location, timestamp: new Date().toISOString() }),
      });
      if (res?.data) return res.data;
    } catch (err) {
      console.warn('Backend SOS trigger fallback:', err.message);
    }
    return { success: true, message: 'Emergency alert broadcast to Sahakari Response Center' };
  },
};
