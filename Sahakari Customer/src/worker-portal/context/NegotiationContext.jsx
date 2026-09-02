import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialLeads, mockWorkerProfile } from '../../services/mockDataWorker';
import { workerApi } from '../../services/workerApi';
import { subscribeSyncEvent, publishSyncEvent, syncEvents, syncStore } from '../../services/syncBridge';
import confetti from 'canvas-confetti';

const NegotiationContext = createContext();

export const NegotiationProvider = ({ children }) => {
  const [leads, setLeads] = useState(() => {
    const saved = syncStore.getStoredLeads();
    return saved || initialLeads;
  });
  const [activeLeadId, setActiveLeadId] = useState(initialLeads[0].id);
  const [workerProfile, setWorkerProfile] = useState(mockWorkerProfile);
  const [workerStatus, setWorkerStatus] = useState('ONLINE'); // 'ONLINE' | 'BUSY' | 'OFFLINE'
  const [toasts, setToasts] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  
  // Modals
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [isCoopDetailsOpen, setIsCoopDetailsOpen] = useState(false);

  // Active lead
  const activeLead = leads.find((l) => l.id === activeLeadId) || leads[0] || initialLeads[0];

  // Save leads to local storage
  useEffect(() => {
    syncStore.saveStoredLeads(leads);
  }, [leads]);

  // SLA countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setLeads((prevLeads) =>
        prevLeads.map((lead) => ({
          ...lead,
          slaSecondsRemaining: Math.max(0, (lead.slaSecondsRemaining || 600) - 1),
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time Customer & System events over BroadcastChannel
  useEffect(() => {
    const unsubscribe = subscribeSyncEvent((event) => {
      if (!event || !event.type) return;

      if (event.type === syncEvents.CUSTOMER_OFFER) {
        const { workerId, leadId, amount, text, customerName } = event.payload || {};
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setLeads((prevLeads) => {
          let found = false;
          const updated = prevLeads.map((lead) => {
            if (lead.id === leadId || (workerId && lead.id.includes(workerId))) {
              found = true;
              return {
                ...lead,
                status: 'YOUR_TURN',
                financials: {
                  ...lead.financials,
                  currentPendingOffer: Number(amount),
                },
                thread: [
                  ...lead.thread.map((m) => ({ ...m, isPending: false })),
                  {
                    id: `cust-${Date.now()}`,
                    sender: 'CUSTOMER',
                    senderName: customerName || lead.customer?.name || 'Customer',
                    time: timeStr,
                    text: text || `Proposed rate: ₹${amount}`,
                    amount: Number(amount),
                    type: 'COUNTER',
                    isPending: true,
                  },
                ],
              };
            }
            return lead;
          });

          if (!found) {
            // New incoming customer lead
            const newLead = {
              id: leadId || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
              title: 'Customer On-Demand Service Request',
              category: 'Plumbing',
              categoryIcon: 'plumbing',
              distance: '1.5 km away',
              address: 'Customer Local Address',
              verified: true,
              urgency: 'HIGH PRIORITY',
              urgencyColor: 'secondary',
              slaSecondsRemaining: 900,
              acceptedByWorker: false,
              aiMode: 'COPILOT',
              aiDraft: `Hi! I can handle this service right away for ₹${amount}.`,
              customer: {
                name: customerName || 'Customer',
                rating: 4.9,
                reviewCount: 12,
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                joinedDate: 'Member',
                completedJobs: 5,
                verifiedPayment: true,
                escrowLocked: true,
              },
              jobScope: {
                summary: text || 'Doorstep on-demand service request.',
                preferredTiming: 'Immediate (Within 30 mins)',
                toolsRequired: ['Standard Toolset'],
                photos: [],
              },
              financials: {
                currentPendingOffer: Number(amount),
                customerInitialOffer: Number(amount),
                workerLastCounter: Number(amount) + 50,
                coopFeePercent: 3.0,
                estimatedMaterialCost: 40.0,
              },
              status: 'YOUR_TURN',
              thread: [
                {
                  id: `cust-${Date.now()}`,
                  sender: 'CUSTOMER',
                  senderName: customerName || 'Customer',
                  time: timeStr,
                  text: text || `New service offer: ₹${amount}`,
                  amount: Number(amount),
                  type: 'OFFER',
                  isPending: true,
                },
              ],
            };
            return [newLead, ...prevLeads];
          }
          return updated;
        });

        addToast('New Customer Offer!', `${customerName || 'Customer'} offered ₹${amount}. It's your turn!`, 'info');
      }

      if (event.type === syncEvents.OFFER_ACCEPTED) {
        const { leadId, agreedPrice } = event.payload || {};
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: 'ACCEPTED', acceptedByWorker: true } : l))
        );
        addToast('Deal Confirmed!', `Customer accepted ₹${agreedPrice || ''}! Booking is now confirmed.`, 'success');
      }
    });

    return () => unsubscribe();
  }, []);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Submit a counter offer
  const sendCounterOffer = async (amount, note = '', terms = {}) => {
    if (!amount || isNaN(amount) || amount <= 0) {
      addToast('Invalid Amount', 'Please enter a valid counter offer amount.', 'error');
      return false;
    }

    const numAmount = parseFloat(amount);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== activeLeadId) return lead;

        const updatedThread = [
          ...lead.thread.map((msg) => ({ ...msg, isPending: false })),
          {
            id: `counter-${Date.now()}`,
            sender: 'WORKER',
            senderName: `You (${workerProfile.name})`,
            time: timeStr,
            text: note.trim() || 'Counter offer with verified cooperative warranty.',
            amount: numAmount,
            type: 'COUNTER',
            terms: terms,
          },
        ];

        return {
          ...lead,
          status: 'CUSTOMER_TURN',
          financials: {
            ...lead.financials,
            workerLastCounter: numAmount,
          },
          thread: updatedThread,
        };
      })
    );

    // Call API & broadcast over cross-portal channel
    await workerApi.sendCounterOffer(activeLeadId, numAmount, note, terms);
    addToast('Counter Sent!', `Your counter offer of ₹${numAmount} was sent to ${activeLead.customer.name}.`, 'success');

    return true;
  };

  // Accept customer job
  const acceptOffer = async (leadId) => {
    const targetLead = leads.find((l) => l.id === leadId) || activeLead;
    const finalAmount = targetLead.financials.currentPendingOffer;

    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          status: 'ACCEPTED',
          acceptedByWorker: true,
          thread: [
            ...lead.thread.map((m) => ({ ...m, isPending: false })),
            {
              id: `accept-${Date.now()}`,
              sender: 'WORKER',
              senderName: `You (${workerProfile.name})`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: `Offer of ₹${finalAmount} accepted! Preparing tools and heading to your location.`,
              amount: finalAmount,
              type: 'ACCEPT',
            },
          ],
        };
      })
    );

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    await workerApi.acceptJobOffer(leadId, finalAmount);
    addToast('Job Confirmed!', `You accepted the offer of ₹${finalAmount}. Escrow is locked!`, 'success');
  };

  // Reject customer offer
  const rejectOffer = async (leadId, reason) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          status: 'REJECTED',
          thread: [
            ...lead.thread,
            {
              id: `reject-${Date.now()}`,
              sender: 'WORKER',
              senderName: `You (${workerProfile.name})`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: `Offer declined. Reason: ${reason || 'Schedule Conflict'}`,
              type: 'REJECT',
            },
          ],
        };
      })
    );

    await workerApi.rejectJobOffer(leadId, reason);
    addToast('Offer Declined', 'The offer has been rejected.', 'info');
  };

  // Toggle online/busy status
  const toggleWorkerStatus = (newStatus) => {
    setWorkerStatus(newStatus);
    workerApi.updateAvailability(newStatus);
    addToast('Status Updated', `You are now ${newStatus}.`, 'info');
  };

  const openPhotoLightbox = (photo) => {
    setActivePhoto(photo);
    setIsPhotoLightboxOpen(true);
  };

  const closePhotoLightbox = () => {
    setIsPhotoLightboxOpen(false);
    setActivePhoto(null);
  };

  return (
    <NegotiationContext.Provider
      value={{
        leads,
        activeLeadId,
        setActiveLeadId,
        activeLead,
        workerProfile,
        setWorkerProfile,
        workerStatus,
        toggleWorkerStatus,
        toasts,
        addToast,
        removeToast,
        darkMode,
        setDarkMode,
        sendCounterOffer,
        acceptOffer,
        rejectOffer,
        isAcceptModalOpen,
        setIsAcceptModalOpen,
        isRejectModalOpen,
        setIsRejectModalOpen,
        isPhotoLightboxOpen,
        activePhoto,
        openPhotoLightbox,
        closePhotoLightbox,
        isCoopDetailsOpen,
        setIsCoopDetailsOpen,
      }}
    >
      {children}
    </NegotiationContext.Provider>
  );
};

export const useNegotiation = () => {
  const context = useContext(NegotiationContext);
  if (!context) {
    throw new Error('useNegotiation must be used within a NegotiationProvider');
  }
  return context;
};
