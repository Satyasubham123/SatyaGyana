import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, AlertCircle, Calendar, ShieldCheck, Mail, Info } from 'lucide-react';

export default function RefundPolicy() {
  const policies = [
    {
      icon: <Info className="h-6 w-6 text-brand" />,
      title: "General Policy",
      description: "We aim to provide quality educational services. Subscriptions and digital products may be eligible for refunds only under valid technical or billing issues."
    },
    {
      icon: <Calendar className="h-6 w-6 text-brand" />,
      title: "Timeline",
      description: "Refund requests must be submitted within 7 days of payment. Requests made after this period will not be considered."
    }
  ];

  const nonRefundable = [
    "Completed course usage",
    "Misuse of services",
    "Violations of platform policies",
    "Change of mind after significant content consumption"
  ];

  return (
    <div className="min-h-screen bg-bg-deep py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-brand/10 px-4 py-2 rounded-full mb-6 border border-brand/20"
          >
            <CreditCard className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">Payment Protection</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-slate-50 mb-8"
          >
            Refund Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl"
          >
            Transparent information about our refund process and eligibility criteria.
          </motion.p>
        </div>

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {policies.map((policy, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[32px] bg-slate-900 border border-border-strong hover:border-brand/30 transition-all"
            >
              <div className="mb-6 p-4 rounded-2xl bg-brand/10 w-fit">{policy.icon}</div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-50 mb-3">{policy.title}</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">{policy.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Non-Refundable Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-10 rounded-[40px] bg-red-500/5 border border-red-500/10 mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-50">Non-Refundable Scenarios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonRefundable.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/50 border border-border-strong">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-slate-400">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center p-12 bg-slate-900 border border-border-strong rounded-[40px] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-brand/5 to-transparent"></div>
          <div className="relative z-10">
            <ShieldCheck className="h-12 w-12 text-brand mx-auto mb-6" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-50 mb-4">Refund Support</h2>
            <p className="text-slate-400 font-medium mb-8">If you believe you are eligible for a refund due to technical or billing issues, please contact us.</p>
            
            <div className="inline-flex items-center gap-3 bg-brand p-5 rounded-2xl shadow-xl shadow-brand/20 group-hover:scale-105 transition-transform">
              <Mail className="h-5 w-5 text-white" />
              <span className="text-sm font-black uppercase tracking-widest text-white">biswalsatyasubham274@gmail.com</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
