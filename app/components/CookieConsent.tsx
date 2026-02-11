// app/components/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react';
import styles from './CookieConsent.module.css';

type ConsentStatus = 'accepted' | 'rejected' | null;

type CookieConsentProps = {
  rb2bKey: string;
};

export default function CookieConsent({ rb2bKey }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent') as ConsentStatus;

    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'accepted') {
      loadRb2bScript(rb2bKey);
    }
  }, [rb2bKey]);

  const loadRb2bScript = (key: string): void => {
    if (!key) return;
    if (document.querySelector('script[src*="ddwl4m2hdecbv.cloudfront.net/b/"]')) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://ddwl4m2hdecbv.cloudfront.net/b/${key}/${key}.js.gz`;

    script.onerror = () => {
      console.error('Failed to load RB2B script');
    };

    document.head.appendChild(script);
  };

  const handleAccept = (): void => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
    loadRb2bScript(rb2bKey);
  };

  const handleDecline = (): void => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <p>
          We use cookies to enhance your experience and analyze site traffic.{' '}
          <a href="/privacy">Learn more</a>
        </p>
        <div className={styles.buttons}>
          <button
            onClick={handleAccept}
            className={styles.accept}
            aria-label="Accept cookies"
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            className={styles.decline}
            aria-label="Decline cookies"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
