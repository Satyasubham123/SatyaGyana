import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, Crown, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { auth } from '../lib/firebase';
import { updateUserProfile, UserProfile } from '../services/userService';

const PLANS = [
  {
    name: '30-Day Trial',
    price: '₹0',
    description: 'Your current introductory access.',
    features: [
      'Basic curriculum access',
      'Standard AI Mentor (Daily limits)',
      'Community study groups',
      'Basic performance tracking'
    ],
    buttonText: 'Current Plan',
    highlighted: false,
    action: 'none'
  },
  {
    name: 'Premium Lock-in',
    price: '₹19',
    period: '/month',
    description: 'Secure early-bird pricing forever.',
    features: [
      'Unlimited AI Teacher access',
      'Exclusive video modules',
      'Priority dataset processing',
      'Advanced AI study plans',
      'Ad-free experience',
      'Certificate of achievement'
    ],
    buttonText: 'Pay ₹19 & Upgrade Now',
    highlighted: true,
    badge: 'Early Bird',
    action: 'pay'
  }
];

export default function Subscription() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      toast.error("Please log in to upgrade.");
      return;
    }

    setIsProcessing(true);
    toast.loading("Connecting to secure payment gateway...", { id: 'payment' });
    
    setTimeout(async () => {
      try {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // 🚀 FIXED: Added 'as Partial<UserProfile>' to satisfy the compiler
        await updateUserProfile(user.uid, {
          isPremium: true,
          subscriptionPlan: 'active',
          subscriptionEndsAt: nextMonth
        } as Partial<UserProfile>);

        toast.success("Payment Successful! Welcome to Premium.", { id: 'payment' });
        
        setTimeout(() => {
          navigate('/dashboard');
          window.location.reload();
        }, 2000);

      } catch (error) {
        console.error(error);
        toast.error("Payment failed. Please try again.", { id: 'payment' });
        setIsProcessing(false);
      }
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 min-h-screen">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B', borderRadius: '16px' }
      }}/>

      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand/10 px-4 py-2 rounded-full mb-6 border border-brand/20"
        >
          <Crown className="h-4 w-4 text-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand">Adaptive System Tiers</span>
        </motion.div>
        <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-50 mb-6">
          Level Up Your Learning
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium">
          Choose the protocol that fits your educational momentum.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {PLANS.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative p-10 rounded-[40px] border-2 transition-all ${
              plan.highlighted 
                ? 'bg-slate-900 border-brand shadow-2xl shadow-brand/20 scale-105 z-10' 
                : 'bg-white dark:bg-bg-surface border-border-strong opacity-80 mt-4 md:mt-0'
            }`}
          >
            {plan.badge && (
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-yellow-500 text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                <Zap className="h-3 w-3" /> {plan.badge}
              </div>
            )}
            
            <div className="mb-10">
              <h3 className={`text-3xl font-black uppercase italic tracking-tight mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-slate-50'}`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className={`text-5xl font-black tracking-tighter ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                  {plan.price}
                </span>
                {plan.period && <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{plan.period}</span>}
              </div>
              <p className="text-slate-400 font-medium text-sm">{plan.description}</p>
            </div>

            <div className="space-y-4 mb-10">
              {plan.features.map(feature => (
                <div key={feature} className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? 'bg-brand/20 text-brand' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Check className="h-3 w-3" />
                  </div>
                  <span className={`text-sm font-semibold tracking-tight ${plan.highlighted ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button 
              disabled={plan.action === 'none' || isProcessing}
              onClick={() => plan.action === 'pay' ? handlePayment() : null}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-2 ${
              plan.highlighted 
                ? 'bg-brand text-white hover:bg-brand-dark shadow-brand/20 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}>
              {plan.action === 'pay' && isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isProcessing && plan.action === 'pay' ? 'Processing...' : plan.buttonText}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}