import { afterEach, describe, expect, it, vi } from 'vitest';
import type { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { exportToPDF } from './pdfExport';

vi.mock('html2canvas-pro', () => ({ default: vi.fn() }));
const { pdfs } = vi.hoisted(() => ({ pdfs: [] as jsPDF[] }));
vi.mock('jspdf', async importOriginal => {
  const actual = await importOriginal<typeof import('jspdf')>();
  return { ...actual, default: vi.fn(function (...args: ConstructorParameters<typeof actual.jsPDF>) {
    const pdf = new actual.jsPDF(...args);
    vi.spyOn(pdf, 'save').mockImplementation(() => pdf);
    pdfs.push(pdf);
    return pdf;
  }) };
});

// Real image parsing and PDF serialization; only DOM capture/download are replaced.
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
afterEach(() => { vi.restoreAllMocks(); vi.mocked(html2canvas).mockReset(); pdfs.length = 0; document.body.innerHTML = ''; });

describe('PDF export with the installed jsPDF', () => {
  it.each([false, true])('serializes a multipage PDF (explicit pages: %s)', async explicit => {
    document.body.innerHTML = `<div id="report">${explicit ? '<div class="pdf-page"></div><div class="pdf-page"></div>' : ''}</div>`;
    vi.mocked(html2canvas).mockResolvedValue({ width: 100, height: explicit ? 100 : 200,
      toDataURL: () => pixel } as unknown as HTMLCanvasElement);
    expect(await exportToPDF('report', 'Report', 'city.pdf')).toBe(true);
    const pdf = pdfs[0];
    const output = pdf.output();
    expect(pdf.save).toHaveBeenCalledWith('city.pdf');
    expect(pdf.getNumberOfPages()).toBe(2);
    expect(output).toMatch(/^%PDF-/);
    expect(output).toContain('/Subtype /Image');
    expect(output).toContain('%%EOF');
  });

  it('does not claim success for a missing element or failed capture', async () => {
    expect(await exportToPDF('missing')).toBe(false);
    expect(html2canvas).not.toHaveBeenCalled();
    document.body.innerHTML = '<div id="report"></div>';
    vi.mocked(html2canvas).mockRejectedValue(new Error('capture failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await exportToPDF('report')).toBe(false);
  });
});
