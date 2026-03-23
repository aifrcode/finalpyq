import { useState } from 'react';
import { Paper, School } from '../types';
import { Download, FileText, Calendar, GraduationCap, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, updateDoc, increment, addDoc, collection, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { supabase } from '../supabase';
import { useAuth } from '../useAuth';

interface PaperCardProps {
  paper: Paper;
  isAdminView?: boolean;
  onStatusChange?: (id: string, status: 'approved' | 'rejected') => void;
  onDelete?: (id: string) => void;
  key?: string;
}

export function PaperCard({ paper, isAdminView, onStatusChange, onDelete }: PaperCardProps) {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  const getPdfUrl = () => {
    if (!paper.pdfUrl) return '';
    // If it's already a full URL (legacy), return it
    if (paper.pdfUrl.startsWith('http')) return paper.pdfUrl;
    
    // Otherwise, construct the Supabase public URL
    const { data: { publicUrl } } = supabase.storage
      .from('papers')
      .getPublicUrl(paper.pdfUrl);
    return publicUrl;
  };

  const fullPdfUrl = getPdfUrl();

  const handleDownload = () => {
    // Log download count (non-blocking)
    updateDoc(doc(db, 'papers', paper.id), {
      downloadCount: increment(1)
    }).catch(console.error);
    
    addDoc(collection(db, 'downloads'), {
      paperId: paper.id,
      userUid: user ? user.uid : 'anonymous',
      timestamp: serverTimestamp()
    }).catch(console.error);

    window.open(fullPdfUrl, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative p-8 rounded-[2rem] border border-white/10 bg-white/5 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500 shadow-lg">
          <FileText className="w-7 h-7" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500/70 uppercase tracking-wider">
            <Download className="w-3 h-3" />
            <span>{paper.downloadCount || 0}</span>
          </div>
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-[0.2em]">{paper.subjectCode}</span>
          {isAdminView && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-mono border border-white/10">
              {getStatusIcon(paper.status)}
              <span className="uppercase tracking-wider">{paper.status}</span>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 group-hover:text-emerald-500 transition-colors leading-tight">
        {paper.title}
      </h3>

      <div className="grid grid-cols-2 gap-y-4 mb-8">
        <div className="flex items-center gap-2.5 text-xs text-gray-400">
          <GraduationCap className="w-4 h-4 text-emerald-500/50" />
          <span className="truncate">{paper.school}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-gray-400">
          <FileText className="w-4 h-4 text-emerald-500/50" />
          <span>{paper.examType}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-gray-400">
          <Clock className="w-4 h-4 text-emerald-500/50" />
          <span>Sem {paper.semester}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-gray-400">
          <Calendar className="w-4 h-4 text-emerald-500/50" />
          <span>Year {paper.year}</span>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6 rounded-2xl border border-white/10"
          >
            <iframe 
              src={fullPdfUrl} 
              className="w-full h-96 bg-white" 
              title={`Preview of ${paper.title}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4" />
              HIDE PREVIEW
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              PREVIEW PDF
            </>
          )}
        </button>

        <button 
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all"
        >
          <Download className="w-4 h-4" />
          DOWNLOAD PDF
        </button>
      </div>

      {isAdminView && (
        <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
          <div className="flex gap-2">
            {paper.status === 'pending' ? (
              <>
                <button 
                  onClick={() => onStatusChange?.(paper.id, 'approved')}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors"
                >
                  APPROVE
                </button>
                <button 
                  onClick={() => onStatusChange?.(paper.id, 'rejected')}
                  className="flex-1 py-2 rounded-xl border border-red-500/50 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors"
                >
                  REJECT
                </button>
              </>
            ) : (
              <button 
                onClick={() => onDelete?.(paper.id)}
                className="flex-1 py-2 rounded-xl border border-red-500/50 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors"
              >
                DELETE PAPER
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
