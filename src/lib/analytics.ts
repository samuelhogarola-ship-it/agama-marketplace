type EventData = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: EventData) => void;
    };
  }
}

export function trackEvent(eventName: string, data: EventData = {}) {
  if (typeof window === "undefined" || !window.umami) return;
  window.umami.track(eventName, data);
}
