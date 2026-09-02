import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialLeads, mockWorkerProfile } from '../data/mockLeads';
import { workerApi } from '../services/api';
import { subscribeSyncEvent, publishSyncEvent, syncEvents, syncStore } from '../services/syncBridge';
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
  const activeLead = leads.find((l) => l.id === activeLeadId) || leads[0];

  // SLA countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setLeads((prevLeads) =>
        prevLeads.map((lead) => ({
          ...lead,
          slaSecondsRemaining: Math.max(0, lead.slaSecondsRemaining - 1),
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Submit a counter offer
  const sendCounterOffer = (amount, note = '', terms = {}) => {
    if (!amount || isNaN(amount) || amount <= 0) {
      addToast('Invalid Amount', 'Please enter a valid counter offer amount.', 'error');
      return false;
    }

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
            text: note.trim() || 'Counter offer based on inspection and materials needed.',
            amount: parseFloat(amount),
            type: 'COUNTER',
            terms: terms
          },
        ];

        return {
          ...lead,
          status: 'CUSTOMER_TURN',
          financials: {
            ...lead.financials,
            workerLastCounter: parseFloat(amount),
          },
          thread: updatedThread,
        };
      })
    );

    addToast('Counter Sent!', `Your counter offer of $${parseFloat(amount).toFixed(2)} was sent to ${activeLead.customer.name}.`, 'success');
    
    // Simulate customer reaction after 4.5 seconds for live feel
    setTimeout(() => {
      simulateCustomerResponse(activeLeadId, parseFloat(amount));
    }, 4500);

    return true;
  };

  // Simulate customer response
  const simulateCustomerResponse = (leadId, lastWorkerCounter) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;
        if (lead.status === 'ACCEPTED' || lead.status === 'REJECTED') return lead;

        const baseAmount = lastWorkerCounter || lead.financials.currentPendingOffer;
        // Either accept worker's counter or offer slight adjustment
        const numMsg = lead.thread.length;
        const customerAccepts = numMsg >= 6 || Math.random() > 0.55;
        let newAmount = baseAmount;
        let responseText = `Sounds fair! Deal at $${baseAmount.toFixed(2)}. Looking forward to your arrival.`;
        let isOfferPending = false;
        let newStatus = 'ACCEPTED';

        if (!customerAccepts && baseAmount > 150) {
          newAmount = Math.max(140, Math.round((baseAmount - 15) / 5) * 5);
          responseText = `Can you do $${newAmount.toFixed(2)}? If yes, let's start immediately.`;
          isOfferPending = true;
          newStatus = 'YOUR_TURN';
        }

        const newMsg = {
          id: `cust-${Date.now()}`,
          sender: 'CUSTOMER',
          senderName: lead.customer.name,
          time: timeStr,
          text: responseText,
          amount: newAmount,
          type: customerAccepts ? 'ACCEPT' : 'COUNTER',
          isPending: isOfferPending,
        };

        const updatedThread = [...lead.thread, newMsg];

        // Generate next AI draft if it's the worker's turn
        let nextAiDraft = lead.aiDraft;
        let proposedAmount = newAmount + 10;
        if (newStatus === 'YOUR_TURN') {
          const counterProposed = Math.max(newAmount, Math.round((newAmount + (baseAmount - newAmount)/2) / 5) * 5);
          proposedAmount = counterProposed;
          nextAiDraft = `Hi ${lead.customer.name}! Suresh's AI agent here. We can meet in the middle at $${counterProposed.toFixed(2)}. This includes our cooperative safety backing and standard tooling checklist.`;
          
          // Autopilot check: if autopilot is active, trigger send autonomously after a brief delay
          if (lead.aiMode === 'AUTOPILOT') {
            setTimeout(() => {
              triggerAutopilotReply(leadId, nextAiDraft, counterProposed);
            }, 3000);
          }
        } else if (newStatus === 'ACCEPTED') {
          // Trigger celebration confetti
          setTimeout(() => {
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#012d1d', '#1b4332', '#ffca98', '#7d562d', '#c1ecd4']
              });
            } catch (e) {}
          }, 300);
        }

        return {
          ...lead,
          status: newStatus,
          financials: {
            ...lead.financials,
            currentPendingOffer: newAmount,
          },
          aiDraft: nextAiDraft,
          thread: updatedThread,
        };
      })
    );

    addToast('SMS Received', `New SMS reply from client.`, 'info');
  };

  // Trigger autopilot autonomous response
  const triggerAutopilotReply = (leadId, draftText, proposedAmount) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setLeads((prevLeads) =>
      prevLeads.map((l) => {
        if (l.id !== leadId) return l;
        if (l.status !== 'YOUR_TURN') return l;

        const updatedThread = [
          ...l.thread.map((msg) => ({ ...msg, isPending: false })),
          {
            id: `ai-auto-msg-${Date.now()}`,
            sender: 'WORKER',
            senderName: `AI Bot (Autopilot)`,
            time: timeStr,
            text: draftText,
            amount: proposedAmount,
            type: 'COUNTER',
            sentByAi: true,
          },
        ];

        return {
          ...l,
          status: 'CUSTOMER_TURN',
          aiDraft: "", // clear draft
          thread: updatedThread,
        };
      })
    );

    addToast('AI Autopilot Sent SMS', 'AI Negotiator replied autonomously.', 'success');

    // Simulate customer response again
    setTimeout(() => {
      simulateCustomerResponse(leadId, proposedAmount);
    }, 3500);
  };

  // Send AI-generated SMS
  const sendAiSms = (leadId, customDraft = null) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let finalDraft = "";
    let proposedAmount = 0;

    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;

        finalDraft = customDraft !== null ? customDraft : lead.aiDraft;
        proposedAmount = lead.financials.currentPendingOffer + 10;

        const updatedThread = [
          ...lead.thread.map((msg) => ({ ...msg, isPending: false })),
          {
            id: `ai-msg-${Date.now()}`,
            sender: 'WORKER',
            senderName: `AI Bot (Approved)`,
            time: timeStr,
            text: finalDraft || "Hi, Suresh's AI agent here. I've reviewed your request and will proceed with the details as agreed.",
            amount: proposedAmount,
            type: 'COUNTER',
            sentByAi: true,
          },
        ];

        return {
          ...lead,
          status: 'CUSTOMER_TURN',
          aiDraft: "",
          thread: updatedThread,
        };
      })
    );

    addToast('SMS Sent!', `AI Chatbot message sent to customer.`, 'success');

    // Simulate customer response after a delay
    setTimeout(() => {
      simulateCustomerResponse(leadId, proposedAmount);
    }, 3000);
  };

  // Accept a lead broadcast and activate AI bot
  const acceptLeadBroadcast = (leadId) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          acceptedByWorker: true,
          aiMode: 'COPILOT', // Default to Co-pilot mode on acceptance
        };
      })
    );
    addToast('Request Accepted!', 'Cooperative SMS channel opened. AI agent activated in Co-pilot mode.', 'success');
  };

  // Set lead AI negotiation mode
  const setLeadAiMode = (leadId, mode) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;

        // If switching to autopilot and it's currently YOUR_TURN, trigger the auto-reply
        if (mode === 'AUTOPILOT' && lead.status === 'YOUR_TURN' && lead.aiDraft) {
          const proposedAmount = lead.financials.currentPendingOffer + 10;
          const draftText = lead.aiDraft;
          setTimeout(() => {
            triggerAutopilotReply(leadId, draftText, proposedAmount);
          }, 1500);
        }

        return {
          ...lead,
          aiMode: mode,
        };
      })
    );
    addToast('AI Mode Updated', `AI Negotiator set to ${mode === 'AUTOPILOT' ? 'Autopilot 🤖' : mode === 'COPILOT' ? 'Co-pilot 👥' : 'Manual Mode 📴'}.`, 'info');
  };

  // Update lead AI draft message
  const updateLeadAiDraft = (leadId, draftText) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          aiDraft: draftText,
        };
      })
    );
  };

  // Accept customer pending offer
  const acceptOffer = (etaMinutes = 25) => {
    const pendingAmount = activeLead.financials.currentPendingOffer;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== activeLeadId) return lead;

        const updatedThread = [
          ...lead.thread.map((msg) => ({ ...msg, isPending: false })),
          {
            id: `accept-${Date.now()}`,
            sender: 'WORKER',
            senderName: `You (${workerProfile.name})`,
            time: timeStr,
            text: `Offer accepted for $${pendingAmount.toFixed(2)}! Dispatched and heading your way. Estimated ETA: ${etaMinutes} minutes.`,
            amount: pendingAmount,
            type: 'ACCEPT',
          },
        ];

        return {
          ...lead,
          status: 'ACCEPTED',
          thread: updatedThread,
        };
      })
    );

    // Update worker earnings today
    const netEarnings = pendingAmount * (1 - activeLead.financials.coopFeePercent / 100);
    setWorkerProfile((prev) => ({
      ...prev,
      todayEarnings: prev.todayEarnings + netEarnings,
      completedJobsToday: prev.completedJobsToday + 1,
    }));

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#012d1d', '#1b4332', '#ffca98', '#7d562d', '#c1ecd4']
      });
    } catch (e) {
      console.log(e);
    }

    addToast('Job Confirmed & Escrow Locked!', `You accepted $${pendingAmount.toFixed(2)}. Net payout: $${netEarnings.toFixed(2)}.`, 'success');
  };

  // Reject offer
  const rejectOffer = (reason = 'Scheduling conflict') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead.id !== activeLeadId) return lead;

        const updatedThread = [
          ...lead.thread.map((msg) => ({ ...msg, isPending: false })),
          {
            id: `reject-${Date.now()}`,
            sender: 'WORKER',
            senderName: `You (${workerProfile.name})`,
            time: timeStr,
            text: `Declined request: ${reason}. Thank you for reaching out to Sahakari.`,
            type: 'REJECT',
          },
        ];

        return {
          ...lead,
          status: 'REJECTED',
          thread: updatedThread,
        };
      })
    );

    addToast('Offer Declined', `You declined request ${activeLead.id}.`, 'error');
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
        activeLead,
        activeLeadId,
        setActiveLeadId,
        workerProfile,
        setWorkerProfile,
        workerStatus,
        setWorkerStatus,
        toasts,
        addToast,
        removeToast,
        darkMode,
        setDarkMode,
        sendCounterOffer,
        acceptOffer,
        rejectOffer,
        acceptLeadBroadcast,
        setLeadAiMode,
        updateLeadAiDraft,
        sendAiSms,
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
