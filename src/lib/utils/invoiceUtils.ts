import jsPDF from 'jspdf';
import type { TimesheetEntry, InvoiceSettings } from '@/types';
import { calculateDuration } from './timesheetUtils';

/**
 * Filter timesheet entries by date range
 * @param entries - Array of timesheet entries
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @returns Filtered timesheet entries within the date range
 */
export function filterEntriesByDateRange(
  entries: TimesheetEntry[],
  startDate: string | Date,
  endDate: string | Date
): TimesheetEntry[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set start to beginning of day and end to end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= start && entryDate <= end;
  });
}

/**
 * Calculate invoice total
 * @param hours - Total hours worked
 * @param hourlyRate - Hourly rate
 * @returns Total amount
 */
export function calculateInvoiceTotal(hours: number, hourlyRate: number): number {
  return hours * hourlyRate;
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Generate invoice number based on current date and time
 * @returns Invoice number in format INV-YYYYMMDD-HHMMSS
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `INV-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Format date to readable string
 * @param date - Date to format
 * @returns Formatted date string (e.g., "February 8, 2026")
 */
export function formatInvoiceDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  contextName: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  currency: string;
  settings: InvoiceSettings;
  entries: TimesheetEntry[];
}

/**
 * Generate PDF invoice
 * @param data - Invoice data
 */
export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header - Your business name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.settings.yourName || 'Your Business', 20, yPosition);
  yPosition += 10;

  if (data.settings.yourEmail) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.settings.yourEmail, 20, yPosition);
    yPosition += 10;
  }

  // Invoice title and number
  yPosition += 10;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${data.invoiceNumber}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Date: ${data.invoiceDate}`, 20, yPosition);
  yPosition += 15;

  // Bill to section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.settings.clientName || 'Client Name', 20, yPosition);
  yPosition += 6;

  if (data.settings.clientEmail) {
    doc.text(data.settings.clientEmail, 20, yPosition);
    yPosition += 6;
  }

  // Project/Period
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Project:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contextName, 45, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Period:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${formatInvoiceDate(data.startDate)} - ${formatInvoiceDate(data.endDate)}`,
    45,
    yPosition
  );
  yPosition += 15;

  // Table header
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 30; // Reserve space for footer
  const maxY = pageHeight - bottomMargin;

  // Helper function to add page header when overflow occurs
  const addPageHeader = () => {
    yPosition = 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, pageWidth - 40, 10, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 25, yPosition + 7);
    doc.text('Description', 70, yPosition + 7);
    doc.text('Hours', pageWidth - 60, yPosition + 7);
    doc.text('Amount', pageWidth - 25, yPosition + 7, { align: 'right' });
    yPosition += 10;
  };

  // Initial table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, pageWidth - 40, 10, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 25, yPosition + 7);
  doc.text('Description', 70, yPosition + 7);
  doc.text('Hours', pageWidth - 60, yPosition + 7);
  doc.text('Amount', pageWidth - 25, yPosition + 7, { align: 'right' });
  yPosition += 10;

  // Sort entries chronologically (oldest first)
  const sortedEntries = [...data.entries].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Table rows - itemized entries
  doc.setFont('helvetica', 'normal');
  sortedEntries.forEach((entry) => {
    // Check if we need a new page
    if (yPosition + 10 > maxY) {
      doc.addPage();
      addPageHeader();
    }

    yPosition += 7;
    const entryDate = new Date(entry.startTime);
    const dateStr = entryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const hours = calculateDuration(entry.startTime, entry.endTime);
    const amount = hours * data.hourlyRate;
    const description = entry.description || 'No description';

    // Truncate description if too long (max ~35 chars)
    const maxDescLength = 35;
    const truncatedDesc =
      description.length > maxDescLength
        ? description.substring(0, maxDescLength - 3) + '...'
        : description;

    doc.text(dateStr, 25, yPosition);
    doc.text(truncatedDesc, 70, yPosition);
    doc.text(hours.toFixed(2), pageWidth - 60, yPosition);
    doc.text(formatCurrency(amount, data.currency), pageWidth - 25, yPosition, {
      align: 'right',
    });
  });

  yPosition += 10;

  // Check if we need a new page for total
  if (yPosition + 20 > maxY) {
    doc.addPage();
    yPosition = 20;
  }

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 70, yPosition);
  doc.text(formatCurrency(data.totalAmount, data.currency), pageWidth - 25, yPosition, {
    align: 'right',
  });

  // Footer
  yPosition = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });

  // Save the PDF
  const fileName = `Invoice-${data.invoiceNumber}.pdf`;
  doc.save(fileName);
}
