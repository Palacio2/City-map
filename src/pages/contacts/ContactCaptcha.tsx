import { useEffect, useRef } from 'react';

interface Turnstile {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
}
declare global { interface Window { turnstile?: Turnstile } }
let loading: Promise<Turnstile> | undefined;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) {
    loading = new Promise<Turnstile>((resolve,reject)=>{
      const script=document.createElement('script');
      const timer=window.setTimeout(()=>fail(),15000);
      const fail=()=>{window.clearTimeout(timer);script.remove();reject(new Error('Verification unavailable'));};
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;
      script.onload=()=>{window.clearTimeout(timer);if(window.turnstile) resolve(window.turnstile);else fail();};
      script.onerror=fail;
      document.head.appendChild(script);
    }).catch(error=>{loading=undefined;throw error;});
  }
  return loading;
}

export function ContactCaptcha({onToken,onError}: {onToken:(token:string)=>void;onError:()=>void}) {
  const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let active=true;
    let widget: string | undefined;
    let api: Turnstile | undefined;
    const fail=()=>{if(active){onToken('');onError();}};
    const sitekey=import.meta.env.VITE_CONTACT_TURNSTILE_SITE_KEY;
    if(!sitekey) {fail();return;}
    void loadTurnstile().then(loaded=>{
      if(!active || !container.current) return;
      api=loaded;
      widget=api.render(container.current,{sitekey,action:'contact',size:'flexible',
        callback:(token:string)=>{if(active)onToken(token);},
        'expired-callback':()=>{if(active)onToken('');},'error-callback':fail,
      });
    }).catch(fail);
    return ()=>{active=false;if(widget!==undefined)api?.remove(widget);};
  },[onToken,onError]);
  return <div ref={container} />;
}
