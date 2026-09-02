/**
 * Sahakari Cross-Portal Real-time Synchronization Engine (Worker)
 */

const CHANNEL_NAME = 'sahakari_realtime_bridge';
let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel fallback:', e);
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
};

export const publishSyncEvent = (type, payload) => {
  const eventData = {
    type,
    payload,
    timestamp: Date.now(),
    origin: typeof window !== 'undefined' ? window.location.pathname : 'worker',
  };

  listeners.forEach((listener) => {
    try {
      listener(eventData);
    } catch (err) {
      console.error('Error in sync listener:', err);
    }
  });

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventData);
    } catch (err) {}
  }

  try {
    localStorage.setItem('sahakari_last_sync_event', JSON.stringify(eventData));
  } catch (e) {}
};

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
      } catch (e) {}
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
};
