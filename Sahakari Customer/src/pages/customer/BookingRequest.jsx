import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button';
import { CategoryWorkersMap } from '../../components/map/CategoryWorkersMap';
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

export const BookingRequest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setBookingDetails } = useBooking();
  const { t } = useLanguage();

  const categoryParam = searchParams.get('category') || 'electrician';
  const workerParam = searchParams.get('worker') || null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);

  // Form State
  const [serviceId, setServiceId] = useState(categoryParam);
  const [description, setDescription] = useState('');
  const [urgency, setUrgent] = useState('STANDARD');
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM - 01:00 PM');
  
  // Location
  const [streetAddress, setStreetAddress] = useState(user?.houseNo ? `${user.houseNo}, ${user.currentLocation}` : (user?.currentLocation || ''));
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [city, setCity] = useState(user?.city || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  
  // Pricing
  const [proposedFee, setProposedFee] = useState(1500);
  const [paymentMethod, setPaymentMethod] = useState('ESCROW_UPI');
  const [errors, setErrors] = useState({});

  const handleCategorySelect = (catId) => {
    setServiceId(catId);
    const catObj = CATEGORY_OPTIONS.find((c) => c.id === catId);
    if (catObj) setProposedFee(catObj.baseRate);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const locationObj = {
        address: `${streetAddress}, ${landmark ? landmark + ', ' : ''}${city} - ${pincode}`,
        city,
        pincode,
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
        workerId: workerParam,
      };

      const result = await api.createServiceRequest(payload);

      const createdBooking = {
        id: result.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceId,
        taskDescription: description,
        agreedPrice: Number(proposedFee),
        startingPrice: Number(proposedFee),
        appointmentDate: `${preferredDate} (${preferredTime})`,
        serviceLocation: locationObj.address,
        workerId: workerParam || 'worker-1',
        status: 'REQUEST_SUBMITTED',
        statusLabel: 'REQUEST SUBMITTED - AWAITING WORKER CONFIRMATION',
        createdAt: new Date().toISOString(),
      };

      setBookingDetails(createdBooking);
      navigate(`/booking/${createdBooking.id}`);
    } catch (err) {
      console.error('Failed to submit booking request', err);
      setErrors({ submit: err.message || 'Failed to submit booking request.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedCatObj = CATEGORY_OPTIONS.find((c) => c.id === serviceId) || CATEGORY_OPTIONS[0];

  return (
    <Layout title="Send Service Booking Request">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#0f172a] via-[#164e63] to-[#4f46e5] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-cyan-200">
            <span className="material-symbols-outlined text-[16px]">edit_document</span>
            Sahakari Cooperative Dispatch
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black">
            Book a Professional Service
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 max-w-xl">
            Fill up your job details below to send an instant booking request to verified local cooperative professionals.
          </p>
        </div>

        {/* Step Indicator Card */}
        <div className="bg-surface border border-outline-variant/70 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            {[
              { num: 1, label: '1. Service & Details' },
              { num: 2, label: '2. Schedule & Address' },
              { num: 3, label: '3. Budget & Submit' },
            ].map((s) => (
              <div key={s.num} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === s.num
                      ? 'bg-primary text-on-primary shadow-xs ring-4 ring-primary/20'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-xs font-bold truncate ${step === s.num ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Body Card */}
        <div className="bg-surface border border-outline-variant/70 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-3">
                  Select Category / Service Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = serviceId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col items-start gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-fixed/40 border-primary text-primary font-bold shadow-xs ring-1 ring-primary'
                            : 'bg-surface border-outline-variant/70 text-on-surface hover:border-primary/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px] text-primary">{cat.icon}</span>
                        <span className="text-xs font-bold leading-tight">{cat.name}</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">From ₹{cat.baseRate}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Describe Job Requirements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue or job requirements in detail..."
                  rows={4}
                  className={`w-full bg-surface border rounded-2xl p-4 text-xs text-on-surface focus:outline-none focus:border-primary shadow-inner ${
                    errors.description ? 'border-rose-400' : 'border-outline-variant'
                  }`}
                />
                {errors.description && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Urgency selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Urgency Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUrgent('STANDARD')}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      urgency === 'STANDARD'
                        ? 'bg-primary-fixed/30 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface border-outline-variant text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary text-[26px]">schedule</span>
                    <div>
                      <h4 className="text-xs font-bold">Standard Scheduled Service</h4>
                      <p className="text-[11px] text-on-surface-variant">Pick your preferred date & time slot</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgent('EXPRESS')}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      urgency === 'EXPRESS'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold shadow-xs'
                        : 'bg-surface border-outline-variant text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-amber-600 text-[26px]">electric_bolt</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">⚡ Emergency Express Dispatch</h4>
                      <p className="text-[11px] text-amber-800/80">Pro dispatched immediately (~15 min ETA)</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                    Preferred Service Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-surface border border-outline-variant rounded-2xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                    Preferred Time Slot
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-2xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                    <option value="10:00 AM - 01:00 PM">Midday (10:00 AM - 01:00 PM)</option>
                    <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                    <option value="05:00 PM - 08:00 PM">Evening (05:00 PM - 08:00 PM)</option>
                    <option value="ASAP / Emergency Dispatch">ASAP / Emergency Dispatch</option>
                  </select>
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                    Full Service Address <span className="text-rose-500">*</span>
                  </label>
                  {user?.currentLocation && (
                    <button
                      type="button"
                      onClick={() => setStreetAddress(user.currentLocation)}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">my_location</span>
                      Use Saved Profile Address
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House No, Flat, Street Address..."
                  className={`w-full bg-surface border rounded-2xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary ${
                    errors.streetAddress ? 'border-rose-400' : 'border-outline-variant'
                  }`}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Landmark"
                    className="bg-surface border border-outline-variant rounded-2xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="bg-surface border border-outline-variant rounded-2xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    maxLength={6}
                    className={`bg-surface border rounded-2xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary ${
                      errors.pincode ? 'border-rose-400' : 'border-outline-variant'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-primary-fixed/20 border border-primary/30 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Your Budget / Proposed Offer Fee (₹)
                    </label>
                    <p className="text-xs text-on-surface-variant">
                      Cooperative base rate: ₹{selectedCatObj.baseRate}
                    </p>
                  </div>
                  <span className="text-xs font-black bg-primary text-on-primary px-3 py-1 rounded-full">
                    Escrow Protected
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-primary">₹</span>
                  <input
                    type="number"
                    value={proposedFee}
                    onChange={(e) => setProposedFee(Number(e.target.value))}
                    step={50}
                    min={300}
                    className="w-full bg-surface border-2 border-primary/50 rounded-2xl pl-10 pr-4 py-3 font-mono text-2xl font-black text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Review details */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 space-y-3 text-xs">
                <h4 className="font-bold text-on-surface uppercase tracking-wider text-xs border-b border-outline-variant/60 pb-2">
                  Review & Confirm Booking Request
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-on-surface-variant block">Category:</span>
                    <strong className="text-on-surface text-sm">{selectedCatObj.name}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Proposed Budget:</span>
                    <strong className="text-primary font-mono text-sm">{formatCurrency(proposedFee)}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Date & Time:</span>
                    <strong className="text-on-surface">{preferredDate} ({preferredTime})</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Urgency:</span>
                    <strong className="text-on-surface">{urgency === 'EXPRESS' ? '⚡ Emergency Dispatch' : 'Standard Scheduled'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-outline-variant/50">
                  <span className="text-on-surface-variant block">Address:</span>
                  <span className="font-medium text-on-surface">{streetAddress}, {city} - {pincode}</span>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-700 text-xs font-semibold">
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="pt-6 border-t border-outline-variant/60 flex items-center justify-between gap-4">
            {step > 1 ? (
              <Button variant="outline" size="md" onClick={() => setStep(step - 1)} icon="arrow_back">
                Back
              </Button>
            ) : (
              <Button variant="outline" size="md" onClick={() => navigate('/services')}>
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button variant="primary" size="md" onClick={handleNext} icon="arrow_forward" className="font-bold px-6">
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
                icon="send"
                className="font-bold px-8 shadow-md"
              >
                Submit Booking Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
