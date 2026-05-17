import React from 'react';
import { motion } from 'motion/react';
import { Scale, Book, User, CreditCard, Brain, ShieldAlert, RefreshCcw, CheckCircle } from 'lucide-react';

export default function Terms() {
  const termsList = [
    {
      icon: <Book className="h-6 w-6 text-brand" />,
      title: "1. Platform Usage",
      description: "The platform is intended for educational purposes only. Users should use the tools to enhance their learning journey."
    },
    {
      icon: <User className="h-6 w-6 text-brand" />,
      title: "2. Accounts",
      description: "Users are responsible for maintaining the security of their accounts and passwords. Any activity under your account is your responsibility."
    },
    {
      icon: <ShieldAlert className="h-6 w-6 text-brand" />,
      title: "3. Content",
      description: "Study materials, quizzes, and AI-generated content are provided for learning support. GyanMitra AI owns the rights to platform-specific content."
    },
    {
      icon: <CreditCard className="h-6 w-6 text-brand" />,
      title: "4. Payments",
      description: "Premium subscriptions and paid content are non-transferable. Fees paid for digital services are subject to our refund policy."
    },
    {
      icon: <Brain className="h-6 w-6 text-brand" />,
      title: "5. AI Responses",
      description: "AI-generated answers may occasionally contain errors. Students should verify important academic information with textbooks or teachers."
    },
    {
      icon: <ShieldAlert className="h-6 w-6 text-red-400" />,
      title: "6. Misuse",
      description: "Users must not misuse the platform, attempt hacking, or upload harmful content. Violation may lead to account termination."
    },
    {
      icon: <RefreshCcw className="h-6 w-6 text-brand" />,
      title: "7. Updates",
      description: "We may update features, policies, or services at any time to improve the user experience and maintain platform safety."
    }
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
            <Scale className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">Legal Framework</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-slate-50 mb-8"
          >
            Terms
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl"
          >
            By using GyanMitra AI, you agree to follow these terms of service.
          </motion.p>
        </div>

        {/* Terms List */}
        <div className="grid grid-cols-1 gap-6 mb-24">
          {termsList.map((term, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="p-8 rounded-[32px] bg-slate-900 border border-border-strong hover:border-brand/30 transition-all flex flex-col md:flex-row gap-6 items-start"
            >
              <div className="p-4 rounded-2xl bg-brand/10 shrink-0">
                {term.icon}
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-50 mb-3">{term.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">{term.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Agreement Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center p-12 bg-emerald-500/5 border border-emerald-500/10 rounded-[40px]"
        >
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-6" />
          <p className="text-slate-400 font-medium mb-2">By continuing to use the platform, you agree to these terms.</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Last updated: May 2026</p>
        </motion.div>
      </div>
    </div>
  );
}
