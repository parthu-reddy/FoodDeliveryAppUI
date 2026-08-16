import React from 'react';
import { Leaf, Flame, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import ImageLoader from '@shared/ui/ImageLoader';

const PREMIUM_FOOD_SHOT = {
  url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80',
  title: 'Gourmet Culinary Art',
  accent: 'From Top Chefs'
};

// Interactive floating food ingredients for high-end feel
const FLOATING_INGREDIENTS = [
  { icon: Leaf, color: 'text-emerald-500/40', size: 28, left: '8%', delay: 0, duration: 25, yStart: '110%', rotate: 360 },
  { icon: Flame, color: 'text-orange-500/30', size: 22, left: '25%', delay: 4, duration: 22, yStart: '110%', rotate: -180 },
  { icon: Sparkles, color: 'text-amber-300/40', size: 20, left: '75%', delay: 2, duration: 20, yStart: '110%', rotate: 180 },
  { icon: Trophy, color: 'text-yellow-500/30', size: 24, left: '90%', delay: 8, duration: 28, yStart: '110%', rotate: -90 },
];

interface CinematicFoodBackgroundProps {
  theme?: 'light' | 'dark';
}

export default function CinematicFoodBackground({ theme = 'light' }: CinematicFoodBackgroundProps) {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0">
      <div className="absolute inset-0 w-full h-full">
        <ImageLoader
          src={PREMIUM_FOOD_SHOT.url}
          alt="Cinematic gourmet dish"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter brightness-90 saturate-125"
          containerClassName="w-full h-full"
          loading="lazy"
        />
      </div>

      {/* 2. Soft vignette overlay gradient to focus user attention on the primary login frame */}
      <div 
        className={`absolute inset-0 transition-colors duration-1000 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-indigo-950/80 via-purple-900/70 to-slate-950/90 mix-blend-multiply'
            : 'bg-gradient-to-br from-blue-100/80 via-purple-100/70 to-slate-50/90'
        }`}
      />

      {/* 3. Creative Interactive Particles and Floating Ingredients */}
      <div className="absolute inset-0 w-full h-full opacity-60">
        {FLOATING_INGREDIENTS.map((ingredient, idx) => {
          const IconComponent = ingredient.icon;
          return (
            <motion.div
              key={idx}
              initial={{ y: ingredient.yStart, opacity: 0, rotate: 0 }}
              animate={{ 
                y: '-20%', 
                opacity: [0, 1, 1, 0],
                rotate: ingredient.rotate
              }}
              transition={{ 
                duration: ingredient.duration,
                delay: ingredient.delay,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{ left: ingredient.left }}
              className="absolute z-10"
            >
              <IconComponent 
                size={ingredient.size} 
                className={`${ingredient.color} filter blur-[0.4px]`} 
              />
            </motion.div>
          );
        })}
      </div>

      {/* 4. Elegant Ambient Radial Highlight */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.15) 100%)'
        }}
      />
    </div>
  );
}
