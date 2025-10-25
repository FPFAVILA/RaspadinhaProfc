// Utmify tracking utilities
declare global {
  interface Window {
    pixelId?: string;
    AdvancedPixelEvent?: (eventName: string, eventData?: any) => void;
  }
}

export const trackEvent = (eventName: string, eventData?: any) => {
  try {
    if (typeof window !== 'undefined' && window.AdvancedPixelEvent) {
      window.AdvancedPixelEvent(eventName, eventData);
      console.log(`[Utmify] Event tracked: ${eventName}`, eventData);
    } else {
      console.warn(`[Utmify] AdvancedPixelEvent not available for: ${eventName}`);
    }
  } catch (error) {
    console.error(`[Utmify] Error tracking ${eventName}:`, error);
  }
};

export const trackPageView = () => {
  trackEvent('PageView');
};

export const trackRegistration = (userData?: any) => {
  trackEvent('Cadastro', userData);
};

export const trackPrizeRedemption = (prizeData?: any) => {
  trackEvent('ResgateIphone', prizeData);
};
