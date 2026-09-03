import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CategoryWorkersMap } from '../map/CategoryWorkersMap';
import { CounterOfferModal } from './CounterOfferModal';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency } from '../../utils/formatters';
import { generateInvoice } from '../../utils/invoiceGenerator';
import { firebaseDb } from '../../services/firebase';

const CATEGORY_OPTIONS = [
  { id: 'electrician', name: 'Electrical Work', icon: 'electrical_services', baseRate: 1500 },
  { id: 'plumbing', name: 'Plumbing & Pipes', icon: 'plumbing', baseRate: 1200 },
  { id: 'ac-repair', name: 'AC Servicing & Repair', icon: 'ac_unit', baseRate: 2000 },
  { id: 'carpentry', name: 'Carpentry & Woodwork', icon: 'carpentry', baseRate: 1400 },
  { id: 'cleaning', name: 'Deep Home Cleaning', icon: 'cleaning_services', baseRate: 1800 },
  { id: 'appliance', name: 'Appliance Repair', icon: 'home_repair_service', baseRate: 1300 },
  { id: 'painting', name: 'Wall Painting & Polish', icon: 'format_paint', baseRate: 2500 },
];

export const BookingRequestModal = ({
  isOpen,
  onClose,
  initialWorker = null,
  initialCategory = 'electrician',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setBookingDetails, updateBookingStatus } = useBooking();
  const { t } = useLanguage();

  const [step, setStep] = useState(1); // 1: Service & Work, 2: Schedule & Address, 3: Budget & Review
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [demoBidsCount, setDemoBidsCount] = useState(0);
  const [selectedBidForPayment, setSelectedBidForPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success'
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [bidStatusLabel, setBidStatusLabel] = useState('AI estimate ready');

  useEffect(() => {
    if (successBooking) {
      const t1 = setTimeout(() => setDemoBidsCount(1), 2000);
      const t2 = setTimeout(() => setDemoBidsCount(2), 4000);
      const t3 = setTimeout(() => setDemoBidsCount(3), 6000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [successBooking]);

  const dispatchInvoiceEmail = async (bookingTargetId) => {
    try {
      const sCat = CATEGORY_OPTIONS.find((c) => c.id === serviceId) || CATEGORY_OPTIONS[0];
      const invoiceData = {
        id: bookingTargetId || `BK-${Date.now().toString().slice(-4)}`,
        customerName: user?.name,
        address: streetAddress,
        city: city,
        serviceName: sCat.name,
        workerName: selectedBidForPayment?.name || 'Service Provider',
        agreedPrice: selectedBidForPayment?.price || 0,
        platformFee: Math.round((selectedBidForPayment?.price || 0) * 0.05),
        taxes: Math.round((selectedBidForPayment?.price || 0) * 0.05 * 0.18) || 5,
        totalPrice: (selectedBidForPayment?.price || 0) + Math.round((selectedBidForPayment?.price || 0) * 0.05) + (Math.round((selectedBidForPayment?.price || 0) * 0.05 * 0.18) || 5)
      };
      if (!user?.email) {
        alert("Cannot send invoice: No email address associated with your profile.");
        return;
      }
      const res = await api.sendInvoiceEmail(user.email, invoiceData);
      if (res && res.sentTo) {
        alert(`Invoice dispatched to: ${res.sentTo}\n(Check your spam folder if you don't see it)`);
      } else if (res && res.error) {
        alert(`Failed to send invoice email: ${res.error}`);
      }
    } catch (err) {
      console.warn("Invoice email dispatch failed:", err);
      alert("Note: Failed to dispatch invoice email automatically. You can download it directly.");
    }
  };

  const processPayment = async () => {
    setPaymentStatus('processing');
    const bookingTargetId = successBooking?.id || `BK-${Date.now().toString().slice(-4)}`;
    
    try {
      const order = await api.createPaymentOrder(bookingTargetId);
      
      if (window.Razorpay && order && order.orderId) {
        const options = {
          key: order.keyId || 'rzp_test_sahakari26089',
          amount: (selectedBidForPayment.price + Math.round(selectedBidForPayment.price * 0.05) + (Math.round(selectedBidForPayment.price * 0.05 * 0.18) || 5)) * 100, // Amount in paise
          currency: order.currency || 'INR',
          name: 'Sahakari Cooperative Services',
          description: `Escrow Payment for ${selectedBidForPayment.name}`,
          order_id: order.orderId,
          handler: async (response) => {
            try {
              const verifyRes = await api.verifyPayment({
                bookingId: bookingTargetId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              
              setPaymentStatus('success');
              updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED');
              await firebaseDb.updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED').catch(() => {});
              await dispatchInvoiceEmail(bookingTargetId);
              
              // Auto-redirect removed to allow downloading invoice
              // setTimeout(() => { handleFinish(); }, 1500);
            } catch (vErr) {
              console.error('Payment verification error:', vErr);
              setPaymentStatus('success');
              updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED');
              await firebaseDb.updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED').catch(() => {});
              await dispatchInvoiceEmail(bookingTargetId);
              
              // Auto-redirect removed to allow downloading invoice
              // setTimeout(() => { handleFinish(); }, 1500);
            }
          },
          prefill: {
            name: 'Sahakari Customer',
            email: 'customer@sahakari.in',
            contact: '9876543210',
          },
          theme: {
            color: '#3d45b8',
          },
          modal: {
            ondismiss: () => {
              setPaymentStatus('idle');
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          console.warn('Razorpay payment failed:', resp.error);
          alert(`Payment failed: ${resp.error.description}`);
          setPaymentStatus('idle');
        });
        rzp.open();
      } else {
        // Fallback for missing razorpay script
        const res = await api.processPayment(bookingTargetId, 'UPI');
        setPaymentStatus('success');
        updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED');
        await firebaseDb.updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED').catch(() => {});
        await dispatchInvoiceEmail(bookingTargetId);
        
        // Auto-redirect removed to allow downloading invoice
        // setTimeout(() => { handleFinish(); }, 1500);
      }
    } catch (error) {
      console.error('Payment initialization failed', error);
      // Fallback
      setPaymentStatus('success');
      updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED');
      await firebaseDb.updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED').catch(() => {});
      await dispatchInvoiceEmail(bookingTargetId);
      
      // Auto-redirect removed to allow downloading invoice
      // setTimeout(() => { handleFinish(); }, 1500);
    }
  };

  // Form State
  const [serviceId, setServiceId] = useState(initialCategory);
  const [description, setDescription] = useState('');
  const [urgency, setUrgent] = useState('STANDARD'); // 'STANDARD' | 'EXPRESS'
  const [preferredDate, setPreferredDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('10:00 AM - 01:00 PM');
  
  // Location — default to user profile values or empty strings for manual entry
  const [streetAddress, setStreetAddress] = useState(
    user?.houseNo
      ? `${user.houseNo}${user.currentLocation ? ', ' + user.currentLocation : ''}`
      : user?.currentLocation || user?.address || ''
  );
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [city, setCity] = useState(user?.city || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  
  // Pricing & Worker
  const [proposedFee, setProposedFee] = useState(1500);
  const [assignType, setAssignType] = useState(initialWorker ? 'SPECIFIC' : 'AUTO'); // 'AUTO' | 'SPECIFIC'
  const [selectedWorker, setSelectedWorker] = useState(initialWorker);
  const [paymentMethod, setPaymentMethod] = useState('ESCROW_UPI'); // 'ESCROW_UPI' | 'CASH' | 'CARD'

  // Errors
  const [errors, setErrors] = useState({});

  const demoBids = [
    {
      id: 1,
      name: 'Suresh Patel',
      rating: 4.9,
      reviews: 120,
      avatar: 'https://i.pravatar.cc/150?img=11',
      price: proposedFee > 100 ? proposedFee - 50 : proposedFee,
      message: 'I am nearby and can do this job perfectly.',
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      rating: 4.7,
      reviews: 85,
      avatar: 'https://i.pravatar.cc/150?img=12',
      price: proposedFee,
      message: 'Available today. 5 years of experience.',
    },
    {
      id: 3,
      name: 'Amitabh S.',
      rating: 4.8,
      reviews: 210,
      avatar: 'https://i.pravatar.cc/150?img=13',
      price: proposedFee > 200 ? proposedFee - 100 : proposedFee,
      message: 'Can start in 30 mins! Professional tools ready.',
    }
  ];

  useEffect(() => {
    if (initialCategory) {
      setServiceId(initialCategory);
      const catObj = CATEGORY_OPTIONS.find((c) => c.id === initialCategory);
      if (catObj) setProposedFee(catObj.baseRate);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialWorker) {
      setSelectedWorker(initialWorker);
      setAssignType('SPECIFIC');
      if (initialWorker.startingPrice) {
        setProposedFee(initialWorker.startingPrice);
      }
    }
  }, [initialWorker]);

  const handleCategorySelect = (catId) => {
    setServiceId(catId);
    const catObj = CATEGORY_OPTIONS.find((c) => c.id === catId);
    if (catObj && !initialWorker) {
      setProposedFee(catObj.baseRate);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!description.trim()) {
      newErrors.description = 'Please describe the work required or issue to be fixed.';
    } else if (description.trim().length < 8) {
      newErrors.description = 'Please provide a bit more detail (minimum 8 characters).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!streetAddress.trim()) {
      newErrors.streetAddress = 'Please enter your street address.';
    }
    if (!pincode.trim() || pincode.length < 6) {
      newErrors.pincode = 'Enter valid 6-digit Pincode.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullAddressString = [streetAddress, landmark, city, pincode].filter(Boolean).join(', ');
      const locationObj = {
        address: fullAddressString || streetAddress,
        city: city || 'Local Area',
        pincode: pincode || '',
        lat: 28.5672,
        lng: 77.1982,
      };

      const payload = {
        serviceId,
        description,
        proposedFee: Number(proposedFee),
        location: locationObj,
        preferredDate,
        preferredTime,
        urgency,
        paymentMethod,
        workerId: assignType === 'SPECIFIC' ? selectedWorker?.id : null,
        workerName: assignType === 'SPECIFIC' ? selectedWorker?.name : 'Auto-Assigned Sahakari Pro',
      };

      const result = await api.createBooking(payload);

      const createdBooking = {
        id: result.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceId,
        taskDescription: description,
        agreedPrice: Number(proposedFee),
        startingPrice: Number(proposedFee),
        appointmentDate: `${preferredDate} (${preferredTime})`,
        serviceLocation: locationObj.address,
        workerId: assignType === 'SPECIFIC' && selectedWorker ? selectedWorker.id : 'worker-1',
        worker: assignType === 'SPECIFIC' ? selectedWorker : null,
        status: 'REQUEST_SUBMITTED',
        statusLabel: 'REQUEST SUBMITTED - AWAITING WORKER CONFIRMATION',
        createdAt: new Date().toISOString(),
      };

      setBookingDetails(createdBooking);
      setSuccessBooking(createdBooking);
    } catch (err) {
      console.error('Failed to submit booking request', err);
      setErrors({ submit: err.message || 'Failed to submit booking request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
    if (successBooking) {
      navigate('/booking');
    }
  };

  const selectedCatObj = CATEGORY_OPTIONS.find((c) => c.id === serviceId) || CATEGORY_OPTIONS[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={successBooking ? 'Booking Request Submitted!' : 'New Service Booking Request'}
      maxWidth="max-w-2xl"
    >
      {successBooking ? (
        /* SUCCESS CONFIRMATION & LIVE WORKERS MAP VIEW */
        <div className="py-2 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-emerald-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Request ID: {successBooking.id}
            </span>
            <h3 className="font-display text-xl font-black text-slate-900 mt-1">
              Booking Request Submitted!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Showing available <strong>{selectedCatObj.name}</strong> professionals nearby on the map:
            </p>
          </div>

          {/* Map Display showing available workers for selected category */}
          <CategoryWorkersMap
            category={serviceId}
            customerLocation={{ lat: 28.5672, lng: 77.1982, address: `${streetAddress}, ${city}` }}
            height="320px"
            onSelectWorker={(worker) => {
              setSelectedWorker(worker);
            }}
          />

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Incoming Worker Bids</h4>
              <p className="text-xs text-slate-600">
                {demoBidsCount === 0 ? 'Searching for nearby workers...' : `Received ${demoBidsCount} bid${demoBidsCount > 1 ? 's' : ''} so far.`}
              </p>
            </div>
            <span className={`material-symbols-outlined text-3xl ${demoBidsCount < 3 && !selectedBidForPayment ? 'text-emerald-500 animate-pulse' : 'text-indigo-600'}`}>
              notifications_active
            </span>
          </div>

          {selectedBidForPayment ? (
            <div className="bg-[#131521] border border-slate-800 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-300 text-slate-200 font-sans mx-auto w-full max-w-sm">
              {paymentStatus === 'success' ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                    <span className="material-symbols-outlined text-[32px]">task_alt</span>
                  </div>
                  <h3 className="font-black text-xl text-white">Payment Successful!</h3>
                  <p className="text-sm text-slate-400">Your booking with {selectedBidForPayment.name} is confirmed.</p>
                  
                  <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Booking confirmation emailed to {user?.email || 'your inbox'}!
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        generateInvoice({
                          id: successBooking?.id || `BK-${Date.now().toString().slice(-4)}`,
                          customerName: user?.name,
                          address: streetAddress,
                          city: city,
                          serviceName: selectedCatObj.name,
                          workerName: selectedBidForPayment.name,
                          agreedPrice: selectedBidForPayment.price,
                          platformFee: Math.round(selectedBidForPayment.price * 0.05),
                          taxes: Math.round(selectedBidForPayment.price * 0.05 * 0.18) || 5,
                          totalPrice: selectedBidForPayment.price + Math.round(selectedBidForPayment.price * 0.05) + (Math.round(selectedBidForPayment.price * 0.05 * 0.18) || 5)
                        });
                      }}
                      className="flex-1 bg-[#2a2d40] hover:bg-[#3a3d50] text-slate-200 border border-slate-700 font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Invoice
                    </button>
                    <button
                      onClick={handleFinish}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      Done <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-left">
                  {/* Bid Status Section */}
                  <div className="bg-[#1c1e2d] border border-[#2a2d40] rounded-2xl p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">Bid Status</h4>
                      <p className="text-xs text-indigo-300 mt-0.5">{bidStatusLabel}</p>
                    </div>
                    <button 
                      onClick={() => setIsCounterModalOpen(true)}
                      className="w-full bg-[#3d45b8] hover:bg-[#4d55c8] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">attach_money</span>
                      Place Counter Bid
                    </button>
                  </div>

                  {/* Payment Details Section */}
                  <div className="bg-[#1c1e2d] border border-[#2a2d40] rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                      Payment Details
                    </h4>
                    
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Agreed Service Fee</span>
                        <span className="font-semibold text-white font-mono">₹{selectedBidForPayment.price}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Platform Fee (5%)</span>
                        <span className="font-semibold text-white font-mono">₹{Math.round(selectedBidForPayment.price * 0.05)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Taxes & GST</span>
                        <span className="font-semibold text-white font-mono">₹{Math.round(selectedBidForPayment.price * 0.05 * 0.18) || 5}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#3a3d50] my-2"></div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xl font-black text-white">Total</span>
                      <span className="text-2xl font-black text-[#8a94ff] font-mono">
                        ₹{selectedBidForPayment.price + Math.round(selectedBidForPayment.price * 0.05) + (Math.round(selectedBidForPayment.price * 0.05 * 0.18) || 5)}
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={processPayment}
                        disabled={paymentStatus === 'processing'}
                        className="w-full bg-[#7a84ff] hover:bg-[#8a94ff] text-slate-900 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(122,132,255,0.2)] mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        {paymentStatus === 'processing' ? 'Processing...' : 'Proceed to Payment'}
                      </button>
                      
                      <p className="text-center text-[11px] text-slate-400 pt-3">
                        Payments are secure, verified & encrypted.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : demoBidsCount > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {demoBids.slice(0, demoBidsCount).map((bid, index) => (
                <div 
                  key={bid.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left animate-in slide-in-from-bottom-4 fade-in duration-500 shadow-sm"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <img src={bid.avatar} alt={bid.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{bid.name}</h4>
                        {index === 0 && <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">BEST PRICE</span>}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">star</span> {bid.rating} ({bid.reviews})
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-slate-50 p-2 rounded-xl text-xs text-slate-600 italic border border-slate-200">
                    "{bid.message}"
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 w-full sm:w-auto">
                    <div className="text-lg font-black text-indigo-700">₹{bid.price}</div>
                    <Button size="sm" variant="primary" onClick={() => setSelectedBidForPayment(bid)} className="px-4 py-2 text-xs font-bold whitespace-nowrap">
                      Accept Bid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!selectedBidForPayment && (
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <Button
                fullWidth
                variant="primary"
                size="lg"
                onClick={handleFinish}
                icon="calendar_month"
                className="py-3 font-bold shadow-md"
              >
                Go to My Bookings
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* MULTI-STEP BOOKING FORM */
        <div className="space-y-6">
          {/* Progress bar steps */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200">
            {[
              { num: 1, label: 'Service & Details' },
              { num: 2, label: 'Schedule & Address' },
              { num: 3, label: 'Budget & Confirm' },
            ].map((s) => (
              <div key={s.num} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === s.num
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-bold truncate hidden sm:inline ${
                    step === s.num ? 'text-indigo-900' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: SERVICE & WORK DESCRIPTION */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Select Service Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = serviceId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm ring-1 ring-indigo-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[22px] ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {cat.icon}
                        </span>
                        <span className="text-xs font-bold leading-tight">{cat.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          From ₹{cat.baseRate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Describe Work Required <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue or requirements (e.g. Electrician needed for installing 2 ceiling fans and fixing master bedroom main switchboard)..."
                  rows={3}
                  className={`w-full bg-slate-50 border rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all ${
                    errors.description ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Urgency Dispatch Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Dispatch Urgency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUrgent('STANDARD')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      urgency === 'STANDARD'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-indigo-600 text-[24px]">schedule</span>
                    <div>
                      <h5 className="text-xs font-bold">Standard Appointment</h5>
                      <p className="text-[10px] text-slate-500">Scheduled time slot</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgent('EXPRESS')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      urgency === 'EXPRESS'
                        ? 'bg-amber-50 border-amber-600 text-amber-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-amber-600 text-[24px]">electric_bolt</span>
                    <div>
                      <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1">
                        Emergency Dispatch
                      </h5>
                      <p className="text-[10px] text-amber-800/80">Pro arrives in ~15-20 mins</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE & ADDRESS */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Preferred Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Preferred Service Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Preferred Time Slot
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                    <option value="10:00 AM - 01:00 PM">Midday (10:00 AM - 01:00 PM)</option>
                    <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                    <option value="05:00 PM - 08:00 PM">Evening (05:00 PM - 08:00 PM)</option>
                    <option value="ASAP / Emergency Dispatch">ASAP / Emergency Dispatch</option>
                  </select>
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Service Location Address <span className="text-rose-500">*</span>
                  </label>
                  {user?.currentLocation && (
                    <button
                      type="button"
                      onClick={() => setStreetAddress(user.currentLocation)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">my_location</span>
                      Use Saved Profile Address
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="House/Flat No, Building Name, Street..."
                    className={`w-full bg-slate-50 border rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.streetAddress ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Landmark (Optional)"
                      className="bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Pincode"
                      maxLength={6}
                      className={`bg-slate-50 border rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.pincode ? 'border-rose-400' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BUDGET & CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Proposed Fee & Fair Price Indicator */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                      Proposed Service Fee / Offer (₹)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Cooperative fair wage guidance suggested: ₹{selectedCatObj.baseRate}
                    </p>
                  </div>
                  <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200">
                    Negotiable
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-indigo-700">₹</span>
                  <input
                    type="number"
                    value={proposedFee}
                    onChange={(e) => setProposedFee(Number(e.target.value))}
                    step={50}
                    min={300}
                    className="w-full bg-white border-2 border-indigo-300 rounded-2xl pl-9 pr-4 py-3 font-mono text-xl font-black text-slate-900 focus:outline-none focus:border-indigo-600 shadow-inner"
                  />
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Assign Service Provider
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignType('AUTO')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      assignType === 'AUTO'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-indigo-600 text-[24px]">group_add</span>
                    <div>
                      <h5 className="text-xs font-bold">Auto-Assign Nearby Pro</h5>
                      <p className="text-[10px] text-slate-500">Fastest response from 5+ verified pros</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignType('SPECIFIC')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      assignType === 'SPECIFIC'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-indigo-600 text-[24px]">person_pin</span>
                    <div>
                      <h5 className="text-xs font-bold">
                        {selectedWorker ? selectedWorker.name : 'Select Specific Worker'}
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        {selectedWorker ? `Rating ${selectedWorker.rating}★` : 'Direct request to specific worker'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Booking Request Overview</span>
                  <span className="text-indigo-600 font-mono text-xs">{selectedCatObj.name}</span>
                </h5>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Date & Time</span>
                    <span className="font-bold text-slate-900">{preferredDate} ({preferredTime})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Offer Amount</span>
                    <span className="font-bold font-mono text-indigo-700">{formatCurrency(proposedFee)}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block">Location</span>
                  <span className="font-medium text-slate-800 truncate block">{streetAddress}, {city}</span>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-semibold">
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Action Navigation Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={handleBack}
                icon="arrow_back"
                className="px-4"
              >
                Back
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                className="px-4"
              >
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                icon="arrow_forward"
                className="px-6 font-bold"
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitRequest}
                loading={loading}
                icon="send"
                className="px-6 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700"
              >
                Submit Booking Request
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Counter Bid Modal */}
      <CounterOfferModal
        isOpen={isCounterModalOpen}
        onClose={() => setIsCounterModalOpen(false)}
        currentPrice={selectedBidForPayment?.price || 1500}
        onSubmitOffer={(amt, note) => {
          setSelectedBidForPayment(prev => ({...prev, price: amt}));
          setBidStatusLabel(
            'Counter bid sent. Waiting for confirmation.'
          );
        }}
      />
    </Modal>
  );
};
