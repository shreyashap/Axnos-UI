'use client';

import React, { JSX, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Bot, 
  Zap, 
  Shield, 
  Cpu, 
  Loader2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface FormData {
  name: string;
  email: string;
  password: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export default function AuthPages(): JSX.Element {
  const router = useRouter();
  const [isSignIn, setIsSignIn] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!isSignIn) {
      if (!formData.name) {
        setError('Please enter your name');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (isSignIn) {
        const response = await apiService.signIn({
          email: formData.email,
          password: formData.password,
        });
        login(response.data.accessToken, response.data.userRes);
        router.push('/dashboard');
      } else {
        await apiService.signUp({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        setIsSignIn(true);
        setError('Account created! Please sign in.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (): void => {
    setIsSignIn(!isSignIn);
    setFormData({ name: '', email: '', password: '' });
    setShowPassword(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob top-[-10%] left-[-10%] scale-150 opacity-20" />
        <div className="blob bottom-[-10%] right-[-10%] scale-150 opacity-20" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, 
            backgroundSize: '40px 40px' 
          }} 
        />
      </div>

      <motion.div 
        className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:block space-y-10 px-8">
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30 shadow-glow">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter">
                Axnos<span className="text-primary italic">AI</span>
              </h1>
            </div>
            <p className="text-xl text-zinc-400 font-light leading-relaxed">
              Step into the next evolution of <br />
              <span className="text-white font-medium">context-aware intelligence.</span>
            </p>
          </motion.div>

          <div className="space-y-6">
            <AuthFeature 
              icon={<Zap className="w-5 h-5" />} 
              title="Instant Latency" 
              desc="The speed you need for high-velocity logic." 
            />
            <AuthFeature 
              icon={<Shield className="w-5 h-5" />} 
              title="Secure Context" 
              desc="Your data is localized and never shared." 
            />
            <AuthFeature 
              icon={<Cpu className="w-5 h-5" />} 
              title="Neural Scale" 
              desc="Scaling intelligence across your entire workflow." 
            />
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-[2rem] p-8 md:p-12 border-primary/10 relative"
        >
          {/* Accent Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-3xl -z-10 rounded-full" />
          
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3 tracking-tight">
              {isSignIn ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-zinc-500">
              {isSignIn ? 'Enter your credentials to access AxnosAI' : 'Join the elite few defining the future'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isSignIn && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-700"
                    placeholder="John Doe"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-700"
                placeholder="you@axnos.ai"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all pr-14 placeholder:text-zinc-700"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-glow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group mt-4 overflow-hidden relative"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>{isSignIn ? 'Initialize Session' : 'Create Identity'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
              <motion.div 
                className="absolute inset-0 bg-white/10" 
                initial={false}
                whileHover={{ x: '100%', transition: { duration: 0.5 } }}
                style={{ left: '-100%' }}
              />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={switchMode}
              className="text-zinc-400 hover:text-primary transition-colors text-sm font-medium group"
            >
              {isSignIn ? "Don't have an identity?" : "Already recognized?"}{' '}
              <span className="text-primary font-bold ml-1 group-hover:underline decoration-2 underline-offset-4">
                {isSignIn ? 'Sign up' : 'Log in'}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function AuthFeature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="flex items-start gap-4 p-5 rounded-2xl glass-card transition-all hover:bg-white/5 border-white/5"
    >
      <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}