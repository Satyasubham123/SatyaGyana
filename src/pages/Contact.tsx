import React from 'react';
import { motion } from 'motion/react';
import { Mail, Clock, MessageSquare, AlertCircle, CreditCard, BookOpen, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6 text-brand" />,
      title: "Email Support",
      value: "satyagyanaEdu@gmail.com",
      description: "Direct line for all official inquiries and support."
    },
    {
      icon: <Clock className="h-6 w-6 text-brand" />,
      title: "Support Hours",
      value: "Sunday: 9:00 AM – 8:00 PM IST",
      description: "Dedicated support window for students and parents."
    }
  ];

  const helpTopics = [
    {
      icon: <AlertCircle className="h-5 w-5 text-red-400" />,
      title: "Technical Issues",
      description: "App crashes, loading errors, or account access problems."
    },
    {
      icon: <CreditCard className="h-5 w-5 text-emerald-400" />,
      title: "Payment Problems",
      description: "Subscription issues, refund requests, or payment processing."
    },
    {
      icon: <BookOpen className="h-5 w-5 text-brand" />,
      title: "Learning Support",
      description: "Questions about AI teacher responses or study materials."
    },
    {
      icon: <HelpCircle className="h-5 w-5 text-amber-400" />,
      title: "Quiz & Account Help",
      description: "Score discrepancies or profile management assistance."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-brand/10 px-4 py-2 rounded-full mb-6 border border-brand/20"
          >
            <MessageSquare className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">Connect With Us</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-slate-50 mb-8"
          >
            Contact
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl"
          >
            Need help or have questions? We are here to support students and parents.
          </motion.p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {contactInfo.map((info, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[32px] bg-slate-900 border border-border-strong hover:border-brand/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand/10 transition-all"></div>
              <div className="mb-6 p-4 rounded-2xl bg-brand/10 w-fit">{info.icon}</div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{info.title}</h3>
              <p className="text-xl font-black italic tracking-tighter text-slate-50 mb-4">{info.value}</p>
              <p className="text-sm text-slate-400 font-medium">{info.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Topics Section */}
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-50">How Can We Help?</h2>
            <div className="flex-1 h-[1px] bg-border-strong"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpTopics.map((topic, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-5 p-6 rounded-3xl bg-slate-900/50 border border-border-strong hover:border-slate-700 transition-colors"
              >
                <div className="mt-1">{topic.icon}</div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-tighter text-slate-200 mb-1">{topic.title}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{topic.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-12 bg-white/5 border border-white/10 rounded-[40px] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <CheckCircle2 className="h-12 w-12 text-brand mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-50 mb-4">Thank You</h2>
            <p className="text-slate-400 font-medium max-w-md mx-auto">
              Thank you for using SatyaGyana AI. We strive to provide the best possible learning experience for every student.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
