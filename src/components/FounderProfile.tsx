import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Linkedin, Twitter, Github, Quote } from 'lucide-react';
import { founderService, FounderProfileData } from '../services/founderService';

interface FounderProfileProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function FounderProfile({ className = '', variant = 'full' }: FounderProfileProps) {
  const [founder, setFounder] = useState<FounderProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    founderService.getProfile().then(data => {
      setFounder(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-slate-200 dark:bg-slate-800 h-64 rounded-3xl" />
      </div>
    );
  }

  if (!founder) return null;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 p-4 bg-white/5 dark:bg-slate-900 border border-border-strong rounded-2xl ${className}`}>
        <img 
          src={founder.photoURL} 
          alt={founder.name} 
          className="w-12 h-12 rounded-full object-cover border-2 border-brand"
        />
        <div>
          <h4 className="text-sm font-black text-main uppercase tracking-tight">{founder.name}</h4>
          <p className="text-[10px] text-muted font-black uppercase tracking-wider">{founder.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Quote className="w-32 h-32 text-brand" />
      </div>

      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-border-strong p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="shrink-0 relative"
          >
            <div className="absolute inset-0 bg-brand/20 rounded-full blur-2xl group-hover:bg-brand/30 transition-all" />
            <img 
              src={founder.photoURL} 
              alt={founder.name} 
              className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-2xl relative z-10"
            />
          </motion.div>

          <div className="flex-1 text-center md:text-left space-y-6">
            <div>
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-brand"
              >
                Meet the Founder
              </motion.span>
              <h3 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-main mt-2">
                {founder.name}
              </h3>
              <p className="text-sm md:text-lg font-black uppercase tracking-widest text-muted mt-1 italic">
                {founder.title}
              </p>
            </div>

            <div className="relative">
              <Quote className="absolute -top-4 -left-6 w-8 h-8 text-brand/20 hidden md:block" />
              <p className="text-lg md:text-2xl font-medium text-main leading-relaxed italic pr-4">
                "{founder.mission}"
              </p>
            </div>

            <p className="text-secondary text-base md:text-lg font-medium leading-8 max-w-2xl">
              {founder.bio}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4 pt-4">
              {founder.socialLinks?.linkedin && (
                <a href={founder.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand transition-all rounded-xl border border-border-strong">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {founder.socialLinks?.twitter && (
                <a href={founder.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand transition-all rounded-xl border border-border-strong">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {founder.socialLinks?.github && (
                <a href={founder.socialLinks.github} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand transition-all rounded-xl border border-border-strong">
                  <Github className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
