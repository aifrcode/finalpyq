import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './useAuth';
import { Layout } from './components/Layout';
import { PaperSearch } from './components/PaperSearch';
import { PaperCard } from './components/PaperCard';
import { PaperUpload } from './components/PaperUpload';
import { AdminDashboard } from './components/AdminDashboard';
import { db, collection, query, where, onSnapshot, orderBy, limit } from './firebase';
import { Paper, School, ExamType } from './types';
import { BookOpen, Download, Users, FileText, ArrowRight, Loader2, Search, Shield } from 'lucide-react';
import { motion } from 'motion/react';

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
    });

    return () => {
      unsubscribeStats();
      unsubscribePapers();
    };
  }, [filters]);

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden bg-grid-white">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="text-center space-y-12 relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em]"
          >
            <BookOpen className="w-4 h-4" />
            Gautam Buddha University Portal
          </motion.div>

          <div className="space-y-4">
            <motion.h1 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl md:text-9xl font-display font-bold text-white tracking-tighter leading-[0.85] uppercase"
            >
              ACADEMIC <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                MISSION CONTROL
              </span>
            </motion.h1>
          </div>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto font-sans leading-relaxed"
          >
            A centralized, community-driven archive for previous year question papers. 
            Search, download, and contribute to the GBU academic ecosystem.
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-16 pt-8"
          >
            <div className="flex flex-col items-center group">
              <span className="text-5xl font-display font-bold text-white tracking-tighter group-hover:text-emerald-500 transition-colors">{stats.totalPapers}</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">Papers Available</span>
            </div>
            <div className="flex flex-col items-center group">
              <span className="text-5xl font-display font-bold text-white tracking-tighter group-hover:text-emerald-500 transition-colors">{stats.totalDownloads}</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">Total Downloads</span>
            </div>
            <div className="flex flex-col items-center group">
              <span className="text-5xl font-display font-bold text-white tracking-tighter group-hover:text-emerald-500 transition-colors">8+</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">Schools Covered</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search & Results */}
      <section id="search" className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white tracking-tight">FIND YOUR PAPERS</h2>
          <p className="text-gray-500">Filter by subject, school, semester, or year.</p>
        </div>
        
        <PaperSearch onSearch={(f) => setFilters(f as any)} />

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {papers.length > 0 ? (
              papers.map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))
            ) : (
              <div className="col-span-full py-24 text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">NO PAPERS FOUND</h3>
                <p className="text-gray-500">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="p-12 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white tracking-tight">WANT TO CONTRIBUTE?</h2>
          <p className="text-gray-400 max-w-md">Help your fellow students by uploading previous year question papers. Every contribution counts!</p>
        </div>
        <Link 
          to="/upload" 
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all group"
        >
          START CONTRIBUTING
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<div className="text-center py-24"><h1 className="text-4xl font-bold">404 - NOT FOUND</h1></div>} />
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
