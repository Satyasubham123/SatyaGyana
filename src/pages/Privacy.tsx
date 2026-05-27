import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, Database, CreditCard, Mail, UserCheck } from 'lucide-react';

export default function Privacy() {
  const sections = [
    {
      icon: <Database className="h-6 w-6 text-brand" />,
      title: "Information We Collect",
      content: [
        "Name",
        "Email address",
        "Login information",
        "Quiz performance",
        "Learning progress",
        "Payment information (handled securely through payment providers)"
      ]
    },
    {
      icon: <Eye className="h-6 w-6 text-brand" />,
      title: "How We Use Data",
      content: [
        "To improve learning experience",
        "To provide personalized recommendations",
        "To manage accounts and subscriptions",
        "To improve AI learning systems"
      ]
    },
    {
      icon: <Lock className="h-6 w-6 text-brand" />,
      title: "Security",
      content: [
        "We use secure technologies and trusted services to protect student information."
      ]
    },
    {
      icon: <UserCheck className="h-6 w-6 text-brand" />,
      title: "Third-Party Services",
      content: [
        "We may use services like Firebase, Razorpay, and Google authentication to operate the platform securely."
      ]
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
            <Shield className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">Privacy Policy</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-slate-50 mb-8"
          >
            Privacy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl"
          >
            GyanMitra AI values your privacy and works to protect your personal information.
          </motion.p>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-8 mb-24">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[32px] bg-slate-900 border border-border-strong hover:border-brand/40 transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-brand/10 group-hover:bg-brand/20 transition-colors">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-50 mb-4">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-slate-400 font-medium flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Special Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[32px] bg-brand/5 border border-brand/10"
          >
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-brand mb-4">Children's Privacy</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              Our platform is designed for students, and we encourage parental guidance for younger users.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[32px] bg-slate-900 border border-border-strong"
          >
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-50 mb-4">Contact Us</h3>
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-brand" />
              <p className="text-slate-300 font-bold">satyagyanaEdu@gmail.com</p>
            </div>
            <p className="text-sm text-slate-500 font-medium">For privacy-related questions or data requests.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
