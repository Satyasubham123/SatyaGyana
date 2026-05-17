import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, BookOpen, UserCheck, Shield, CheckCircle2, Info } from 'lucide-react';

export default function Disclaimer() {
  const points = [
    {
      icon: <Info className="h-6 w-6 text-amber-400" />,
      title: "AI-Assisted Support",
      description: "GyanMitra AI provides AI-assisted educational support for students. This technology is mean to complement regular learning."
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      title: "Accuracy Notice",
      description: "While we aim for accuracy, AI-generated responses, quizzes, and explanations may occasionally contain mistakes. AI can hallucinate or misinterpret complex academic concepts."
    },
    {
      icon: <UserCheck className="h-6 w-6 text-emerald-400" />,
      title: "Verification Encouraged",
      description: "Students are encouraged to verify important academic information with textbooks, teachers, or official educational resources."
    },
    {
      icon: <Shield className="h-6 w-6 text-brand" />,
      title: "Learning Support System",
      description: "The platform is designed as a learning support system and not as an official educational authority or credential-issuing body."
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
            className="inline-flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-full mb-6 border border-amber-500/20"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Legal Disclaimer</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-slate-50 mb-8"
          >
            Disclaimer
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl"
          >
            Important information about the boundaries and nature of AI-generated content on our platform.
          </motion.p>
        </div>

        {/* Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {points.map((point, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[32px] bg-slate-900 border border-border-strong hover:border-amber-500/30 transition-all flex flex-col gap-6"
            >
              <div className="p-4 rounded-2xl bg-slate-800/50 w-fit">
                {point.icon}
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-50 mb-3">{point.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{point.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Note */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-12 rounded-[40px] bg-brand/5 border border-brand/10 text-center"
        >
          <BookOpen className="h-12 w-12 text-brand mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-50 mb-4">Learn Responsibly</h2>
          <p className="text-slate-400 font-medium max-w-lg mx-auto">
            GyanMitra AI is your friend in learning, but your textbooks and teachers remain the primary sources of truth for your school curriculum.
          </p>
          <div className="mt-8 flex justify-center items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified Knowledge First</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
