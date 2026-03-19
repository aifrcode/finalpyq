import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { LogIn, LogOut, Search, Upload, Shield, BookOpen, User } from 'lucide-react';
import { motion } from 'motion/react';

export function Header() {
  const { user, profile, signIn, signOut } = useAuth();

  return (
    <header className="border-b border-white/10 bg-[#050505] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="w-8 h-8 text-emerald-500" />
            <span className="text-xl font-bold tracking-tighter text-white uppercase">GBU PORTAL</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-gray-400 hover:text-emerald-500 transition-colors">Search</Link>
            <Link to="/upload" className="text-sm font-medium text-gray-400 hover:text-emerald-500 transition-colors">Upload</Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-gray-400 hover:text-emerald-500 transition-colors">Admin</Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                    {profile?.role || 'STUDENT'}
                  </span>
                  <span className="text-sm font-medium text-white">{profile?.name || user.displayName || 'Anonymous'}</span>
                </div>
                <button 
                  onClick={signOut}
                  className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-gray-400"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <BookOpen className="w-6 h-6 text-emerald-500" />
                <span className="text-lg font-bold tracking-tighter text-white uppercase">GBU PORTAL</span>
              </Link>
            </div>
            <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">
              Made by GBU student
            </p>
          </div>
          <div>
            <h4 className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Search Papers</Link></li>
              <li><Link to="/upload" className="hover:text-white transition-colors">Contribute</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About GBU</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600 font-mono">© 2026 GBU PORTAL. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-600 hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-600 hover:text-emerald-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-black">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
