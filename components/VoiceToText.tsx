'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface VoiceToTextProps {
  onTranscript: (text: string) => void;
  className?: string;
}

const VoiceToText: React.FC<VoiceToTextProps> = ({ onTranscript, className }) => {
  const { accessToken } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (blob: Blob) => {
    if (!accessToken) return;
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    try {
      const response = await fetch(`${API_URL}/user-input/transcribe/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          onTranscript(data.text);
        }
      } else {
        console.error("Transcription failed");
      }
    } catch (error) {
      console.error("Error sending audio to backend:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={cn(
          "relative z-10 w-10 h-10 rounded-xl transition-all duration-300",
          isRecording 
            ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600" 
            : "hover:bg-white/5 text-zinc-400 hover:text-primary"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <div className="relative flex flex-col items-center gap-8 p-12 glass-card border-white/10 rounded-[3rem] shadow-2xl max-w-md w-full mx-4 overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-primary/20 blur-[100px] rounded-full opacity-50" />
               
               <div className="relative group cursor-pointer" onClick={stopRecording}>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"
                  />
                  <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-glow shadow-primary/40 group-hover:scale-105 transition-transform duration-300">
                    <Mic className="w-10 h-10 text-white" />
                  </div>
               </div>

               <div className="text-center space-y-2 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter text-white uppercase italic">Listening</h3>
                  <div className="flex items-center justify-center gap-1.5">
                    <motion.span 
                      animate={{ height: [4, 12, 4] }} 
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                      className="w-1 bg-primary rounded-full" 
                    />
                    <motion.span 
                      animate={{ height: [4, 20, 4] }} 
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                      className="w-1 bg-primary rounded-full" 
                    />
                    <motion.span 
                      animate={{ height: [4, 16, 4] }} 
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                      className="w-1 bg-primary rounded-full" 
                    />
                    <motion.span 
                      animate={{ height: [4, 24, 4] }} 
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                      className="w-1 bg-primary rounded-full" 
                    />
                    <motion.span 
                      animate={{ height: [4, 12, 4] }} 
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
                      className="w-1 bg-primary rounded-full" 
                    />
                  </div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] pt-2">
                    Neural Processing Active
                  </p>
               </div>

               <Button 
                variant="ghost" 
                onClick={stopRecording}
                className="mt-4 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-8 font-bold text-xs uppercase tracking-widest h-10"
               >
                 Stop
               </Button>

               <div className="absolute bottom-4 right-4 opacity-20">
                 <Sparkles className="w-8 h-8 text-primary" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceToText;
