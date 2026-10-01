export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  const gtag = (
    window as unknown as {
      gtag?: (
        command: string,
        event: string,
        params?: Record<string, string | number | boolean>,
      ) => void;
    }
  ).gtag;
  gtag?.("event", name, params);
}
