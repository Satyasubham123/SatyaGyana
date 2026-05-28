import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Target, BookOpen, Clock, Heart, Users, Shield, Globe } from 'lucide-react';

import { FounderProfile } from '../components/FounderProfile';

export default function About() {
  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-brand" />,
      title: "AI Teacher Assistant",
      description: "Get instant explanations and answers to your doubts 24/7."
    },
    {
      icon: <Target className="h-6 w-6 text-brand" />,
      title: "Smart Quizzes",
      description: "Adaptive testing that focuses on your weak areas to improve results."
    },
    {
      icon: <BookOpen className="h-6 w-6 text-brand" />,
      title: "Study Material",
      description: "Structured notes and NCERT-aligned content for Class 6-10."
    },
    {
      icon: <Globe className="h-6 w-6 text-brand" />,
      title: "Multilingual Support",
      description: "Learn in English, Hindi, and soon in Odia for better understanding."
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
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">The Mission</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-slate-50 mb-8"
          >
            SatyaGyana AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl"
          >
            An AI-powered learning platform designed specifically for Indian students from Class 6 to Class 10.
          </motion.p>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-50">Our Vision</h2>
            <p className="text-slate-400 font-medium leading-loose">
              Our mission is to make quality education simple, smart, and accessible for every student through AI learning tools, quizzes, notes, books, and interactive study systems.
            </p>
            <p className="text-slate-400 font-medium leading-loose">
              SatyaGyana AI helps students learn in simple English and Hindi, with future support for Odia language. The platform is specially designed for mobile users and students who want affordable and effective learning support.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900 p-8 rounded-[32px] border border-border-strong relative group overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand/20 transition-all"></div>
             <p className="text-slate-200 font-bold leading-relaxed relative z-10 italic">
               "We believe education should be available anytime, anywhere, and should not depend only on regular classroom teaching."
             </p>
             <div className="mt-8 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                 <Heart className="h-5 w-5 text-brand" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Founded for</p>
                 <p className="text-sm font-black uppercase tracking-tighter text-slate-50">Indian Students</p>
               </div>
             </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-3xl bg-slate-900 border border-border-strong hover:border-brand/40 transition-all"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-50 mb-3">{feature.title}</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Founder Section */}
        <div className="mb-24">
           <FounderProfile />
        </div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center p-12 bg-brand/5 border border-brand/10 rounded-[40px]"
        >
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand mb-4">Join the Revolution</h2>
          <p className="text-slate-400 font-medium mb-8">Thank you for learning with GyanMitra AI. Together, we are redefining the future of education in India.</p>
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center">
              <Users className="h-6 w-6 text-brand mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Student First</span>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="h-6 w-6 text-brand mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Safe Learning</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="h-6 w-6 text-brand mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">24/7 Access</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
