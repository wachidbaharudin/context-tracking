import { useState, useMemo } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { useInvoice } from '@/hooks';
import { getTotalHours, calculateInvoiceTotal, formatCurrency } from '@/lib/utils';
import type { AppDocument } from '@/types';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  contextName: string;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

export function GenerateInvoiceModal({
  isOpen,
  onClose,
  contextId,
  contextName,
  doc,
  changeDoc,
}: GenerateInvoiceModalProps) {
  const { invoiceSettings, updateInvoiceSettings, generateInvoice, getFilteredEntries } =
    useInvoice({
      contextId,
      doc,
      changeDoc,
    });

  // Get current month's start and end dates as defaults
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  // Form state
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [clientName, setClientName] = useState(invoiceSettings?.clientName ?? '');
  const [clientEmail, setClientEmail] = useState(invoiceSettings?.clientEmail ?? '');
  const [yourName, setYourName] = useState(invoiceSettings?.yourName ?? '');
  const [yourEmail, setYourEmail] = useState(invoiceSettings?.yourEmail ?? '');
  const [hourlyRate, setHourlyRate] = useState(invoiceSettings?.hourlyRate?.toString() ?? '');
  const [currency, setCurrency] = useState(invoiceSettings?.currency ?? 'USD');

  // Calculate preview values
  const previewData = useMemo(() => {
    const filteredEntries = getFilteredEntries(startDate, endDate);
    const totalHours = getTotalHours(filteredEntries);
    const rate = parseFloat(hourlyRate) || 0;
    const total = calculateInvoiceTotal(totalHours, rate);

    return {
      totalHours,
      rate,
      total,
      entryCount: filteredEntries.length,
    };
  }, [startDate, endDate, hourlyRate, getFilteredEntries]);

  const handleGenerate = () => {
    const rate = parseFloat(hourlyRate) || 0;

    // Save settings
    updateInvoiceSettings({
      clientName,
      clientEmail,
      yourName,
      yourEmail,
      hourlyRate: rate,
      currency,
    });

    // Generate PDF
    generateInvoice(startDate, endDate);

    // Close modal
    onClose();
  };

  const isValid =
    clientName.trim() !== '' &&
    yourName.trim() !== '' &&
    hourlyRate.trim() !== '' &&
    parseFloat(hourlyRate) > 0 &&
    startDate !== '' &&
    endDate !== '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Invoice"
      className="md:max-w-2xl"
      footer={
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            onClick={(e) => {
              e.preventDefault();
              if (isValid) {
                handleGenerate();
              }
            }}
          >
            Generate PDF
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) {
            handleGenerate();
          }
        }}
        className="flex flex-col gap-6"
      >
        {/* Date Range */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Client Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Client Information</h3>
          <div className="space-y-3">
            <Input
              label="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Corporation"
              required
            />
            <Input
              label="Client Email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="billing@acme.com"
            />
          </div>
        </div>

        {/* Your Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Information</h3>
          <div className="space-y-3">
            <Input
              label="Your Name / Business Name"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="Your Business Name"
              required
            />
            <Input
              label="Your Email"
              type="email"
              value={yourEmail}
              onChange={(e) => setYourEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
            />
          </div>
        </div>

        {/* Billing Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Billing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hourly Rate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="100.00"
              required
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currency" className="text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex w-full rounded-md border border-gray-300 bg-white min-h-[44px] px-3 py-2 text-base md:min-h-0 md:h-10 md:px-4 md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Project:</span>
              <span className="font-medium text-gray-900">{contextName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timesheet Entries:</span>
              <span className="font-medium text-gray-900">{previewData.entryCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Hours:</span>
              <span className="font-medium text-gray-900">
                {previewData.totalHours.toFixed(2)} hrs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(previewData.rate, currency)}/hr
              </span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between text-base">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(previewData.total, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
