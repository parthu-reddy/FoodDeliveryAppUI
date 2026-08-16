import React from 'react';

export function LaBouffeLogoMark({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      id="la-bouffe-logo-mark-svg"
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Shadow Ellipse under the pin */}
      <ellipse 
        cx="50" 
        cy="92" 
        rx="18" 
        ry="4" 
        fill="currentColor" 
        className="text-slate-300 dark:text-slate-800" 
        opacity="0.4" 
      />

      {/* 2. Map Pin Triangle pointing downwards */}
      <path 
        d="M 50,88 L 36,60 L 64,60 Z" 
        fill="#E11D48" 
      />

      {/* 3. Steam rise elements at the top */}
      {/* Left Steam */}
      <path 
        d="M 42,16 C 43,10 41,8 43,2" 
        stroke="#F59E0B" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* Center Steam */}
      <path 
        d="M 50,18 C 51,12 49,10 51,4" 
        stroke="#F59E0B" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* Right Steam */}
      <path 
        d="M 58,16 C 59,10 57,8 59,2" 
        stroke="#F59E0B" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* 4. Cloche Dome layered arches */}
      {/* Outer magenta layer */}
      <path 
        d="M 12,54 C 12,30 29,22 50,22 C 71,22 88,30 88,54 C 88,56 86,57 84,56 C 74,53 62,51 50,51 C 38,51 26,53 16,56 C 14,57 12,56 12,54 Z" 
        fill="#E11D48" 
      />

      {/* Inner orange layer */}
      <path 
        d="M 20,53 C 20,35 32,28 50,28 C 68,28 80,35 80,53 C 80,54 78,54 76,53 C 68,51 59,49 50,49 C 41,49 32,51 24,53 C 22,54 20,54 20,53 Z" 
        fill="#F59E0B" 
      />

      {/* Core dark charcoal layer */}
      <path 
        d="M 28,51 C 28,39 36,34 50,34 C 64,34 72,39 72,51 C 72,52 70,52 68,51 C 63,50 56,49 50,49 C 44,49 37,50 32,51 C 30,52 28,52 28,51 Z" 
        fill="#0F172A" 
      />

      {/* Smile/Crescent inside core dark layer */}
      <path 
        d="M 43,43 C 44,46 47,47 50,47 C 53,47 56,46 57,43" 
        stroke="#FFFFFF" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
    </svg>
  );
}
