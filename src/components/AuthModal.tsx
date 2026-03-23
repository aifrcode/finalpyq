import { useState } from 'react';
import { X, Mail, Lock, User, Shield, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        onClose();
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
        onClose();
      } else {
        await resetPassword(email);
        setSuccess('Password reset email sent! Please check your inbox.');
        setTimeout(() => setMode('signin'), 3000);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0A0A] p-6 sm:p-8 shadow-2xl my-auto"
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 text-emerald-500 mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                {mode === 'signin' ? 'Staff Sign In' : mode === 'signup' ? 'Staff Sign Up' : 'Reset Password'}
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                {mode === 'signin' 
                  ? 'Access staff features' 
                  : mode === 'signup' 
                    ? 'Create a staff account'
                    : 'Enter your email to reset password'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {mode !== 'forgot' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    required
                    type="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {mode === 'signin' && (
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] text-emerald-500 hover:underline font-mono uppercase tracking-wider"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-[10px] text-center font-mono uppercase tracking-wider">{error}</p>
              )}
              {success && (
                <p className="text-emerald-500 text-[10px] text-center font-mono uppercase tracking-wider">{success}</p>
              )}

              <button
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'signin' ? 'SIGN IN' : mode === 'signup' ? 'SIGN UP' : 'SEND RESET LINK'}
              </button>
            </form>

            {mode !== 'forgot' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#0A0A0A] px-3 text-gray-500 font-mono tracking-widest">Or</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white text-sm font-medium"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                  GOOGLE
                </button>
              </>
            )}

            <div className="text-center mt-6 text-xs text-gray-500">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-emerald-500 font-bold hover:underline">Sign Up</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setMode('signin')} className="text-emerald-500 font-bold hover:underline">Sign In</button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
