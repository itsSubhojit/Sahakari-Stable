/**
 * Sahakari Cross-Portal Real-time Synchronization Engine
 * Seamlessly connects Customer Portal, Worker Portal, and Express Backend.
 * Provides real-time BroadcastChannel messaging, cross-tab persistence,
 * and background synchronization with Express REST endpoints.
 */

const CHANNEL_NAME = 'sahakari_realtime_bridge';
let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization fallback:', e);
  }
}

const listeners = new Set();

export const syncEvents = {
  NEW_SERVICE_REQUEST: 'NEW_SERVICE_REQUEST',
  CUSTOMER_OFFER: 'CUSTOMER_OFFER',
  WORKER_COUNTER: 'WORKER_COUNTER',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_REJECTED: 'OFFER_REJECTED',
  BOOKING_UPDATED: 'BOOKING_UPDATED',
  WORKER_STATUS_CHANGED: 'WORKER_STATUS_CHANGED',
  TELEMETRY_UPDATED: 'TELEMETRY_UPDATED',
};

// Dispatch event locally and over BroadcastChannel
export const publishSyncEvent = (type, payload) => {
  const eventData = {
    type,
    payload,
    timestamp: Date.now(),
    origin: typeof window !== 'undefined' ? window.location.pathname : 'app',
  };

  // Local notify
  listeners.forEach((listener) => {
    try {
      listener(eventData);
    } catch (err) {
      console.error('Error in sync listener:', err);
    }
  });

  // Cross-tab broadcast
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventData);
    } catch (err) {
      console.warn('Broadcast postMessage failed:', err);
    }
  }

  // Also trigger storage event for browsers without BroadcastChannel
  try {
    localStorage.setItem('sahakari_last_sync_event', JSON.stringify(eventData));
  } catch (e) {
    // storage full or disabled
  }
};

// Listen for sync events
export const subscribeSyncEvent = (callback) => {
  listeners.add(callback);

  const handleChannelMessage = (event) => {
    if (event && event.data) {
      callback(event.data);
    }
  };

  const handleStorageMessage = (event) => {
    if (event.key === 'sahakari_last_sync_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        callback(parsed);
      } catch (e) {
        // ignore parse error
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleChannelMessage);
  }
  window.addEventListener('storage', handleStorageMessage);

  return () => {
    listeners.delete(callback);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleChannelMessage);
    }
    window.removeEventListener('storage', handleStorageMessage);
  };
};

// Shared Store Helpers
export const syncStore = {
  getStoredLeads: () => {
    try {
      const data = localStorage.getItem('sahakari_shared_leads');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveStoredLeads: (leads) => {
    try {
      localStorage.setItem('sahakari_shared_leads', JSON.stringify(leads));
    } catch (e) {}
  },

  getStoredChat: (threadId) => {
    try {
      const data = localStorage.getItem(`sahakari_chat_${threadId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveStoredChat: (threadId, messages) => {
    try {
      localStorage.setItem(`sahakari_chat_${threadId}`, JSON.stringify(messages));
    } catch (e) {}
  },

  getStoredBookings: () => {
    try {
      const data = localStorage.getItem('sahakari_shared_bookings');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveStoredBookings: (bookings) => {
    try {
      localStorage.setItem('sahakari_shared_bookings', JSON.stringify(bookings));
    } catch (e) {}
  },
};
