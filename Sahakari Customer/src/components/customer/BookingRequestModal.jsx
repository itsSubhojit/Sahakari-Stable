import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CategoryWorkersMap } from '../map/CategoryWorkersMap';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency } from '../../utils/formatters';

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
  const { setBookingDetails } = useBooking();
  const { t } = useLanguage();

  const [step, setStep] = useState(1); // 1: Service & Work, 2: Schedule & Address, 3: Budget & Review
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);

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
      onClose();
      navigate(`/booking/${createdBooking.id}`);
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
      navigate(`/booking/${successBooking.id}`);
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

          {/* Request Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <span className="font-bold text-slate-900">{selectedCatObj.name}</span>
              <span className="font-mono font-black text-indigo-700 text-sm">
                {formatCurrency(proposedFee)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-indigo-600">event</span>
                <span>{preferredDate} ({preferredTime})</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[15px] text-indigo-600">location_on</span>
                <span className="truncate">{streetAddress}, {city}</span>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <Button
              fullWidth
              variant="primary"
              size="lg"
              onClick={handleFinish}
              icon="near_me"
              className="py-3 font-bold shadow-md"
            >
              Track Request & View Bids
            </Button>
          </div>
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
    </Modal>
  );
};
