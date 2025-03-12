'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, CheckCircle, ShieldCheck } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookieConsent');
    if (!hasConsented) {
      // Small delay to prevent immediate popup on page load
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'all');
    setShowConsent(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookieConsent', 'essential');
    setShowConsent(false);
  };

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4"
        >
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-xl border shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-shrink-0 bg-emerald-100 p-3 rounded-full">
                    <Cookie className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Cookie Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We use cookies to enhance your browsing experience, serve personalised content, and analyse our website traffic. 
                      Please select which cookies you are comfortable with.
                    </p>
                    <div className="text-xs text-gray-500">
                      <Link href="/privacy-policy" className="text-emerald-600 hover:text-emerald-700 underline">
                        Read our Privacy Policy
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={acceptEssential}
                    className="cursor-pointer group border rounded-lg p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-emerald-700">Essential Only</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Only cookies that are necessary for the website to function properly.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    onClick={acceptAll}
                    className="cursor-pointer group border rounded-lg p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-emerald-700">Accept All</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Allow all cookies, including those for analytics and personalisation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 