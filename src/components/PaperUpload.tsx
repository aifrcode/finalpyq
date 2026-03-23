import React, { useState, useRef } from 'react';
import { useAuth } from '../useAuth';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { supabase } from '../supabase';
import { School, ExamType, SCHOOLS, EXAM_TYPES, SEMESTERS } from '../types';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

export function PaperUpload() {
  const { user, profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    subjectCode: '',
    school: '' as School | '',
    examType: '' as ExamType | '',
    semester: '' as number | '',
    year: new Date().getFullYear()
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `${fileName}`;

    // Supabase JS SDK doesn't have a native progress listener for simple uploads, 
    // but we can simulate it or just show a loader. 
    // For now, we'll just set it to 50% then 100% on completion.
    setUploadProgress(10);

    const { data, error } = await supabase.storage
      .from('papers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    setUploadProgress(90);

    const { data: { publicUrl } } = supabase.storage
      .from('papers')
      .getPublicUrl(filePath);

    setUploadProgress(100);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.school || !formData.examType || !formData.semester) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const pdfUrl = await uploadToSupabase(file);

      try {
        await addDoc(collection(db, 'papers'), {
          ...formData,
          pdfUrl,
          uploaderUid: user ? user.uid : 'anonymous',
          status: 'pending',
          downloadCount: 0,
          createdAt: serverTimestamp()
        });
        toast.success('Paper submitted successfully!');
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.CREATE, 'papers', 'PaperUpload: Save to Firestore');
      }

      setSuccess(true);
      setFile(null);
      setFormData({
        title: '',
        subjectCode: '',
        school: '',
        examType: '',
        semester: '',
        year: new Date().getFullYear()
      });
    } catch (err: any) {
      console.error('Upload Process Error:', err);
      let errorMessage = 'Failed to upload paper. Please try again.';
      
      // Check if it's a Firestore error (JSON string)
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          errorMessage = `[Database Error] ${parsed.error}. (Context: ${parsed.context || 'Unknown'})`;
        }
      } catch (e) {
        // Not a JSON error, use the raw message if available
        errorMessage = err.message || errorMessage;
      }

      // Special handling for Supabase config errors
      if (errorMessage.includes('Supabase configuration is missing')) {
        errorMessage = 'Supabase configuration is missing. Please check your AI Studio Secrets.';
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Removed access check for staff/admin only


  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">CONTRIBUTE PAPER</h1>
        <p className="text-gray-500">
          Anybody can contribute previous year question papers. 
          No sign-in required for uploads. All submissions are reviewed by an administrator before appearing in the portal.
        </p>
      </div>

      {success ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-12 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center"
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">UPLOAD SUCCESSFUL</h2>
          <p className="text-gray-400 mb-8">Your paper has been submitted and is currently pending review by an administrator.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
          >
            UPLOAD ANOTHER
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center ${isDragging ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' : file ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf"
            />
            {file ? (
              <div className="w-full flex flex-col items-center">
                <FileText className="w-12 h-12 text-emerald-500 mb-4" />
                <span className="text-white font-medium">{file.name}</span>
                <span className="text-xs text-gray-500 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                
                {previewUrl && (
                  <div className="mt-6 w-full p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3 text-emerald-500">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-tight">PDF Document Ready</span>
                    </div>
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-emerald-500 underline transition-colors"
                    >
                      Open preview in new tab
                    </a>
                  </div>
                )}

                {uploading && (
                  <div className="mt-6 w-full">
                    <div className="flex justify-between text-[10px] font-mono text-emerald-500 mb-1">
                      <span>UPLOADING</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-600 mb-4" />
                <span className="text-white font-medium">
                  {isDragging ? 'Drop PDF here' : 'Click or drag PDF here'}
                </span>
                <span className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Paper Title</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Data Structures & Algorithms"
                className="w-full p-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Subject Code</label>
              <input 
                required
                type="text" 
                placeholder="e.g. CS-301"
                className="w-full p-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">School</label>
              <select 
                required
                className="w-full p-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors [&>option]:bg-black"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value as School })}
              >
                <option value="">Select School</option>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Exam Type</label>
              <select 
                required
                className="w-full p-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors [&>option]:bg-black"
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value as ExamType })}
              >
                <option value="">Select Exam Type</option>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Semester</label>
              <select 
                required
                className="w-full p-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors [&>option]:bg-black"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value ? parseInt(e.target.value) : '' })}
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Year</label>
              <input 
                required
                type="number" 
                className="w-full p-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            disabled={uploading || !file}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                UPLOADING...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                SUBMIT FOR REVIEW
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
