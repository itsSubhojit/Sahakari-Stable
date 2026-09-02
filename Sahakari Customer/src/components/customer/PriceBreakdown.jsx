import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { formatCurrency, calculatePaymentSummary } from '../../utils/formatters';

export const PriceBreakdown = ({
  price = 1500,
  onProceed,
  loading = false,
  isPaid = false,
  sticky = true,
}) => {
  const { basePrice, platformFee, taxes, total } = calculatePaymentSummary(price);

  return (
    <Card
      variant="surface"
      padding="md"
      className={`${sticky ? 'sticky top-24' : ''} shadow-sm`}
    >
      <h4 className="font-label-md text-on-surface-variant mb-md uppercase tracking-wider font-semibold">
        Payment Details
      </h4>

      <div className="space-y-sm mb-md pb-md border-b border-outline-variant">
        <div className="flex justify-between items-center text-body-md">
          <span className="text-on-surface-variant">Agreed Service Fee</span>
          <span className="text-on-surface font-medium">{formatCurrency(basePrice)}</span>
        </div>

        <div className="flex justify-between items-center text-body-md">
          <span className="text-on-surface-variant">Platform Fee (5%)</span>
          <span className="text-on-surface font-medium">{formatCurrency(platformFee)}</span>
        </div>

        <div className="flex justify-between items-center text-body-md">
          <span className="text-on-surface-variant">Taxes & GST</span>
          <span className="text-on-surface font-medium">{formatCurrency(taxes)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-lg">
        <span className="font-headline-md text-headline-md text-on-surface">Total</span>
        <span className="font-headline-md text-headline-md font-bold text-primary">
          {formatCurrency(total)}
        </span>
      </div>

      {isPaid ? (
        <div className="w-full bg-[#d8f3e5] text-[#003822] border border-[#a1dfbe] font-label-md py-3 rounded-lg flex items-center justify-center gap-2 font-bold">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Payment Confirmed
        </div>
      ) : (
        <Button
          fullWidth
          variant="tint"
          size="lg"
          onClick={onProceed}
          loading={loading}
          icon="lock"
          className="shadow-sm font-label-md py-3.5"
        >
          Proceed to Payment
        </Button>
      )}

      <p className="text-center font-label-sm text-on-surface-variant mt-sm text-[12px]">
        Payments are secure, verified & encrypted.
      </p>
    </Card>
  );
};

