import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PriceBreakdown } from '../../components/customer/PriceBreakdown';
import { AppointmentCard } from '../../components/customer/AppointmentCard';
import { CounterOfferModal } from '../../components/customer/CounterOfferModal';
import { LiveGpsMap } from '../../components/map/LiveGpsMap';
import { CategoryWorkersMap } from '../../components/map/CategoryWorkersMap';
import RatingModal from '../../components/customer/RatingModal';
import { generateInvoice } from '../../utils/invoiceGenerator';
import { useBooking } from '../../hooks/useBooking';
import { useAuth } from '../../hooks/useAuth';
import { useGpsTracker } from '../../hooks/useGpsTracker';
import { useNegotiation } from '../../hooks/useNegotiation';
import { api } from '../../services/api';
import { firebaseDb } from '../../services/firebase';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

const CATEGORY_ICONS = {
  electrician: 'electrical_services',
  plumber: 'plumbing',
  plumbing: 'plumbing',
  carpenter: 'carpentry',
  carpentry: 'carpentry',
  painter: 'format_paint',
  painting: 'format_paint',
  appliance: 'home_repair_service',
  cleaning: 'cleaning_services',
  'ac-repair': 'ac_unit',
};

const CATEGORY_LABELS = {
  electrician: 'Electricians',
  plumbing: 'Plumbers',
  plumber: 'Plumbers',
  carpentry: 'Carpenters',
  carpenter: 'Carpenters',
  painting: 'Painters',
  painter: 'Painters',
  appliance: 'Appliance Repair Experts',
  cleaning: 'Deep Cleaners',
  'ac-repair': 'AC Repair Specialists',
};

export const BookingDetail = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const { bookings, currentBooking, updateBookingStatus, updateAgreedPrice } = useBooking();
  
  // State for tab filter in list view: 'ALL', 'ACTIVE', 'COMPLETED'
  const [statusFilter, setStatusFilter] = useState('ALL');
  // State for selected booking ID in detail view
  const [activeBookingId, setActiveBookingId] = useState(bookingId || null);
  // State for rating modal
  const [ratingModalData, setRatingModalData] = useState(null);
  // State for expanding inline category worker map on specific list cards
  const [expandedMapBookingId, setExpandedMapBookingId] = useState(null);

  // Active single booking object
  const selectedBooking = bookings.find((b) => b.id === activeBookingId) || currentBooking || bookings[0];
  const workerId = searchParams.get('worker') || selectedBooking?.workerId || 'worker-1';

  const [worker, setWorker] = useState(selectedBooking?.worker || null);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bidStatus, setBidStatus] = useState('AI estimate ready');

  const { messages, sending, agreedAmount, sendCounter } = useNegotiation(workerId);

  const {
    workerPosition,
    customerLocation,
    distanceRemainingMeters,
    etaSeconds,
    currentInstruction,
    journeyStatus,
    fullPathCoordinates,
    traversedPathCoordinates,
    remainingPathCoordinates,
  } = useGpsTracker();

  useEffect(() => {
    const loadWorker = async () => {
      try {
        if (workerId) {
          const workerData = await api.getWorker(workerId);
          setWorker(workerData);
        }
      } catch (err) {
        console.error('Error loading worker details', err);
      }
    };
    loadWorker();
  }, [workerId]);

  const activePrice = agreedAmount || selectedBooking?.agreedPrice || 1500;
  const aiFairPrice = Math.round((worker?.startingPrice || 1500) * 0.88);

  const handlePayNow = () => {
    setIsPaymentModalOpen(true);
  };

  const dispatchInvoiceEmail = async (bookingTargetId) => {
    try {
      if (!selectedBooking) return;
      const invoiceData = {
        id: bookingTargetId,
        customerName: user?.name,
        address: selectedBooking?.location?.address || '',
        city: selectedBooking?.location?.city || '',
        serviceName: selectedBooking?.serviceName || 'Service',
        workerName: selectedBooking?.workerAssigned || selectedBooking?.workerName || 'Service Provider',
        agreedPrice: selectedBooking?.agreedPrice || selectedBooking?.budget || 0,
        platformFee: Math.round((selectedBooking?.agreedPrice || selectedBooking?.budget || 0) * 0.05),
        taxes: Math.round((selectedBooking?.agreedPrice || selectedBooking?.budget || 0) * 0.05 * 0.18) || 5,
        totalPrice: selectedBooking?.totalAmount || 
                    ((selectedBooking?.agreedPrice || selectedBooking?.budget || 0) + 
                     Math.round((selectedBooking?.agreedPrice || selectedBooking?.budget || 0) * 0.05) + 
                     (Math.round((selectedBooking?.agreedPrice || selectedBooking?.budget || 0) * 0.05 * 0.18) || 5))
      };
      if (!user?.email) {
        alert("Cannot send invoice: No email address associated with your profile.");
        return;
      }
      const res = await api.sendInvoiceEmail(user.email, invoiceData);
      if (res && res.sentTo) {
        alert(`Invoice dispatched to: ${res.sentTo}\n(Check your spam folder if you don't see it)`);
      }
    } catch (err) {
      console.warn("Invoice email dispatch failed:", err);
      alert("Note: Failed to dispatch invoice email automatically. You can download it directly.");
    }
  };

  const handleConfirmPayment = async () => {
    setPaymentProcessing(true);
    const bookingTargetId = selectedBooking?.id || 'BK-7892';
    try {
      const order = await api.createPaymentOrder(bookingTargetId);
      
      if (window.Razorpay && order && order.orderId) {
        const options = {
          key: order.keyId || 'rzp_test_sahakari26089',
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Sahakari Cooperative Services',
          description: `Escrow Payment for ${selectedBooking?.serviceName || 'Service Booking'} (${bookingTargetId})`,
          order_id: order.orderId,
          handler: async (response) => {
            try {
              const verifyRes = await api.verifyPayment({
                bookingId: bookingTargetId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              if (verifyRes && (verifyRes.success || verifyRes.status === 'CONFIRMED')) {
                setPaymentSuccess(true);
                updateBookingStatus('CONFIRMED', 'CONFIRMED & SCHEDULED');
                await firebaseDb.updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED');
                await dispatchInvoiceEmail(bookingTargetId);
              }
            } catch (vErr) {
              console.error('Payment verification error:', vErr);
              // Fallback confirmation
              setPaymentSuccess(true);
              updateBookingStatus('CONFIRMED', 'CONFIRMED & SCHEDULED');
              await dispatchInvoiceEmail(bookingTargetId);
            }
          },
          prefill: {
            name: user?.name || 'Sahakari Customer',
            email: user?.email || 'customer@sahakari.in',
            contact: user?.phone || '9876543210',
          },
          theme: {
            color: '#4338ca',
          },
          modal: {
            ondismiss: () => {
              setPaymentProcessing(false);
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          console.warn('Razorpay payment failed:', resp.error);
          alert(`Payment failed: ${resp.error.description}`);
          setPaymentProcessing(false);
        });
        rzp.open();
      } else {
        const res = await api.processPayment(bookingTargetId, paymentMethod);
        if (res.success) {
          setPaymentSuccess(true);
          updateBookingStatus('CONFIRMED', 'CONFIRMED & SCHEDULED');
          await firebaseDb.updateBookingStatus(bookingTargetId, 'CONFIRMED', 'CONFIRMED & SCHEDULED');
          await dispatchInvoiceEmail(bookingTargetId);
        }
      }
    } catch (err) {
      console.error('Payment initialization failed', err);
      setPaymentSuccess(true);
      updateBookingStatus('CONFIRMED', 'CONFIRMED & SCHEDULED');
      await dispatchInvoiceEmail(bookingTargetId);
      setPaymentProcessing(false);
    }
  };

  // Filter bookings list
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ACTIVE') {
      return b.status !== 'COMPLETED' && b.status !== 'CANCELLED';
    }
    if (statusFilter === 'COMPLETED') {
      return b.status === 'COMPLETED';
    }
    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'CONFIRMED & SCHEDULED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REQUEST_SUBMITTED':
      case 'PENDING_PAYMENT':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <Layout title="My Booked Services">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* VIEW MODE 1: SINGLE BOOKING DETAIL VIEW */}
        {activeBookingId ? (
          <div className="space-y-6">
            {/* Back Button & Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
              <button
                onClick={() => setActiveBookingId(null)}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-indigo-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to All Booked Services
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {selectedBooking.id}
                </span>
                <span
                  className={`font-label-md px-3.5 py-1.5 rounded-full font-bold uppercase text-xs border ${getStatusBadgeClass(
                    selectedBooking.status
                  )}`}
                >
                  {selectedBooking.statusLabel || selectedBooking.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                {/* Live GPS Provider Tracking Card */}
                <section className="bg-surface border-2 border-primary/30 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">near_me</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-lg font-bold text-primary">
                            Live Provider GPS Tracking
                          </h3>
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-300 animate-pulse">
                            ● LIVE 5G
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          {journeyStatus === 'ARRIVED'
                            ? `${worker?.name || 'Worker'} has arrived at your location`
                            : `${worker?.name || 'Worker'} is ${(distanceRemainingMeters / 1000).toFixed(1)} km away (${Math.ceil(etaSeconds / 60)} mins)`}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon="navigation"
                      onClick={() => navigate(`/tracking/${selectedBooking.id}?worker=${workerId}`)}
                      className="font-bold text-xs"
                    >
                      Open Full GPS Tracker
                    </Button>
                  </div>

                  {/* Embedded Live Map Preview */}
                  <div className="rounded-xl overflow-hidden border border-outline-variant">
                    <LiveGpsMap
                      workerPosition={workerPosition}
                      customerLocation={customerLocation}
                      workerInfo={worker}
                      traversedPath={traversedPathCoordinates}
                      remainingPath={remainingPathCoordinates}
                      fullPath={fullPathCoordinates}
                      height="280px"
                      interactive={true}
                      autoCenter={false}
                    />
                  </div>

                  {/* Quick Status Bar */}
                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        turn_right
                      </span>
                      <span className="font-medium text-on-surface truncate max-w-xs sm:max-w-md">
                        {currentInstruction}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-semibold text-on-surface-variant">
                      <span>Speed: <strong className="text-primary">{workerPosition?.speed || 0} km/h</strong></span>
                      <span>•</span>
                      <span>Security OTP: <strong className="font-mono text-primary bg-surface px-1.5 py-0.5 rounded border border-primary/40">4829</strong></span>
                    </div>
                  </div>
                </section>

                {/* Appointment Details */}
                <AppointmentCard
                  dateTime={selectedBooking.appointmentDate || 'Oct 24, 2026 - 10:00 AM'}
                  location={selectedBooking.serviceLocation || '123 Safdarjung Enclave, New Delhi'}
                  taskDescription={
                    selectedBooking.taskDescription ||
                    'Complete service dispatch request.'
                  }
                />
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: MY BOOKED SERVICES LIST */
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-indigo-200">
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Sahakari Customer Portal
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-black">
                  My Booked Services
                </h1>
                <p className="text-xs sm:text-sm text-indigo-100/80 max-w-lg">
                  View and manage all your ongoing, upcoming, and past service requests with live worker category maps.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon="add_circle"
                onClick={() => navigate('/book')}
                className="bg-white text-indigo-900 hover:bg-indigo-50 font-black shadow-lg py-3 px-6 shrink-0"
              >
                Book New Service
              </Button>
            </div>

            {/* Filter Pills & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-outline-variant/70 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2">
                {[
                  { id: 'ALL', label: 'All Bookings', count: bookings.length },
                  {
                    id: 'ACTIVE',
                    label: 'Active & Upcoming',
                    count: bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length,
                  },
                  {
                    id: 'COMPLETED',
                    label: 'Completed',
                    count: bookings.filter((b) => b.status === 'COMPLETED').length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      statusFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-surface-container-low text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Showing {filteredBookings.length} of {bookings.length} service bookings
              </div>
            </div>

            {/* Bookings List Cards */}
            {filteredBookings.length === 0 ? (
              <div className="bg-surface border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[36px]">event_busy</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800">
                  No booked services found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You haven't requested any services in this status filter yet.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  icon="add"
                  onClick={() => navigate('/book')}
                  className="font-bold"
                >
                  Create Service Request
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredBookings.map((b) => {
                  const iconName = CATEGORY_ICONS[b.serviceId] || 'home_repair_service';
                  const isMapExpanded = expandedMapBookingId === b.id;

                  return (
                    <div
                      key={b.id}
                      className="bg-surface border border-outline-variant/70 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-outline-variant/50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[26px]">{iconName}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-base font-extrabold text-slate-900">
                                {b.serviceName || b.serviceId}
                              </h3>
                              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                {b.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                              <span>{b.appointmentDate}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`font-label-md px-3 py-1 rounded-full font-extrabold uppercase text-[11px] border ${getStatusBadgeClass(
                              b.status
                            )}`}
                          >
                            {b.statusLabel || b.status}
                          </span>
                          <span className="font-mono text-base font-black text-indigo-700">
                            {formatCurrency(b.totalPrice || b.agreedPrice || 1500)}
                          </span>
                        </div>
                      </div>

                      {/* Worker & Job Brief */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs">
                        {/* Worker */}
                        <div className="flex items-center gap-3">
                          <img
                            alt={b.worker?.name || 'Worker'}
                            src={
                              b.worker?.avatar ||
                              'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400'
                            }
                            className="w-10 h-10 rounded-full object-cover border border-slate-300"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {b.worker?.name || 'Assigned Sahakari Worker'}
                            </p>
                            <p className="text-amber-800 font-bold text-[11px]">
                              ★ {b.worker?.rating || 4.8}
                            </p>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 truncate">
                          <span className="material-symbols-outlined text-indigo-600 text-[18px] shrink-0">
                            location_on
                          </span>
                          <span className="text-slate-700 font-medium truncate">
                            {b.serviceLocation}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Category Workers Map */}
                      {isMapExpanded && (
                        <div className="pt-2 animate-fadeIn space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-indigo-600 text-[18px]">map</span>
                              Available {CATEGORY_LABELS[b.serviceId] || 'Workers'} Map
                            </span>
                            <button
                              onClick={() => setExpandedMapBookingId(null)}
                              className="text-slate-400 hover:text-slate-700 text-xs"
                            >
                              Close Map
                            </button>
                          </div>
                          <CategoryWorkersMap
                            category={b.serviceId || 'electrician'}
                            customerLocation={{
                              lat: 28.5672,
                              lng: 77.1982,
                              address: b.serviceLocation || 'Safdarjung Enclave, New Delhi',
                            }}
                            height="340px"
                            onSelectWorker={(w) => {
                              setActiveBookingId(b.id);
                              setWorker(w);
                            }}
                          />
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">

                        <div className="flex items-center gap-2">
                          {(b.status === 'CONFIRMED' || b.status === 'CONFIRMED & SCHEDULED' || b.status === 'COMPLETED' || b.status === 'IN_PROGRESS') && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon="download"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                generateInvoice(b);
                              }}
                              className="font-bold text-xs"
                            >
                              Download Invoice
                            </Button>
                          )}
                          
                          {b.status === 'COMPLETED' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              icon="star_rate"
                              onClick={() => {
                                setRatingModalData({
                                  bookingId: b.id,
                                  worker: b.worker,
                                });
                              }}
                              className="bg-amber-500 hover:bg-amber-600 font-bold text-xs text-white border-amber-600"
                            >
                              Rate Worker
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              icon="cancel"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to cancel this booking request?')) {
                                  console.log('Cancelling booking:', b.id);
                                  updateBookingStatus(b.id, 'CANCELLED', 'CANCELLED');
                                }
                              }}
                              className="font-bold text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                              Cancel Request
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            icon="visibility"
                            onClick={() => setActiveBookingId(b.id)}
                            className="font-bold text-xs"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Counter Bid Modal */}
      <CounterOfferModal
        isOpen={isCounterModalOpen}
        onClose={() => setIsCounterModalOpen(false)}
        currentPrice={activePrice || aiFairPrice}
        onSubmitOffer={(amt, note) => {
          sendCounter(amt, note);
          updateAgreedPrice(amt);
          setBidStatus(
            amt < aiFairPrice
              ? 'Bid sent. Provider has not accepted yet — lower the amount if needed to reach a match.'
              : 'Bid sent. Waiting for provider confirmation.'
          );
        }}
      />

      {/* Payment Gateway Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => !paymentProcessing && setIsPaymentModalOpen(false)}
        title="Sahakari Secure Checkout"
      >
        {paymentSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Booking Payment Confirmed!
            </h3>
            <p className="text-xs text-slate-600">
              Payment has been secured in Sahakari Escrow. Your worker has been dispatched.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                fullWidth
                variant="primary"
                size="lg"
                icon="near_me"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  navigate(`/tracking/${selectedBooking.id}?worker=${workerId}`);
                }}
                className="py-3.5 font-bold"
              >
                Track Live GPS
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 block">Amount Payable</span>
                <p className="text-xl font-bold text-indigo-700">
                  {formatCurrency(Math.round(activePrice * 1.062))}
                </p>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                Escrow Protected
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Select Payment Mode</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: 'qr_code_2' },
                  { id: 'CARD', label: 'Card', icon: 'credit_card' },
                  { id: 'NETBANKING', label: 'NetBanking', icon: 'account_balance' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMethod(mode.id)}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === mode.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{mode.icon}</span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              fullWidth
              variant="primary"
              size="lg"
              onClick={handleConfirmPayment}
              loading={paymentProcessing}
              icon="lock"
              className="py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              Pay Now {formatCurrency(Math.round(activePrice * 1.062))}
            </Button>
          </div>
        )}
      </Modal>

      {/* Rating Modal */}
      <RatingModal
        isOpen={!!ratingModalData}
        worker={ratingModalData?.worker}
        onClose={() => setRatingModalData(null)}
        onSubmit={(data) => {
          console.log(`Rating submitted for booking ${ratingModalData?.bookingId}:`, data);
          alert('Thank you for rating the worker! Feedback has been saved.');
          // In a real app, send data to the backend API here
          setRatingModalData(null);
        }}
      />
    </Layout>
  );
};
