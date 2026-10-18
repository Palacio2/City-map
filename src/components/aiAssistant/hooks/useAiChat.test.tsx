import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAiChat } from './useAiChat';
import { aiApi } from '../api/aiApi';

vi.mock('../api/aiApi', () => ({ aiApi: { chat: vi.fn() } }));
const chat = vi.mocked(aiApi.chat);
beforeEach(() => chat.mockReset());

describe('AI conversation request isolation', () => {
  it('blocks simultaneous sends and excludes the pending question from history', async () => {
    let resolve!: (value: string) => void;
    chat.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const { result } = renderHook(() => useAiChat(null));
    let pending!: Promise<void>;
    act(() => { pending = result.current.sendMessage('First'); void result.current.sendMessage('Duplicate'); });
    expect(chat).toHaveBeenCalledTimes(1);
    expect(chat).toHaveBeenCalledWith('First', [], null);
    await act(async () => { resolve('Answer'); await pending; });
    chat.mockResolvedValueOnce('Second answer');
    await act(async () => { await result.current.sendMessage('Second'); });
    expect(chat.mock.calls[1][1].map(row => row.content)).toEqual(['First', 'Answer']);
  });

  it('can retry after an error without an incomplete history turn', async () => {
    chat.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('Recovered');
    const { result } = renderHook(() => useAiChat(null));
    await act(async () => { await result.current.sendMessage('Failed'); });
    expect(result.current.isError).toBe(true);
    await act(async () => { await result.current.sendMessage('Retry'); });
    expect(chat.mock.calls[1][1]).toEqual([]);
    expect(result.current.messages.map(row => row.content)).toEqual(['Retry', 'Recovered']);
  });

  it('discards a stale answer after clearing without unlocking a newer request', async () => {
    let oldResolve!: (value: string) => void;
    let newResolve!: (value: string) => void;
    chat.mockReturnValueOnce(new Promise(r => { oldResolve = r; }))
      .mockReturnValueOnce(new Promise(r => { newResolve = r; }));
    const { result } = renderHook(() => useAiChat(null));
    let oldRequest!: Promise<void>;
    let newRequest!: Promise<void>;
    act(() => { oldRequest = result.current.sendMessage('Old'); });
    act(() => result.current.clearChat());
    act(() => { newRequest = result.current.sendMessage('New'); });
    await act(async () => { oldResolve('Stale'); await oldRequest; });
    expect(result.current.isTyping).toBe(true);
    expect(result.current.messages.map(row => row.content)).toEqual(['New']);
    await act(async () => { newResolve('Fresh'); await newRequest; });
    expect(result.current.messages.map(row => row.content)).toEqual(['New', 'Fresh']);
  });

  it('bounds long conversations to complete turns within the request budget', async () => {
    chat.mockResolvedValue('a'.repeat(7000));
    const { result } = renderHook(() => useAiChat(null));
    for (let index = 0; index < 12; index++) {
      await act(async () => { await result.current.sendMessage(`Question ${index}`); });
    }
    for (const [, history] of chat.mock.calls) {
      expect(history.length % 2).toBe(0);
      expect(history.reduce((size, row) => size + row.content.length, 0)).toBeLessThanOrEqual(16000);
    }
  });
});
