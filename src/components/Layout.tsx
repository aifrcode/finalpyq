import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { LogIn, LogOut, Search, Upload, Shield, BookOpen, User, Menu, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { AuthModal } from './AuthModal';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Search', icon: Search },
    { to: '/upload', label: 'Upload', icon: Upload },
  ];

  if (profile?.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/10 backdrop-blur-lg shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="flex items-center gap-2 hover:scale-105 transition-transform"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <BookOpen className="w-8 h-8 text-emerald-500" />
            <span className="text-xl font-bold tracking-tighter text-white uppercase">GBU PORTAL</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className={`text-sm font-medium transition-colors ${location.pathname === link.to ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-500'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest leading-none mb-1">
                      {profile?.role || 'STUDENT'}
                    </span>
                    <span className="text-sm font-medium text-white leading-none">{profile?.name || user.displayName || 'Anonymous'}</span>
                  </div>
                  <button 
                    onClick={signOut}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-gray-400 group"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5 group-hover:text-emerald-500 transition-colors" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-[#0A0A0A] overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${location.pathname === link.to ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-tight">{link.label}</span>
                </Link>
              ))}
              
              {user && (
                <div className="pt-4 border-t border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{profile?.name || user.displayName || 'Anonymous'}</span>
                        <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">{profile?.role || 'STUDENT'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border border-red-500/20 text-red-500 font-bold hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      SIGN OUT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer({ onStaffAccess }: { onStaffAccess: () => void }) {
  const { user } = useAuth();
  
  return (
    <footer className="border-t border-white/10 bg-[#050505] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
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

          <div>
            <h4 className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4">Administration</h4>
            {!user ? (
              <button 
                onClick={onStaffAccess}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-500 transition-colors group"
              >
                <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Staff Access
              </button>
            ) : (
              <p className="text-xs text-gray-600 italic">Logged in as staff member</p>
            )}
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-black">
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#151515',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#000',
            },
          },
        }}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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
      <Footer onStaffAccess={() => setIsAuthModalOpen(true)} />
    </div>
  );
}
