import React, { useState } from 'react';
import { imageService } from '../services/imageService';
import { MapPin, FlaskConical, Palette, BookOpenText, Loader2, Download, Image as ImageIcon } from 'lucide-react';

const SUBJECTS = [
  { id: 'map', name: 'Geography', icon: MapPin },
  { id: 'science diagram', name: 'Science', icon: FlaskConical },
  { id: 'historical artifact', name: 'History', icon: BookOpenText },
  { id: 'artistic concept', name: 'Art', icon: Palette }
];

export const AIVisualizer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[1].id);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setImageUrl(null);
    
    try {
      const url = await imageService.generateImage(prompt, subject);
      setImageUrl(url);
    } catch (error) {
      alert("Oops! The AI failed to draw that. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ImageIcon className="text-indigo-600 w-8 h-8" />
          AI Study Visuals
        </h1>
        <p className="text-gray-600 mt-2">Generate custom maps, diagrams, and historical art instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Controls */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">1. Choose Subject</h2>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  className={`p-3 rounded-lg border text-sm flex flex-col items-center gap-2 transition ${
                    subject === s.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">2. Describe It</h2>
            <textarea
              className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-100 outline-none"
              rows={4}
              placeholder="e.g., A cross-section of a plant cell..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
              className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
              {isLoading ? 'Drawing (10s)...' : 'Generate Visual'}
            </button>
          </div>
        </div>

        {/* Right Side: Image Display */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
          {isLoading ? (
            <div className="text-center text-gray-400">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
              <p>The AI is painting your study visual...</p>
            </div>
          ) : imageUrl ? (
            <div className="w-full flex flex-col items-center">
              <img src={imageUrl} alt="Generated Study Visual" className="rounded-lg shadow-md max-h-[500px] object-contain border" />
              <a href={imageUrl} download="gyanmitra-visual.png" className="mt-6 flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg transition">
                <Download className="w-4 h-4" /> Download Image
              </a>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Your generated visual will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};