import { render, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ContactCaptcha } from './ContactCaptcha';

let options: Record<string, unknown>;
const remove=vi.fn();
beforeEach(()=>{
  vi.stubEnv('VITE_CONTACT_TURNSTILE_SITE_KEY','fixture-site-key');
  window.turnstile={render:vi.fn((_container,value)=>{options=value;return 'widget';}),remove};
});
afterEach(()=>{cleanup();delete window.turnstile;vi.unstubAllEnvs();vi.clearAllMocks();});
it('passes the action, clears expired/error tokens and removes widget on unmount',async()=>{
  const onToken=vi.fn(),onError=vi.fn();
  const view=render(<ContactCaptcha onToken={onToken} onError={onError}/>);
  await waitFor(()=>expect(window.turnstile?.render).toHaveBeenCalledOnce());
  expect(options.action).toBe('contact');expect(options.sitekey).toBe('fixture-site-key');
  (options.callback as (token:string)=>void)('token');expect(onToken).toHaveBeenLastCalledWith('token');
  (options['expired-callback'] as ()=>void)();expect(onToken).toHaveBeenLastCalledWith('');
  (options['error-callback'] as ()=>void)();expect(onError).toHaveBeenCalledOnce();
  view.unmount();expect(remove).toHaveBeenCalledWith('widget');
  onToken.mockClear();(options.callback as (token:string)=>void)('late');expect(onToken).not.toHaveBeenCalled();
});
it('missing site key fails closed without loading a widget',()=>{
  vi.stubEnv('VITE_CONTACT_TURNSTILE_SITE_KEY','');
  const onToken=vi.fn(),onError=vi.fn();
  render(<ContactCaptcha onToken={onToken} onError={onError}/>);
  expect(onToken).toHaveBeenCalledWith('');expect(onError).toHaveBeenCalledOnce();
  expect(window.turnstile?.render).not.toHaveBeenCalled();
});
it('remount after submission gets a fresh widget and ignores callbacks from the old one',async()=>{
  const onToken=vi.fn(),onError=vi.fn();
  const view=render(<ContactCaptcha key={0} onToken={onToken} onError={onError}/>);
  await waitFor(()=>expect(window.turnstile?.render).toHaveBeenCalledOnce());
  const old=options.callback as (token:string)=>void;
  view.rerender(<ContactCaptcha key={1} onToken={onToken} onError={onError}/>);
  await waitFor(()=>expect(window.turnstile?.render).toHaveBeenCalledTimes(2));
  old('old-token');expect(onToken).not.toHaveBeenCalled();expect(remove).toHaveBeenCalledOnce();
});
