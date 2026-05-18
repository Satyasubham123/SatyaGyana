import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FounderProfileData {
  name: string;
  title: string;
  mission: string;
  bio: string;
  photoURL: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

const DEFAULT_FOUNDER: FounderProfileData = {
  name: 'Satya Subham Biswal',
  title: 'Founder & Creator of GyanMitra AI',
  mission: 'Empowering students with AI-driven personalized learning paths to achieve academic excellence.',
  bio: 'A visionary educator and developer dedicated to bridging the gap between artificial intelligence and classroom learning.',
  photoURL: 'https://lh3.googleusercontent.com/d/10NsSMe5q9f4SzlPqzolp1BY33gmeC_Os',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/in/satyasubham-biswal',
    twitter: 'https://x.com/SATYASUBHA53144'
  }
};

export const founderService = {
  async getProfile(): Promise<FounderProfileData> {
    try {
      const d = await getDoc(doc(db, 'settings', 'founder'));
      if (d.exists()) {
        return d.data() as FounderProfileData;
      }
      return DEFAULT_FOUNDER;
    } catch (err) {
      console.error("Error fetching founder profile:", err);
      return DEFAULT_FOUNDER;
    }
  },

  async updateProfile(data: FounderProfileData) {
    await setDoc(doc(db, 'settings', 'founder'), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }
};
