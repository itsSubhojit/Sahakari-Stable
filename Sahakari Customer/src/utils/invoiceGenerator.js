export const generateInvoice = (booking) => {
  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${booking.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 800; color: #4F46E5; letter-spacing: -0.5px; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #111; text-align: right; }
        .details { display: flex; justify-content: space-between; margin-bottom: 40px; line-height: 1.5; }
        .section-title { font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; letter-spacing: 0.5px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { padding: 16px; border-bottom: 1px solid #eee; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: 600; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .total-row { font-weight: bold; font-size: 18px; color: #0f172a; }
        .total-row td { border-top: 2px solid #cbd5e1; border-bottom: none; padding-top: 24px; }
        .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 60px; border-top: 1px solid #eee; padding-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Sahakari</div>
        <div class="invoice-title">INVOICE</div>
      </div>
      
      <div class="details">
        <div>
          <div class="section-title">Billed To</div>
          <div style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">${booking.customerName || 'Customer'}</div>
          <div style="color: #475569;">${booking.address || 'N/A'}</div>
          <div style="color: #475569;">${booking.city || ''} ${booking.pincode || ''}</div>
        </div>
        <div style="text-align: right;">
          <div class="section-title">Invoice Details</div>
          <div>Invoice No: <strong style="color: #1e293b;">INV-${booking.id.replace('BK-', '').substring(0, 8)}</strong></div>
          <div>Date: <strong style="color: #1e293b;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          <div style="margin-top: 8px;">Status: <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; display: inline-block;">PAID</span></div>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Provider</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color: #334155;">${booking.serviceName || 'Professional Service'}</strong></td>
            <td style="color: #475569;">${booking.worker?.name || booking.workerName || 'Service Provider'}</td>
            <td style="text-align: right; font-weight: 500;">₹${booking.agreedPrice || 0}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Platform Fee</td>
            <td style="color: #475569;">Sahakari</td>
            <td style="text-align: right; font-weight: 500;">₹${booking.platformFee || 0}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Taxes & GST (18%)</td>
            <td style="color: #475569;">-</td>
            <td style="text-align: right; font-weight: 500;">₹${booking.taxes || 0}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">Total Amount</td>
            <td style="text-align: right; color: #4f46e5; font-size: 24px;">₹${booking.totalPrice || 0}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <strong>Thank you for choosing Sahakari!</strong><br><br>
        If you have any questions about this invoice, please contact support@sahakari.com.
      </div>
    </body>
    </html>
  `;

  // Instead of opening a popup (which gets blocked), we trigger a direct file download
  const blob = new Blob([invoiceHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `Sahakari_Invoice_${booking.id || 'N/A'}.html`;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
