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
  name: 'Satyasubham Biswal',
  title: 'Founder & Creator of GyanMitra AI',
  mission: 'Empowering students with AI-driven personalized learning paths to achieve academic excellence.',
  bio: 'A visionary educator and developer dedicated to bridging the gap between artificial intelligence and classroom learning.',
  photoURL: 'https://example.com/new_founder_photo.jpg',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/in/satyasubham-biswal',
    twitter: 'https://twitter.com'
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
