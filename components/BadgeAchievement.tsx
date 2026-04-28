
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { RollingCounter } from './RollingCounter';
import { getSkillLevelLabel } from '../skills';

interface BadgeAchievementProps {
  onHome: () => void;
  onContinue?: () => void;
  onTrackCareer?: () => void;
  assessmentResults?: Record<string, number> | null;
}

const playBadgeSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // --- 1. Coin "Collection" Sound (Rapid glissando/rushing sound) ---
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.5);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);

    // --- 2. Badge "Pop" / Fanfare (Grand Chord) ---
    const popTime = now + 0.6;
    const notes = [392.00, 493.88, 587.33, 783.99]; // G Major 7 ish
    
    notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        
        g.gain.setValueAtTime(0, popTime);
        g.gain.linearRampToValueAtTime(0.1, popTime + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, popTime + 1.5);
        
        o.start(popTime);
        o.stop(popTime + 1.5);
    });

    // --- 3. Rhythm Section (Drums, Synth, Flute) ---
    
    // Helper: Noise buffer for drums
    const createNoiseBuffer = () => {
        const bufferSize = ctx.sampleRate * 2; 
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    };
    const noiseBuffer = createNoiseBuffer();

    // Drum Instruments
    const playKick = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        
        osc.start(time);
        osc.stop(time + 0.5);
    };

    const playSnare = (time: number) => {
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const gain = ctx.createGain();
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        source.start(time);
        source.stop(time + 0.2);
    };

    const playHiHat = (time: number) => {
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        const gain = ctx.createGain();
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        source.start(time);
        source.stop(time + 0.05);
    };

    // Synth Instrument (Plucky Sawtooth)
    const playSynth = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        // Lowpass filter envelope for "pluck" sound
        filter.type = 'lowpass';
        filter.Q.value = 2;
        filter.frequency.setValueAtTime(freq, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 4, time + 0.02);
        filter.frequency.exponentialRampToValueAtTime(freq, time + 0.2);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.3);
    };

    // Flute Instrument (Triangle wave with Vibrato)
    const playFlute = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Vibrato LFO
        const vibOsc = ctx.createOscillator();
        const vibGain = ctx.createGain();
        vibOsc.frequency.value = 5; // 5Hz vibrato rate
        vibGain.gain.value = 6;     // Vibrato depth
        vibOsc.connect(vibGain);
        vibGain.connect(osc.frequency);
        vibOsc.start(time);
        vibOsc.stop(time + duration);

        osc.type = 'triangle'; 
        osc.frequency.value = freq;

        // ADSR Envelope
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.1); // Soft attack
        gain.gain.setValueAtTime(0.12, time + duration - 0.1); // Sustain
        gain.gain.linearRampToValueAtTime(0, time + duration); // Release

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
    };

    // --- Sequencer ---
    const startTime = now + 0.1;
    const beatLen = 0.5; // 120 BPM
    
    // Synth Notes (G Major Pentatonic-ish)
    const synthPattern = [392.00, 493.88, 587.33, 493.88, 392.00, 493.88, 587.33, 659.25]; // G B D B G B D E
    
    // Reduced from 6 to 4 beats (approx 1s shorter)
    for (let i = 0; i < 4; i++) {
        const t = startTime + (i * beatLen);
        
        // Drums
        if (i % 2 === 0) playKick(t);
        if (i % 2 !== 0) playSnare(t);
        playHiHat(t);
        playHiHat(t + (beatLen / 2));

        // Synth Arpeggio (8th notes)
        playSynth(t, synthPattern[i % synthPattern.length]);
        playSynth(t + (beatLen / 2), synthPattern[(i + 2) % synthPattern.length]); // Offset harmony
    }

    // Flute Melody (Condensed to fit 4 beats)
    // G5 (1.5) -> D5 (0.5) -> E5 (0.5) -> G5 (1.5)
    playFlute(startTime, 783.99, beatLen * 1.5); 
    playFlute(startTime + (beatLen * 1.5), 587.33, beatLen * 0.5);
    playFlute(startTime + (beatLen * 2), 659.25, beatLen * 0.5);
    playFlute(startTime + (beatLen * 2.5), 783.99, beatLen * 1.5); 
    
    // Final Crash
    const finishTime = startTime + (4 * beatLen);
    playKick(finishTime);
    
    const crashSource = ctx.createBufferSource();
    crashSource.buffer = noiseBuffer;
    const crashGain = ctx.createGain();
    crashSource.connect(crashGain);
    crashGain.connect(ctx.destination);
    crashGain.gain.setValueAtTime(0.2, finishTime);
    crashGain.gain.exponentialRampToValueAtTime(0.001, finishTime + 2.0);
    crashSource.start(finishTime);
    crashSource.stop(finishTime + 2.1);

  } catch (e) {
    console.error(e);
  }
};

const VerifiedSolid = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z" fill="#0056D2" stroke="#0056D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BadgeAchievement: React.FC<BadgeAchievementProps> = ({ onHome, onContinue, onTrackCareer, assessmentResults }) => {
  const [viewState, setViewState] = useState<'celebration' | 'results'>('celebration');
  
  useEffect(() => {
    playBadgeSound();
  }, []);

  const handleScroll = () => {
    if (viewState === 'celebration') {
        setViewState('results');
    }
  };

  // Handle wheel event to trigger transition
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
        if (e.deltaY > 0 && viewState === 'celebration') {
            setViewState('results');
        }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [viewState]);

  const BadgeIcon = ({ className }: { className?: string }) => (
    <div className={className}>
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="purpleGrad" x1="50" y1="50" x2="350" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>
        </defs>
        
        {/* Seal Body - Scalloped Shape */}
        <path d="M200 20 C216 20 228 35 244 39 C260 43 280 37 293 48 C306 59 309 79 320 89 C331 99 351 103 358 118 C365 133 356 153 361 168 C366 183 386 198 386 213 C386 228 366 243 361 258 C356 273 365 293 358 308 C351 323 331 327 320 337 C309 347 306 367 293 378 C280 389 260 383 244 387 C228 391 216 406 200 406 C184 406 172 391 156 387 C140 383 120 389 107 378 C94 367 91 347 80 337 C69 327 49 323 42 308 C35 293 44 273 39 258 C34 243 14 228 14 213 C14 198 34 183 39 168 C44 153 35 133 42 118 C49 103 69 99 80 89 C91 79 94 59 107 48 C120 37 140 43 156 39 C172 35 184 20 200 20 Z" 
          fill="url(#purpleGrad)" stroke="white" strokeWidth="6" transform="translate(0 -13) scale(0.95)" transform-origin="center" />
        
        {/* Inner ring */}
        <circle cx="200" cy="200" r="160" stroke="white" strokeWidth="2" strokeOpacity="0.4" />

        {/* Checkmark */}
        <path d="M150 150 L185 185 L250 120" stroke="white" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 10)" />

        {/* Text */}
        <text x="200" y="245" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="bold" fontSize="24">
          Data Acquisition and
        </text>
        <text x="200" y="275" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="bold" fontSize="24">
          Preparation
        </text>

        {/* Pill */}
        <rect x="110" y="300" width="180" height="40" rx="20" fill="#3B0764" />
        <text x="200" y="326" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="bold" fontSize="16" letterSpacing="0.5">
          4 skills verified
        </text>
      </svg>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--cds-color-white)] h-full relative">
      {/* Mini Sidebar */}
      <div className="w-16 flex-shrink-0 border-r border-[var(--cds-color-grey-100)] flex flex-col items-center py-6 bg-[var(--cds-color-white)] z-10">
        <button className="mb-8 text-[var(--cds-color-grey-700)] hover:text-[var(--cds-color-blue-700)] transition-colors" onClick={onHome}>
          <Icons.Menu className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-[var(--cds-color-purple-600)] flex items-center justify-center text-[var(--cds-color-purple-600)]">
          <div className="w-5 h-5 rounded-full border-2 border-current"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar scroll-smooth">
        
        {/* === CELEBRATION HERO === */}
        {viewState === 'celebration' && (
             <div className="absolute inset-0 z-20 bg-[var(--cds-color-white)] flex flex-col items-center justify-center animate-fade-in">
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-8 animate-badge-pop" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
                        <BadgeIcon className="w-72 h-72" />
                    </div>

                    <div className="text-center mb-2 animate-fade-in-delay" style={{ animationDelay: '1s' }}>
                        <h1 className="text-[var(--cds-color-blue-700)] text-4xl font-bold tracking-tight mb-2">coursera</h1>
                    </div>

                    <h3 className="text-xl text-[var(--cds-color-grey-900)] font-semibold mb-8 animate-fade-in-delay px-4 text-center max-w-lg" style={{ animationDelay: '1.4s' }}>
                        You’ve earned a badge for verifying "Data Acquisition and Preparation"!
                    </h3>

                    <button className="flex items-center gap-2 border border-[#0056D2] text-[var(--cds-color-blue-700)] px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors animate-fade-in-delay" style={{ animationDelay: '1.6s' }}>
                        Share on LinkedIn <Icons.Share className="w-4 h-4" />
                    </button>
                </div>

                <div className="absolute bottom-12 animate-bounce cursor-pointer" onClick={handleScroll}>
                    <Icons.ArrowDown className="w-8 h-8 text-[var(--cds-color-grey-400)]" />
                </div>
                
                <div className="absolute bottom-4 text-sm text-[var(--cds-color-grey-400)]">
                    See test results
                </div>
            </div>
        )}

        {/* === RESULTS CONTENT === */}
        {viewState === 'results' && (
            <div className="flex-1 animate-fade-in flex flex-col min-h-full">
                {(() => {
                  const skillEntries = [
                    { name: "Prepare Datasets in Power BI", total: 10 },
                    { name: "Connecting and Importing Data", total: 10 },
                    { name: "Preparing and Cleaning Data", total: 10 },
                    { name: "Visualizing and Reporting Clean Data", total: 10 }
                  ];

                  const scoredSkills = skillEntries.map((skill) => {
                    const points = assessmentResults?.[skill.name];
                    const correct = points !== undefined ? Math.max(0, Math.min(skill.total, Math.round(points / 10))) : skill.total;
                    return {
                      ...skill,
                      correct,
                      points: points ?? 0,
                    };
                  });

                  const totalCorrect = scoredSkills.reduce((sum, skill) => sum + skill.correct, 0);
                  const totalQuestions = scoredSkills.reduce((sum, skill) => sum + skill.total, 0);
                  const gradePercent = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                  const verifiedCount = scoredSkills.filter((skill) => skill.correct === skill.total).length;
                  const verifiedLabel = `${verifiedCount}/${scoredSkills.length} skills verified`;

                  return (
                 <div className="max-w-5xl mx-auto px-12 py-12 flex-1 w-full">
                     
                     {/* Badge Banner */}
                     <div className="bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between mb-12 animate-slide-in-up">
                        <div className="flex-1">
                             <h2 className="text-2xl font-bold text-[var(--cds-color-grey-975)] mb-2 max-w-md">
                                You’ve earned the ‘Data Acquisition and Preparation’ skill badge!
                             </h2>
                             <button className="mt-4 flex items-center gap-2 border border-[#0056D2] text-[var(--cds-color-blue-700)] px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                                Share on LinkedIn <Icons.Share className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="mt-6 md:mt-0">
                             <div className="flex flex-col items-center">
                                <BadgeIcon className="w-48 h-48" />
                             </div>
                        </div>
                     </div>

                     {/* Test Results Header */}
                     <div className="mb-8">
                        <h2 className="text-[32px] font-bold text-[var(--cds-color-grey-975)]">
                          Test results: <span className="text-[var(--cds-color-green-700)]">{gradePercent}%</span>
                        </h2>
                     </div>

                     {/* Skills Verified */}
                     <div className="mb-12">
                        <h3 className="text-[19px] font-semibold text-[var(--cds-color-grey-975)] mb-4">Skills you’ve verified</h3>
                        <div className="space-y-6">
                            {scoredSkills.map((skill) => (
                                <div key={skill.name} className="flex items-center justify-between bg-[var(--cds-color-blue-25)] border border-blue-100 p-6 rounded-[16px]">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {/* Custom Solid Blue Verified Icon */}
                                            <VerifiedSolid className="w-10 h-10" />
                                            {/* Pulse effect */}
                                            <div className="absolute inset-0 bg-[var(--cds-color-blue-700)] rounded-full opacity-20 animate-pulse scale-90"></div>
                                        </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[16px] font-semibold text-[var(--cds-color-grey-975)]">{skill.name}</span>
                                                    {/* Coin Pill */}
                                                    <div className="flex items-center gap-1 bg-[var(--cds-color-white)] px-2 py-0.5 rounded-lg border border-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-975)] text-[12px] font-bold shadow-sm">
                                                        +{skill.points}
                                                        <Icons.Coin className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                                {/* New sub-header */}
                                            <span className="text-[13px] text-[var(--cds-color-grey-500)] font-normal mt-0.5">{verifiedLabel}</span>
                                            </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-600)]">
                                            {getSkillLevelLabel((skill.correct / skill.total) * 100)}
                                        </span>
                                        <span className="text-[14px] font-bold underline decoration-2 decoration-[var(--cds-color-green-700)]/30 text-[var(--cds-color-green-700)]">
                                            {skill.correct}/{skill.total} Questions correct
                                        </span>
                                        <Icons.ChevronDown className="w-5 h-5 text-[var(--cds-color-grey-400)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                 </div>
                  );
                })()}

                 {/* Footer */}
                 <div className="border-t border-[var(--cds-color-grey-100)] p-8 bg-[var(--cds-color-white)] mt-auto sticky bottom-0 z-30">
                    <div className="max-w-5xl mx-auto flex items-center justify-end gap-6">
                        {/* Tertiary Ghost CTA */}
                        <button 
                          onClick={onTrackCareer}
                          className="text-[var(--cds-color-blue-700)] font-semibold hover:underline text-[16px]"
                        >
                            Track my Career progress
                        </button>
                        
                        {/* Primary CTA */}
                        <button 
                          onClick={onContinue}
                          className="flex items-center gap-2 bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] px-6 py-2.5 rounded-lg font-semibold hover:bg-[var(--cds-color-blue-800)] transition-colors shadow-sm"
                        >
                            Go to the next item <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};
