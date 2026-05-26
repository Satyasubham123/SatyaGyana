import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const BookUploader = ({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's actually a PDF
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file only.");
      return;
    }

    setUploading(true);

    // 🚀 FIX: Generate a short, unique filename (e.g., "book_17167245.pdf")
    // This avoids all issues with special characters or long paths
    const fileExt = file.name.split('.').pop();
    const fileName = `book_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('books')
        .upload(filePath, file);

      if (error) {
        console.error("Supabase Error Details:", error);
        throw error;
      }

      const { data: urlData } = supabase.storage.from('books').getPublicUrl(data.path);
      onUploadSuccess(urlData.publicUrl);
      alert("Upload successful!");
    } catch (err: any) {
      alert("Upload failed. Check console for details: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800">
      <input 
        type="file" 
        accept="application/pdf" 
        onChange={uploadFile} 
        disabled={uploading} 
        className="text-white text-sm w-full cursor-pointer" 
      />
      {uploading && <p className="text-brand text-xs mt-2 animate-pulse">Synchronizing to Supabase...</p>}
    </div>
  );
};