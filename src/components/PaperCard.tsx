import { useState } from 'react';
import { Paper, School } from '../types';
import { Download, FileText, Calendar, GraduationCap, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db, doc, updateDoc, increment, addDoc, collection, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
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
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Record download
      try {
        await addDoc(collection(db, 'downloads'), {
          paperId: paper.id,
          userUid: user ? user.uid : 'anonymous',
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'downloads', 'PaperCard: Record Download');
      }

      // Increment download count
      try {
        await updateDoc(doc(db, 'papers', paper.id), {
          downloadCount: increment(1)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `papers/${paper.id}`, 'PaperCard: Increment Download Count');
      }

      // Open PDF in new tab - using a more reliable method for async contexts
      const link = document.createElement('a');
      link.href = paper.pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to record download. The PDF will still open.');
      window.open(paper.pdfUrl, '_blank');
    } finally {
      setDownloading(false);
    }
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
      whileHover={{ y: -4 }}
      className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-emerald-500/50 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{paper.subjectCode}</span>
          {isAdminView && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-[10px] font-mono">
              {getStatusIcon(paper.status)}
              <span className="uppercase">{paper.status}</span>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-500 transition-colors">
        {paper.title}
      </h3>

      <div className="grid grid-cols-2 gap-y-3 mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="truncate">{paper.school}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileText className="w-3.5 h-3.5" />
          <span>{paper.examType}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Sem {paper.semester}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Year {paper.year}</span>
        </div>
      </div>

      {isAdminView && (
        <div className="flex gap-2 mt-4">
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
      )}

      {!isAdminView && (
        <button 
          disabled={downloading}
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-emerald-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              PREPARING...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              DOWNLOAD PDF
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
