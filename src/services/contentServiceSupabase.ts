import { supabase } from '../lib/supabase';

// 1. COURSES
export const getCourses = async (includeArchived: boolean = false) => {
  let query = supabase.from('courses').select('*');
  if (!includeArchived) query = query.eq('is_archived', false);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addCourse = async (course: any) => {
  const { data, error } = await supabase.from('courses').insert([course]).select();
  if (error) throw error;
  return data[0];
};

export const updateCourse = async (id: string, updates: any) => {
  const { data, error } = await supabase.from('courses').update(updates).eq('id', id);
  if (error) throw error;
  return data;
};

export const deleteCourse = async (id: string) => {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
};

// 2. SECTIONS
export const getSections = async (courseId: string) => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data;
};

export const addSection = async (courseId: string, section: any) => {
  const { data, error } = await supabase.from('sections').insert([{ ...section, course_id: courseId }]).select();
  if (error) throw error;
  return data[0];
};

export const updateSection = async (courseId: string, sectionId: string, updates: any) => {
  const { error } = await supabase.from('sections').update(updates).eq('id', sectionId);
  if (error) throw error;
};

export const deleteSection = async (courseId: string, sectionId: string) => {
  const { error } = await supabase.from('sections').delete().eq('id', sectionId);
  if (error) throw error;
};

// 3. PLAYLISTS
export const getPlaylists = async (courseId: string, sectionId: string) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data;
};

export const addPlaylist = async (courseId: string, sectionId: string, playlist: any) => {
  const { data, error } = await supabase.from('playlists').insert([{ ...playlist, section_id: sectionId }]).select();
  if (error) throw error;
  return data[0];
};

export const updatePlaylist = async (courseId: string, sectionId: string, playlistId: string, updates: any) => {
  const { error } = await supabase.from('playlists').update(updates).eq('id', playlistId);
  if (error) throw error;
};

export const deletePlaylist = async (courseId: string, sectionId: string, playlistId: string) => {
  const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
  if (error) throw error;
};

// 4. LESSONS
export const getLessons = async (courseId: string, sectionId: string, playlistId: string) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data;
};

export const addLesson = async (courseId: string, sectionId: string, playlistId: string, lesson: any) => {
  const { data, error } = await supabase.from('lessons').insert([{ ...lesson, playlist_id: playlistId }]).select();
  if (error) throw error;
  return data[0];
};

export const updateLesson = async (courseId: string, sectionId: string, playlistId: string, lessonId: string, updates: any) => {
  const { error } = await supabase.from('lessons').update(updates).eq('id', lessonId);
  if (error) throw error;
};

export const deleteLesson = async (courseId: string, sectionId: string, playlistId: string, lessonId: string) => {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw error;
};

export const moveLesson = async (
  oldCourseId: string, oldSectionId: string, oldPlaylistId: string, lessonId: string,
  newCourseId: string, newSectionId: string, newPlaylistId: string
) => {
  const { error } = await supabase
    .from('lessons')
    .update({ playlist_id: newPlaylistId })
    .eq('id', lessonId);
  if (error) throw error;
};

// 5. SUBMISSIONS
export const getSubmissions = async (lessonId?: string) => {
  let query = supabase.from('submissions').select('*');
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const gradeSubmission = async (submissionId: string, updates: { score: number, feedback: string }) => {
  const { error } = await supabase
    .from('submissions')
    .update({ 
      status: 'graded', 
      score: updates.score, 
      feedback: updates.feedback,
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId);
    
  if (error) throw error;
};

// 5. DUPLICATION
export const duplicateCourse = async (courseId: string) => {
  // Fetch original course
  const { data: original, error: fetchErr } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (fetchErr || !original) throw fetchErr;

  // Create copy
  const { id, created_at, ...rest } = original;
  const { data, error } = await supabase
    .from('courses')
    .insert([{
      ...rest,
      title: `${original.title} (Copy)`,
      is_published: false
    }])
    .select();

  if (error) throw error;
  return data[0];
};