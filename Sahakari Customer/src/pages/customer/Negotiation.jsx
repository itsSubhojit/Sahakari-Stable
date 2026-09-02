import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Rating } from '../../components/common/Rating';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { NegotiationChat } from '../../components/customer/NegotiationChat';
import { CounterOfferModal } from '../../components/customer/CounterOfferModal';
import { useNegotiation } from '../../hooks/useNegotiation';
import { useBooking } from '../../hooks/useBooking';
import { api } from '../../services/api';
import { formatCurrency, formatDistance } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const Negotiation = () => {
  const { workerId = 'worker-1' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [worker, setWorker] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setBookingDetails } = useBooking();

  const {
    messages,
    loading: chatLoading,
    sending,
    agreedAmount,
    status,
    sendCounter,
    acceptCurrentOffer,
  } = useNegotiation(workerId);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const data = await api.getWorkerById(workerId);
        setWorker(data);
      } catch (err) {
        console.error('Failed to load worker profile', err);
      }
    };
    fetchWorker();
  }, [workerId]);

  const handleProceedToBooking = async () => {
    const finalPrice = acceptCurrentOffer(agreedAmount || worker?.startingPrice || 1500);
    try {
      const res = await api.acceptOffer(workerId);
      const bookingId = res?.bookingId || 'BK-7892';
      setBookingDetails({
        workerId,
        worker,
        agreedPrice: finalPrice,
        serviceName: `${worker?.title || 'Service'} Session`,
      });
      navigate(`/booking/${bookingId}?worker=${workerId}&price=${finalPrice}`);
    } catch (err) {
      console.warn('Accept offer backend note:', err);
      navigate(`/booking/BK-7892?worker=${workerId}&price=${finalPrice}`);
    }
  };

  return (
    <Layout title={t('negotiation.pageTitle')}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Worker Profile & Bargaining Status Bar */}
        {worker && (
          <Card variant="surface" padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low border-primary/20">
            <div className="flex items-center gap-4">
              <Avatar
                src={worker.avatar}
                alt={worker.name}
                size="lg"
                isOnline={worker.isOnline}
              />
              <div>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                    {worker.name}
                  </h3>
                  <Rating score={worker.rating} reviewsCount={worker.reviewsCount} />
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/40">
              <span className="text-label-sm text-on-surface-variant">
                {t('negotiation.currentBestRate')}
              </span>
              <span className="text-headline-md font-bold text-primary">
                {formatCurrency(agreedAmount || worker.startingPrice)}
              </span>
            </div>
          </Card>
        )}

        {/* SIH Innovation Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center gap-3 text-label-sm text-primary">
          <span className="material-symbols-outlined text-[22px] flex-shrink-0">
            handshake
          </span>
          <p>
            <strong>Sahakari Dynamic Bargaining:</strong> {t('negotiation.bargainingNotice').replace('Sahakari Dynamic Bargaining: ', '')}
          </p>
        </div>

        {/* Chat Stream & Action Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <NegotiationChat
              messages={messages}
              onSendCounter={(amount, text) => sendCounter(amount, text)}
              onOpenOfferModal={() => setIsModalOpen(true)}
              isSending={sending}
            />
          </div>

          {/* Quick Decision Box */}
          <div className="md:col-span-1 space-y-4">
            <Card variant="surface" padding="md" className="space-y-4 shadow-sm sticky top-24">
              <h4 className="font-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                {t('negotiation.agreementStatus')}
              </h4>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-1">
                <span className="text-label-sm text-on-surface-variant">
                  {t('negotiation.currentNegotiatedPrice')}
                </span>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(agreedAmount || 1500)}
                </p>
                <p className="text-[12px] text-on-surface-variant">
                  {t('negotiation.includesLabor')}
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  fullWidth
                  variant="primary"
                  size="lg"
                  icon="check_circle"
                  onClick={handleProceedToBooking}
                  className="py-3.5"
                >
                  {t('negotiation.acceptBook')} (₹{agreedAmount || 1500})
                </Button>

                <Button
                  fullWidth
                  variant="outline"
                  size="md"
                  icon="payments"
                  onClick={() => setIsModalOpen(true)}
                >
                  {t('negotiation.counterOffer')}
                </Button>
              </div>

              <p className="text-center text-[11px] text-on-surface-variant">
                {t('negotiation.noPaymentDeducted')}
              </p>
            </Card>
          </div>
        </div>

        {/* Counter Offer Modal */}
        <CounterOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentPrice={agreedAmount || worker?.startingPrice || 1500}
          onSubmitOffer={(amount, note) => sendCounter(amount, note)}
        />
      </div>
    </Layout>
  );
};

