import { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './useAuth';
import { Layout } from './components/Layout';
import { PaperSearch } from './components/PaperSearch';
import { PaperCard } from './components/PaperCard';
import { PaperUpload } from './components/PaperUpload';
import { AdminDashboard } from './components/AdminDashboard';
import { VerificationModal } from './components/VerificationModal';
import { db, collection, query, where, onSnapshot, orderBy, handleFirestoreError, OperationType } from './firebase';
import { Paper, School, ExamType } from './types';
import { BookOpen, Download, Users, FileText, ArrowRight, Loader2, Search, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function ProtectedRoute({ children, requiredRole }: { children: ReactNode, requiredRole?: 'staff' | 'admin' }) {
  const { user, profile, signIn } = useAuth();
  const location = useLocation();

  const isAuthorized = profile && (
    (requiredRole === 'admin' && profile.role === 'admin') ||
    (requiredRole === 'staff' && (profile.role === 'staff' || profile.role === 'admin')) ||
    (!requiredRole && profile.verified)
  );

  if (!user || !isAuthorized) {
    return (
      <>
        <VerificationModal 
          isOpen={true} 
          onClose={() => window.location.href = '/'} 
          mode={!user ? 'unauthenticated' : 'unverified'}
        />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </>
    );
  }

  return <>{children}</>;
}

function Home() {
  const { user, profile, signIn } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPapers: 0, totalDownloads: 0 });
  const [filters, setFilters] = useState({ query: '', school: '' as School | '', examType: '' as ExamType | '', semester: '' as number | '', year: '' as number | '' });

  useEffect(() => {
    // Fetch stats
    const papersQuery = query(collection(db, 'papers'), where('status', '==', 'approved'));
    const unsubscribeStats = onSnapshot(papersQuery, (snapshot) => {
      const totalPapers = snapshot.size;
      const totalDownloads = snapshot.docs.reduce((acc, doc) => acc + (doc.data().downloadCount || 0), 0);
      setStats({ totalPapers, totalDownloads });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'papers', 'App: Fetch Stats');
    });

    // Fetch papers with filters
    let q = query(collection(db, 'papers'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
    
    const unsubscribePapers = onSnapshot(q, (snapshot) => {
      let filteredPapers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Paper[];
      
      // Apply client-side filtering for complex queries
      if (filters.query) {
        const queryLower = filters.query.toLowerCase();
        filteredPapers = filteredPapers.filter(p => 
          p.title.toLowerCase().includes(queryLower) || 
          p.subjectCode.toLowerCase().includes(queryLower)
        );
      }
      if (filters.school) {
        filteredPapers = filteredPapers.filter(p => p.school === filters.school);
      }
      if (filters.examType) {
        filteredPapers = filteredPapers.filter(p => p.examType === filters.examType);
      }
      if (filters.semester) {
        filteredPapers = filteredPapers.filter(p => p.semester === filters.semester);
      }
      if (filters.year) {
        filteredPapers = filteredPapers.filter(p => p.year === filters.year);
      }

      setPapers(filteredPapers);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'papers', 'App: Fetch Filtered Papers');
    });

    return () => {
      unsubscribeStats();
      unsubscribePapers();
    };
  }, [filters]);

  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none -z-10" />
        
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="text-center space-y-16 relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-emerald-500 uppercase tracking-[0.3em] shadow-xl backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            Academic Mission Control
          </motion.div>

          <div className="space-y-8">
            <motion.h1 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-8xl md:text-[10rem] font-display font-bold text-white tracking-tighter leading-[0.8] uppercase"
            >
              GBU <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 drop-shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                PORTAL
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-400 max-w-3xl mx-auto font-sans leading-relaxed tracking-wide"
            >
              A premium, community-driven archive for previous year question papers. 
              Search, download, and contribute to the GBU academic ecosystem with precision.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-20 pt-12"
          >
            <div className="flex flex-col items-center group cursor-default">
              <span className="text-6xl font-display font-bold text-white tracking-tighter group-hover:text-emerald-500 transition-all duration-500 group-hover:scale-110">{stats.totalPapers}</span>
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mt-3 group-hover:text-gray-300 transition-colors">Papers Available</span>
            </div>
            <div className="flex flex-col items-center group cursor-default">
              <span className="text-6xl font-display font-bold text-white tracking-tighter group-hover:text-emerald-500 transition-all duration-500 group-hover:scale-110">{stats.totalDownloads}</span>
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mt-3 group-hover:text-gray-300 transition-colors">Total Downloads</span>
            </div>
            <div className="flex flex-col items-center group cursor-default">
              <span className="text-6xl font-display font-bold text-white tracking-tighter group-hover:text-emerald-500 transition-all duration-500 group-hover:scale-110">8+</span>
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mt-3 group-hover:text-gray-300 transition-colors">Schools Covered</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="pt-16"
          >
            <a href="#search" className="inline-flex flex-col items-center gap-4 text-gray-500 hover:text-emerald-500 transition-colors group">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Explore Archive</span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ArrowRight className="w-6 h-6 rotate-90" />
              </motion.div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Search & Results */}
      <section id="search" className="space-y-16 scroll-mt-32">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold text-white tracking-tight uppercase">Archive Search</h2>
          <div className="h-1 w-20 bg-emerald-500 mx-auto rounded-full" />
          <p className="text-gray-500 max-w-lg mx-auto">Filter through thousands of papers by subject, school, semester, or year with our advanced search engine.</p>
        </div>
        
        <PaperSearch onSearch={(f) => setFilters(f as any)} />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] animate-pulse space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white/5" />
                  <div className="w-20 h-4 bg-white/5 rounded-full" />
                </div>
                <div className="space-y-3">
                  <div className="w-3/4 h-6 bg-white/5 rounded-lg" />
                  <div className="w-1/2 h-6 bg-white/5 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="w-full h-4 bg-white/5 rounded-md" />
                  <div className="w-full h-4 bg-white/5 rounded-md" />
                  <div className="w-full h-4 bg-white/5 rounded-md" />
                  <div className="w-full h-4 bg-white/5 rounded-md" />
                </div>
                <div className="w-full h-12 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {papers.length > 0 ? (
                papers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PaperCard paper={paper} />
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-32 text-center"
                >
                  <Search className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-tight">No Papers Found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden p-16 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-12 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -z-10 group-hover:bg-emerald-500/10 transition-colors" />
        
        <div className="space-y-6 text-center md:text-left">
          <h2 className="text-4xl font-bold text-white tracking-tight uppercase">Want to contribute?</h2>
          <p className="text-gray-400 max-w-md text-lg leading-relaxed">
            Help your fellow students by uploading previous year question papers. Every contribution strengthens our academic ecosystem.
          </p>
        </div>
        
        <Link 
          to="/upload" 
          className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all group shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        >
          START CONTRIBUTING
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Link>
      </section>
    </div>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<PaperUpload />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<div className="text-center py-32"><h1 className="text-5xl font-bold tracking-tighter">404 - NOT FOUND</h1></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
