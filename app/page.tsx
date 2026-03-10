'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  ArrowRight, 
  Bot, 
  Cpu, 
  Zap, 
  Shield, 
  Globe, 
  MessageSquare,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function ScrollytellingLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use scroll for the whole page height
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Scene 1: Hero (0 - 0.25)
  const heroOpacity = useTransform(smoothProgress, [0, 0.2, 0.25], [1, 1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.25], [1, 0.8]);
  const heroY = useTransform(smoothProgress, [0, 0.25], [0, -100]);

  // Scene 2: Features (0.25 - 0.5)
  const featuresOpacity = useTransform(smoothProgress, [0.22, 0.3, 0.45, 0.5], [0, 1, 1, 0]);
  const featuresY = useTransform(smoothProgress, [0.2, 0.3, 0.45, 0.55], ["100vh", "0vh", "0vh", "-100vh"]);
  const featuresScale = useTransform(smoothProgress, [0.25, 0.35, 0.45, 0.55], [0.8, 1, 1, 0.8]);

  // Scene 3: Intelligence/AI (0.5 - 0.75)
  const aiOpacity = useTransform(smoothProgress, [0.47, 0.55, 0.7, 0.75], [0, 1, 1, 0]);
  const aiY = useTransform(smoothProgress, [0.45, 0.55, 0.7, 0.8], ["100vh", "0vh", "0vh", "-100vh"]);
  const aiScale = useTransform(smoothProgress, [0.5, 0.6, 0.7, 0.8], [0.8, 1, 1, 0.8]);

  // Scene 4: Final CTA (0.75 - 1)
  const ctaOpacity = useTransform(smoothProgress, [0.72, 0.8, 1], [0, 1, 1]);
  const ctaY = useTransform(smoothProgress, [0.7, 0.8, 1], ["100vh", "0vh", "0vh"]);

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-black text-white selection:bg-primary selection:text-white">
      {/* Background stays constant but reacts to scroll */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          style={{ opacity: useTransform(smoothProgress, [0, 1], [0.3, 0.1]) }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,255,0.1),transparent_70%)]" 
        />
        <div className="blob top-[-10%] left-[-10%] scale-150 opacity-10" />
        <div className="blob bottom-[-10%] right-[-10%] scale-150 opacity-10" style={{ animationDelay: '-5s' }} />
        
        {/* Particle/Neural grid effect */}
        <div className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, 
            backgroundSize: '40px 40px' 
          }} 
        />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="text-primary w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">Axnos<span className="text-primary">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-6 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full hover:bg-primary/20 transition-all font-medium"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* STICKY CONTAINER FOR SCENES */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center p-6">
        
        {/* SCENE 1: HERO */}
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>LEVEL UP YOUR INTELLIGENCE AND DATA WITH AXNOS AI</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[1.1]">
            MEET YOUR <br />
            <span className="hero-gradient">DATA COPILOT.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Experience the next evolution of AI-powered productivity. Seamless, intelligent, and built for those who demand more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard" className="px-10 py-4 bg-primary text-white rounded-full text-lg font-bold shadow-glow flex items-center gap-2 hover:scale-105 transition-transform">
              Start<ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-12 flex flex-col items-center gap-2 text-zinc-500"
          >
            <span className="text-xs uppercase tracking-widest font-bold">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>

        {/* SCENE 2: FEATURES FALLING */}
        <motion.div 
          style={{ opacity: featuresOpacity, y: featuresY, scale: featuresScale }}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Hyper-Capabilities</h2>
            <p className="text-zinc-400 text-lg">Next-gen features designed for the elite professional.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="glass-card p-8 rounded-3xl border-primary/20">
              <Zap className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Nano-Latency</h3>
              <p className="text-zinc-400 leading-relaxed">Response times faster than human thought, powered by Axnos-Core.</p>
            </div>
            <div className="glass-card p-8 rounded-3xl border-primary/20">
              <Shield className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Vault Privacy</h3>
              <p className="text-zinc-400 leading-relaxed">Your data never leaves your workspace. Encrypted at the hardware level.</p>
            </div>
            <div className="glass-card p-8 rounded-3xl border-primary/20">
              <Cpu className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Omni-Brain</h3>
              <p className="text-zinc-400 leading-relaxed">Integrated Brain that learns from your documents, code, and notes.</p>
            </div>
          </div>
        </motion.div>

        {/* SCENE 3: AI VISUAL/STATS */}
        <motion.div 
          style={{ opacity: aiOpacity, y: aiY, scale: aiScale }}
          className="absolute inset-0 flex flex-col md:flex-row items-center justify-center px-6 max-w-6xl mx-auto gap-12"
        >
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">The Engine of <br /><span className="text-primary italic">Innovation.</span></h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px bg-primary/30 flex-1" />
                <span className="text-zinc-500 font-mono text-sm uppercase">Performance Metrics</span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-black text-primary">99.9%</div>
                  <div className="text-xs uppercase tracking-widest font-bold text-zinc-500">Accuracy</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-primary">0.02s</div>
                  <div className="text-xs uppercase tracking-widest font-bold text-zinc-500">Latency</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 relative aspect-square flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-full h-full border-2 border-primary/20 rounded-full flex items-center justify-center p-12 border-dashed"
            >
              <div className="w-full h-full border-2 border-primary/40 rounded-full flex items-center justify-center p-8">
                 <Bot className="w-32 h-32 text-primary" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* SCENE 4: FINAL CTA */}
        <motion.div 
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        >
          <h2 className="text-5xl md:text-7xl font-extrabold mb-8">Ready to evolve?</h2>
          <p className="text-xl text-zinc-400 max-w-xl mx-auto mb-12">
            Join the select few who are defining the future with AxnosAI. 
            Limited early access slots available.
          </p>
          <div className="bg-primary/5 p-2 rounded-full border border-primary/20 max-w-md w-full flex items-center mb-24">
            <input 
              type="email" 
              placeholder="Enter your work email" 
              className="bg-transparent border-none outline-none flex-1 px-6 text-white"
            />
            <button className="bg-primary px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
              Join Waitlist
            </button>
          </div>
          
          <div className="text-sm text-zinc-500 flex gap-12 font-medium">
            <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global Node Mesh</span>
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Privacy-First</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Real-time IQ</span>
          </div>
        </motion.div>
      </div>

      {/* Progress Indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
        {[0, 1, 2, 3].map((i) => (
          <motion.div 
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/20"
            style={{ 
              backgroundColor: useTransform(
                smoothProgress, 
                [i * 0.25, (i + 1) * 0.25], 
                ["rgba(255,255,255,0.2)", "#3b82f6"]
              ) 
            }}
          />
        ))}
      </div>
    </div>
  );
}
