import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const BookUploader = ({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    // This pushes the file directly to your 'books' bucket
    const { data, error } = await supabase.storage
      .from('books')
      .upload(`${Date.now()}_${file.name}`, file);

    if (error) {
      alert("Upload error: " + error.message);
    } else {
      const { data: urlData } = supabase.storage.from('books').getPublicUrl(data.path);
      onUploadSuccess(urlData.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800">
      <input type="file" accept="application/pdf" onChange={uploadFile} disabled={uploading} className="text-white text-sm" />
      {uploading && <p className="text-brand text-xs mt-2">Uploading to Supabase...</p>}
    </div>
  );
};