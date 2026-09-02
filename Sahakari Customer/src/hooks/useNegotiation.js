import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useBooking } from './useBooking';
import { subscribeSyncEvent, syncEvents } from '../services/syncBridge';

export const useNegotiation = (workerId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [agreedAmount, setAgreedAmount] = useState(null);
  const [status, setStatus] = useState('ACTIVE'); // ACTIVE, ACCEPTED, REJECTED
  const { updateAgreedPrice } = useBooking();

  useEffect(() => {
    let isMounted = true;
    const fetchChat = async () => {
      try {
        setLoading(true);
        const chat = await api.getNegotiationChat(workerId);
        if (isMounted) {
          setMessages(chat);
          const latestOffer = [...chat].reverse().find((m) => m.amount);
          if (latestOffer) {
            setAgreedAmount(latestOffer.amount);
          }
        }
      } catch (err) {
        console.error('Failed to load chat', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChat();

    // Subscribe to real-time events from Worker Portal
    const unsubscribe = subscribeSyncEvent((event) => {
      if (!isMounted || !event) return;

      if (event.type === syncEvents.WORKER_COUNTER) {
        const { workerMsg, agreedAmount: newAmount } = event.payload || {};
        if (workerMsg) {
          setMessages((prev) => [...prev, workerMsg]);
          if (newAmount) {
            setAgreedAmount(newAmount);
            updateAgreedPrice(newAmount);
          }
        }
      }

      if (event.type === syncEvents.OFFER_ACCEPTED) {
        setStatus('ACCEPTED');
        if (event.payload?.agreedPrice) {
          setAgreedAmount(event.payload.agreedPrice);
          updateAgreedPrice(event.payload.agreedPrice);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [workerId]);

  const sendCounter = async (amount, customText = '') => {
    try {
      setSending(true);
      const { userMsg, workerMsg } = await api.sendCounterOffer(workerId, amount, customText);
      
      setMessages((prev) => [...prev, userMsg]);

      // Add slight worker typing delay for natural chat interaction
      setTimeout(() => {
        setMessages((prev) => [...prev, workerMsg]);
        if (workerMsg.type === 'accepted') {
          setStatus('ACCEPTED');
          setAgreedAmount(amount);
          updateAgreedPrice(amount);
        } else if (workerMsg.amount) {
          setAgreedAmount(workerMsg.amount);
          updateAgreedPrice(workerMsg.amount);
        }
        setSending(false);
      }, 1000);
    } catch (err) {
      console.error('Error submitting counter offer', err);
      setSending(false);
    }
  };

  const acceptCurrentOffer = (amount) => {
    const finalPrice = amount || agreedAmount || 1500;
    setStatus('ACCEPTED');
    setAgreedAmount(finalPrice);
    updateAgreedPrice(finalPrice);
    return finalPrice;
  };

  return {
    messages,
    loading,
    sending,
    agreedAmount,
    status,
    sendCounter,
    acceptCurrentOffer,
  };
};
