import { useCallback, useMemo } from 'react';
import type { InvoiceSettings, AppDocument, TimesheetEntry } from '@/types';
import {
  filterEntriesByDateRange,
  calculateInvoiceTotal,
  generateInvoiceNumber,
  formatInvoiceDate,
  generateInvoicePDF,
  getTotalHours,
} from '@/lib/utils';

interface UseInvoiceProps {
  contextId: string;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

interface UseInvoiceResult {
  invoiceSettings: InvoiceSettings | null;
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => void;
  generateInvoice: (startDate: string, endDate: string) => void;
  getFilteredEntries: (startDate: string, endDate: string) => TimesheetEntry[];
}

export function useInvoice({ contextId, doc, changeDoc }: UseInvoiceProps): UseInvoiceResult {
  const context = doc?.contexts[contextId];
  const invoiceSettings = context?.invoiceSettings ?? null;
  const timesheetEntries = useMemo(
    () => context?.timesheetEntries ?? [],
    [context?.timesheetEntries]
  );
  const contextName = context?.name ?? '';

  const updateInvoiceSettings = useCallback(
    (settings: Partial<InvoiceSettings>) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          if (!d.contexts[contextId].invoiceSettings) {
            d.contexts[contextId].invoiceSettings = {};
          }
          Object.assign(d.contexts[contextId].invoiceSettings!, settings);
          d.contexts[contextId].updatedAt = new Date().toISOString();
        }
      });
    },
    [contextId, changeDoc]
  );

  const getFilteredEntries = useCallback(
    (startDate: string, endDate: string): TimesheetEntry[] => {
      return filterEntriesByDateRange(timesheetEntries, startDate, endDate);
    },
    [timesheetEntries]
  );

  const generateInvoice = useCallback(
    (startDate: string, endDate: string) => {
      const filteredEntries = filterEntriesByDateRange(timesheetEntries, startDate, endDate);
      const totalHours = getTotalHours(filteredEntries);
      const hourlyRate = invoiceSettings?.hourlyRate ?? 0;
      const currency = invoiceSettings?.currency ?? 'USD';
      const totalAmount = calculateInvoiceTotal(totalHours, hourlyRate);

      const invoiceData = {
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: formatInvoiceDate(new Date()),
        contextName,
        startDate,
        endDate,
        totalHours,
        hourlyRate,
        totalAmount,
        currency,
        settings: {
          clientName: invoiceSettings?.clientName ?? '',
          clientEmail: invoiceSettings?.clientEmail ?? '',
          yourName: invoiceSettings?.yourName ?? '',
          yourEmail: invoiceSettings?.yourEmail ?? '',
          hourlyRate,
          currency,
        },
        entries: filteredEntries,
      };

      generateInvoicePDF(invoiceData);
    },
    [timesheetEntries, invoiceSettings, contextName]
  );

  return {
    invoiceSettings,
    updateInvoiceSettings,
    generateInvoice,
    getFilteredEntries,
  };
}
