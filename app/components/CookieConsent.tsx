'use client'

import { useState, useEffect } from 'react';
import styles from './CookieConsent.module.css';

type ConsentStatus = 'accepted' | 'rejected' | null;

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent') as ConsentStatus;
    
    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'accepted') {
      loadInstantlyScript();
    }
  }, []);

  const loadInstantlyScript = (): void => {
    // Prevent duplicate script loading
    if (document.querySelector('script[src*="leadsy.ai"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://wvbknd.leadsy.ai/tag.js';
    script.setAttribute('data-key', process.env.NEXT_PUBLIC_INSTANTLY_API_KEY || '');
    script.async = true;
    
    script.onerror = () => {
      console.error('Failed to load Instantly.ai script');
    };
    
    document.head.appendChild(script);
  };

  const handleAccept = (): void => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
    loadInstantlyScript();
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