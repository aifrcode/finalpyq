import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthModal } from './AuthModal';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'unauthenticated' | 'unverified';
  onSignIn?: () => void;
}

export function VerificationModal({ isOpen, onClose, mode = 'unverified' }: VerificationModalProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-8 shadow-2xl ${mode === 'unauthenticated' ? 'border-emerald-500/20 bg-[#0A0A0A]' : 'border-amber-500/20 bg-[#0A0A0A]'}`}
            >
              <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-transparent to-transparent ${mode === 'unauthenticated' ? 'via-emerald-500' : 'via-amber-500'}`} />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className={`rounded-2xl p-4 ${mode === 'unauthenticated' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {mode === 'unauthenticated' ? <Shield className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight uppercase">
                    {mode === 'unauthenticated' ? 'Staff Access Only' : 'Access Restricted'}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {mode === 'unauthenticated' 
                      ? 'You must be signed in as a staff member or administrator to access this section.' 
                      : 'Your account is not verified yet. Please contact admin for access to staff features.'}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 pt-4">
                  {mode === 'unauthenticated' ? (
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400 active:scale-95 transition-all"
                    >
                      SIGN IN AS STAFF
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="w-full rounded-xl bg-amber-500 py-3 font-bold text-black hover:bg-amber-400 active:scale-95 transition-all"
                    >
                      UNDERSTOOD
                    </button>
                  )}
                  <a
                    href="mailto:admin@gbu.ac.in"
                    className="w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                  >
                    CONTACT SUPPORT
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
