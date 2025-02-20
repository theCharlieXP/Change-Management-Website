'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const FeedbackForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');
    setShowSuccessAnimation(false);

    const formData = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim()
    };

    try {
      console.log('Sending form data:', formData);

      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      
      let data;
      try {
        const text = await response.text();
        console.log('Raw response:', text);
        data = JSON.parse(text);
      } catch (e) {
        console.error('Response parsing error:', e);
        throw new Error('Failed to parse server response');
      }

      console.log('Parsed response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send message');
      }

      setStatus('Thank you for your feedback!');
      setShowSuccessAnimation(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 sm:p-8 w-full max-w-2xl mx-auto backdrop-blur-sm bg-white/50 dark:bg-gray-950/50 border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="h-12 px-4 bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-800/50 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your Email"
                required
                className="h-12 px-4 bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-800/50 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your Message"
                required
                className="min-h-[150px] px-4 py-3 bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-800/50 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200 resize-none"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="relative">
            <Button 
              type="submit" 
              className={cn(
                "w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200",
                isLoading && "opacity-90 cursor-not-allowed"
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <Send className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "absolute left-0 right-0 -bottom-12 text-center text-sm font-medium",
                    status.toLowerCase().includes('error') || 
                    status.toLowerCase().includes('failed')
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    {status.toLowerCase().includes('error') || 
                     status.toLowerCase().includes('failed') ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {status}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}; 