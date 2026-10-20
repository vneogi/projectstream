"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

function GaPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;
    void fetch("/api/usage/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: page_path }),
      keepalive: true,
    }).catch(() => {
      // First-party analytics must never interfere with navigation.
    });

    if (!GA_ID) return;
    const gtag = (
      window as unknown as {
        gtag?: (
          command: string,
          id: string,
          params: Record<string, string>,
        ) => void;
      }
    ).gtag;
    gtag?.("config", GA_ID, { page_path });
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  return (
    <>
      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      <Suspense fallback={null}>
        <GaPageViews />
      </Suspense>
    </>
  );
}
