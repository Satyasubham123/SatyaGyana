import React, { useState, useEffect } from 'react';
import { fetchVideosByFilters, VideoLesson } from '../services/videoService';
import { Search } from 'lucide-react';
import { CLASS_LEVELS } from '../lib/profileOptions';

// Safely converts YouTube links into Embed players
const getEmbedUrl = (url: string) => {
  if (url.includes('/shorts/')) return url.replace('/shorts/', '/embed/');
  if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
  return url;
};

export default function VideoLibrary() {
  const [filters, setFilters] = useState({ classLevel: '', medium: '', subject: '' });
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      try {
        const vids = await fetchVideosByFilters(filters);
        setVideos(vids);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, [filters]);

  return (
    <div className="p-8 max-w-7xl mx-auto text-white min-h-screen">
      <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter text-brand">Video Lessons</h2>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <select className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none" onChange={e => setFilters({...filters, classLevel: e.target.value})}>
          <option value="">All Classes</option>
          {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none" onChange={e => setFilters({...filters, medium: e.target.value})}>
          <option value="">All Mediums</option>
          <option value="Odia">Odia</option>
          <option value="Hindi">Hindi</option>
          <option value="English">English</option>
        </select>
        <input placeholder="Search Subject..." className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none" onChange={e => setFilters({...filters, subject: e.target.value})} />
      </div>

      {/* Video Display Area */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading library...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((vid) => (
            <div key={vid.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col hover:border-brand transition-colors">
              <iframe 
                className="w-full aspect-[9/16] md:aspect-video"
                src={getEmbedUrl(vid.video_url)} 
                title={vid.title}
                allowFullScreen
              ></iframe>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="font-bold text-lg mb-3">{vid.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-brand font-medium">
                  <span className="bg-brand/10 px-2 py-1 rounded-md">{vid.class_level}</span>
                  <span className="bg-brand/10 px-2 py-1 rounded-md">{vid.medium}</span>
                  <span className="bg-brand/10 px-2 py-1 rounded-md">{vid.topic}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No videos found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}