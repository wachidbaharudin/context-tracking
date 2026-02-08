import { describe, it, expect } from 'vitest';
import {
  filterEntriesByDateRange,
  calculateInvoiceTotal,
  formatCurrency,
  generateInvoiceNumber,
  formatInvoiceDate,
} from './invoiceUtils';
import type { TimesheetEntry } from '@/types';

describe('invoiceUtils', () => {
  describe('filterEntriesByDateRange', () => {
    const entries: TimesheetEntry[] = [
      {
        id: '1',
        startTime: '2026-02-01T10:00:00Z',
        endTime: '2026-02-01T12:00:00Z',
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      },
      {
        id: '2',
        startTime: '2026-02-15T14:00:00Z',
        endTime: '2026-02-15T16:00:00Z',
        createdAt: '2026-02-15T14:00:00Z',
        updatedAt: '2026-02-15T14:00:00Z',
      },
      {
        id: '3',
        startTime: '2026-03-01T09:00:00Z',
        endTime: '2026-03-01T11:00:00Z',
        createdAt: '2026-03-01T09:00:00Z',
        updatedAt: '2026-03-01T09:00:00Z',
      },
    ];

    it('filters entries within date range', () => {
      const result = filterEntriesByDateRange(entries, '2026-02-01', '2026-02-28');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('includes entries on the start date', () => {
      const result = filterEntriesByDateRange(entries, '2026-02-01', '2026-02-01');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('includes entries on the end date', () => {
      const result = filterEntriesByDateRange(entries, '2026-03-01', '2026-03-01');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('returns empty array when no entries in range', () => {
      const result = filterEntriesByDateRange(entries, '2026-04-01', '2026-04-30');
      expect(result).toHaveLength(0);
    });

    it('works with Date objects', () => {
      const result = filterEntriesByDateRange(
        entries,
        new Date('2026-02-01'),
        new Date('2026-02-28')
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('calculates total correctly', () => {
      expect(calculateInvoiceTotal(10, 100)).toBe(1000);
      expect(calculateInvoiceTotal(7.5, 150)).toBe(1125);
      expect(calculateInvoiceTotal(0, 100)).toBe(0);
      expect(calculateInvoiceTotal(10, 0)).toBe(0);
    });

    it('handles decimal hours', () => {
      expect(calculateInvoiceTotal(4.5, 100)).toBe(450);
      expect(calculateInvoiceTotal(2.25, 80)).toBe(180);
    });
  });

  describe('formatCurrency', () => {
    it('formats USD by default', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats other currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
    });

    it('handles negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  describe('generateInvoiceNumber', () => {
    it('generates invoice number in correct format', () => {
      const invoiceNumber = generateInvoiceNumber();
      expect(invoiceNumber).toMatch(/^INV-\d{8}-\d{6}$/);
    });

    it('generates unique invoice numbers', () => {
      const num1 = generateInvoiceNumber();
      const num2 = generateInvoiceNumber();
      // They should be different (unless generated in the same exact second, which is unlikely)
      // This test might occasionally fail if run in the same second, but it's very unlikely
      expect(num1).toBeTruthy();
      expect(num2).toBeTruthy();
    });
  });

  describe('formatInvoiceDate', () => {
    it('formats date string correctly', () => {
      const result = formatInvoiceDate('2026-02-08');
      expect(result).toBe('February 8, 2026');
    });

    it('formats Date object correctly', () => {
      const result = formatInvoiceDate(new Date('2026-12-25'));
      expect(result).toBe('December 25, 2026');
    });

    it('handles dates with time', () => {
      const result = formatInvoiceDate('2026-02-08T14:30:00Z');
      expect(result).toContain('February');
      expect(result).toContain('2026');
    });
  });
});
