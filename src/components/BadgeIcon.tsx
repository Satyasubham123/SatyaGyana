import React from 'react';
import { Award, Zap, Target, Book, Star, ShieldCheck } from 'lucide-react';
import { CLASS_LEVELS, INDIA_STATES_AND_UTS } from '../lib/profileOptions';

interface BadgeIconProps {
  name: string;
  size?: number;
  className?: string;
}

const BADGE_MAP: Record<string, { icon: React.ReactNode, color: string }> = {
  'Early Bird': { icon: <Zap />, color: 'text-amber-500' },
  'Quick Thinker': { icon: <Target />, color: 'text-brand' },
  'Quiz Master': { icon: <Award />, color: 'text-indigo-500' },
  'Avid Reader': { icon: <Book />, color: 'text-emerald-500' },
  'Elite': { icon: <Star />, color: 'text-purple-500' },
  'Protector': { icon: <ShieldCheck />, color: 'text-blue-500' },
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({ name, size = 20, className = '' }) => {
  const badge = BADGE_MAP[name] || { icon: <Award />, color: 'text-white/20' };
  
  return (
    <div className={`p-2 bg-bg-card border border-border-strong rounded-sm inline-flex items-center justify-center ${badge.color} ${className}`}>
      {React.cloneElement(badge.icon as React.ReactElement<any>, { size })}
    </div>
  );
};
