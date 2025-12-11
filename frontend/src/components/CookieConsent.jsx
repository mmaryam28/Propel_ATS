import { useState, useEffect } from 'react';
import { initAnalytics, resetUser } from '../lib/analytics';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'accepted') {
      initAnalytics();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowBanner(false);
    initAnalytics();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShowBanner(false);
    resetUser();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Cookie Consent</h3>
          <p className="text-sm text-gray-300">
            We use cookies and analytics to improve your experience and understand how you use our platform. 
            By accepting, you agree to our use of cookies for analytics purposes. 
            See our <a href="/privacy" className="underline hover:text-blue-400">Privacy Policy</a> for more details.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800 transition"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
