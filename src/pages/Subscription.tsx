import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    name: 'Free Learner',
    price: '₹0',
    description: 'Perfect for starting your journey.',
    features: [
      'Basic NCERT modules',
      'Daily AI teacher limit (10 messages)',
      'Community study groups',
      'Basic performance tracking'
    ],
    buttonText: 'Current Plan',
    highlighted: false
  },
  {
    name: 'Premium Pro',
    price: '₹499',
    period: '/month',
    description: 'Unleash your full potential.',
    features: [
      'Unlimited AI Teacher access',
      'Exclusive video modules',
      'Priority dataset processing',
      'Advanced AI study plans',
      'Ad-free experience',
      'Certificate of achievement'
    ],
    buttonText: 'Upgrade Now',
    highlighted: true,
    badge: 'Most Popular'
  }
];

export default function Subscription() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 min-h-screen">
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
            className={`relative p-10 rounded-[40px] border-2 transition-all hover:scale-[1.02] ${
              plan.highlighted 
                ? 'bg-white dark:bg-slate-900 border-brand shadow-2xl shadow-brand/20' 
                : 'bg-white dark:bg-bg-surface border-border-strong opacity-80'
            }`}
          >
            {plan.badge && (
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-brand text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                {plan.badge}
              </div>
            )}
            
            <div className="mb-10">
              <h3 className="text-3xl font-black uppercase italic tracking-tight text-slate-900 dark:text-slate-50 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-slate-100">{plan.price}</span>
                {plan.period && <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{plan.period}</span>}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{plan.description}</p>
            </div>

            <div className="space-y-4 mb-10">
              {plan.features.map(feature => (
                <div key={feature} className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? 'bg-brand/20 text-brand' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-tight">{feature}</span>
                </div>
              ))}
            </div>

            <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl ${
              plan.highlighted 
                ? 'bg-brand text-white hover:bg-brand-dark shadow-brand/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
              {plan.buttonText}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-32 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-8">
          <Zap className="h-8 w-8 text-brand mx-auto mb-6" />
          <h4 className="font-black uppercase italic mb-3 text-main">Fast Processing</h4>
          <p className="text-xs text-muted font-medium uppercase tracking-widest leading-loose">Edge-computing for neural teacher responses.</p>
        </div>
        <div className="text-center p-8">
          <Shield className="h-8 w-8 text-brand mx-auto mb-6" />
          <h4 className="font-black uppercase italic mb-3 text-main">Secure Data</h4>
          <p className="text-xs text-muted font-medium uppercase tracking-widest leading-loose">Encryption at rest for all learning telemetry.</p>
        </div>
        <div className="text-center p-8">
          <Sparkles className="h-8 w-8 text-brand mx-auto mb-6" />
          <h4 className="font-black uppercase italic mb-3 text-main">AI Insights</h4>
          <p className="text-xs text-muted font-medium uppercase tracking-widest leading-loose">Advanced heuristics to detect study fatigue.</p>
        </div>
      </div>
    </div>
  );
}
