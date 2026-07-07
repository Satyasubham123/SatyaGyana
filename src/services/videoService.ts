import { supabase } from '../lib/supabase';

export interface VideoLesson {
  id?: string;
  title: string;
  video_url: string;
  class_level: string;
  medium: string;
  subject: string;
  topic: string;
  created_at?: string;
}

export const addVideoLink = async (data: Omit<VideoLesson, 'id' | 'created_at'>) => {
  const { data: result, error } = await supabase
    .from('video_lessons')
    .insert([data])
    .select();

  if (error) {
    console.error("Supabase Insert Error:", error);
    throw error;
  }
  return result;
};

export const fetchVideosByFilters = async (filters: { classLevel?: string; medium?: string; subject?: string }) => {
  let query = supabase
    .from('video_lessons')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.classLevel) query = query.eq('class_level', filters.classLevel);
  if (filters.medium) query = query.eq('medium', filters.medium);
  if (filters.subject) query = query.ilike('subject', `%${filters.subject}%`);

  const { data, error } = await query;
  if (error) {
    console.error("Supabase Fetch Error:", error);
    throw error;
  }
  return data as VideoLesson[];
};