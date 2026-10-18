import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import html2canvas from 'html2canvas-pro';
import imageCompression from 'browser-image-compression';
import { useScreenshot } from './useScreenshot';

vi.mock('html2canvas-pro', () => ({ default: vi.fn() }));
vi.mock('browser-image-compression', () => ({ default: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const blob = new Blob(['image'], { type: 'image/jpeg' });
const canvas = { toBlob: (callback: BlobCallback) => callback(blob) } as HTMLCanvasElement;
beforeEach(() => {
  vi.mocked(html2canvas).mockResolvedValue(canvas);
  vi.mocked(imageCompression).mockResolvedValue(blob as File);
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn().mockReturnValueOnce('blob:first').mockReturnValue('blob:second');
    static revokeObjectURL = vi.fn();
  });
});
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe('screenshot lifecycle', () => {
  it('releases replaced, removed and unmounted previews', async () => {
    const { result, unmount } = renderHook(useScreenshot);
    await act(() => result.current.captureScreen());
    expect(result.current.screenshotPreview).toBe('blob:first');
    await act(() => result.current.captureScreen());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first');
    act(() => result.current.removeScreenshot());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:second');
    expect(result.current.screenshotFile).toBeNull();
    await act(() => result.current.captureScreen());
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  });

  it.each(['unmount', 'remove'] as const)('discards a capture after %s', async cancel => {
    let finish!: (value: File) => void;
    vi.mocked(imageCompression).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { result, unmount } = renderHook(useScreenshot);
    let pending!: Promise<void>;
    await act(async () => { pending = result.current.captureScreen(); });
    if (cancel === 'unmount') unmount();
    else act(() => result.current.removeScreenshot());
    await act(async () => { finish(blob as File); await pending; });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(result.current.screenshotPreview).toBeNull();
  });

  it('ignores concurrent clicks and excludes the widget without changing the live DOM', async () => {
    let finish!: (value: HTMLCanvasElement) => void;
    vi.mocked(html2canvas).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(useScreenshot);
    const widget = document.createElement('div');
    widget.style.display = 'flex';
    let pending!: Promise<void>;
    act(() => { pending = result.current.captureScreen({ current: widget }); });
    await act(() => result.current.captureScreen());
    expect(html2canvas).toHaveBeenCalledTimes(1);
    expect(widget.style.display).toBe('flex');
    const options = vi.mocked(html2canvas).mock.calls[0][1]!;
    expect(options.allowTaint).toBe(false);
    expect(options.ignoreElements?.(widget)).toBe(true);
    expect(options.ignoreElements?.(document.body)).toBe(false);
    await act(async () => { finish(canvas); await pending; });
    expect(result.current.isCapturing).toBe(false);
  });

  it('allows retry after a failed capture', async () => {
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error('capture failed'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(useScreenshot);
    await act(async () => { await expect(result.current.captureScreen()).rejects.toThrow('capture failed'); });
    expect(result.current.isCapturing).toBe(false);
    await act(() => result.current.captureScreen());
    expect(result.current.screenshotFile).toBe(blob);
    errorLog.mockRestore();
  });
});
