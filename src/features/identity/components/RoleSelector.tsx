import { useTheme } from "@/contexts/ThemeContext";
import { RoleName, UserRole } from "@/types";
import { AlertCircle, Bike, ChevronLeft, ChevronRight, Shield, Store, Utensils } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const { theme } = useTheme();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  return (
    <motion.div
      key="role-selector"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3 }}
      className="pt-4 sm:pt-6 md:pt-8 w-full"
    >
      {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_OTP === 'true') && (
        <div className="max-w-6xl mx-auto mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
          <h4 className="text-amber-700 dark:text-amber-400 font-bold mb-3 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" /> Development Setup / Dummy Data
          </h4>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-700 dark:text-slate-300">
            <span className="bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">Customer: <strong className="font-mono ml-1 text-amber-600 dark:text-amber-400">8000000001</strong></span>
            <span className="bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">Restaurant: <strong className="font-mono ml-1 text-rose-600 dark:text-rose-400">9000000001</strong></span>
            <span className="bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">Rider: <strong className="font-mono ml-1 text-amber-600 dark:text-amber-400">7000000001</strong></span>
          </div>
        </div>
      )}

      {/* Desktop view */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full px-4">
        {/* Customer Card */}
        <button
          onClick={() => onSelectRole(RoleName.CUSTOMER)}
          className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
            theme === 'dark'
              ? 'bg-slate-900/20 hover:bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(249,115,22,0.25)] hover:border-amber-500/40'
              : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(249,115,22,0.18)] hover:border-amber-400/40'
          }`}
        >
          <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
              theme === 'dark' ? 'text-white group-hover:text-amber-400' : 'text-slate-800 group-hover:text-amber-600'
            }`}>
              Order Food
            </h3>
            <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
              Browse top restaurants, customize dishes & order hot food
            </p>
          </div>
        </button>

        {/* Restaurant Partner */}
        <button
          onClick={() => onSelectRole(RoleName.RESTAURANT)}
          className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
            theme === 'dark'
              ? 'bg-slate-900/20 hover:bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(239,68,68,0.25)] hover:border-rose-500/40'
              : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] transition'
          }`}
        >
          <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
              theme === 'dark' ? 'text-white group-hover:text-amber-400' : 'text-slate-800 group-hover:text-amber-600'
            }`}>
              Restaurant Partner
            </h3>
            <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
              Manage incoming cooking tickets, stock statuses & earnings
            </p>
          </div>
        </button>

        {/* Delivery Executive */}
        <button
          onClick={() => onSelectRole(RoleName.DELIVERY)}
          className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
            theme === 'dark'
              ? 'bg-slate-900/20 hover:bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(16,185,129,0.25)] hover:border-amber-500/40'
              : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(16,185,129,0.18)] hover:border-amber-400/40'
          }`}
        >
          <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-slate-500 text-white shadow-lg shadow-amber-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
              theme === 'dark' ? 'text-white group-hover:text-amber-400' : 'text-slate-800 group-hover:text-amber-600'
            }`}>
              Delivery Executive
            </h3>
            <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
              Accept shipping contracts, view live map routes & payout stats
            </p>
          </div>
        </button>

        {/* System Admin */}
        <button
          onClick={() => onSelectRole(RoleName.ADMIN)}
          className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
            theme === 'dark'
              ? 'bg-slate-900/20 hover:bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(99,102,241,0.25)] hover:border-rose-500/40'
              : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(99,102,241,0.18)] hover:border-rose-400/40'
          }`}
        >
          <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-500 text-white shadow-lg shadow-rose-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
              theme === 'dark' ? 'text-white group-hover:text-rose-400' : 'text-slate-800 group-hover:text-rose-600'
            }`}>
              System Admin
            </h3>
            <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
              Manage overall operations, manual assignments, and system settings
            </p>
          </div>
        </button>
      </div>

      {/* Mobile/Tablet view */}
      <div className="lg:hidden relative w-full max-w-lg mx-auto overflow-hidden px-10 py-6">
        <button
          onClick={() => setActiveCardIndex((prev) => (prev - 1 + 4) % 4)}
          className={`absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full border backdrop-blur-xl transition cursor-pointer z-30 shadow-md ${
            theme === 'dark' ? 'bg-slate-900/20 border-rose-500/30/80 text-white' : 'bg-white/20 border-rose-500/20 text-slate-700'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveCardIndex((prev) => (prev + 1) % 4)}
          className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full border backdrop-blur-xl transition cursor-pointer z-30 shadow-md ${
            theme === 'dark' ? 'bg-slate-900/20 border-rose-500/30/80 text-white' : 'bg-white/20 border-rose-500/20 text-slate-700'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-full flex justify-center">
          <motion.div 
            className="flex items-center gap-4 cursor-grab active:cursor-grabbing py-2"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) setActiveCardIndex((prev) => (prev + 1) % 4);
              else if (info.offset.x > 40) setActiveCardIndex((prev) => (prev - 1 + 4) % 4);
            }}
            animate={{ x: `calc(50% - 125px - ${activeCardIndex * 266}px)` }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{ width: 'max-content' }}
          >
            {[
              { role: RoleName.CUSTOMER, icon: Utensils, title: 'Order Food', desc: 'Browse top restaurants, customize dishes & order hot food', colors: 'from-amber-400 to-amber-500' },
              { role: RoleName.RESTAURANT, icon: Store, title: 'Restaurant Partner', desc: 'Manage incoming cooking tickets, stock statuses & earnings', colors: 'from-amber-500 to-rose-500' },
              { role: RoleName.DELIVERY, icon: Bike, title: 'Delivery Executive', desc: 'Accept shipping contracts, view live map routes & payout stats', colors: 'from-amber-400 to-slate-500' },
              { role: RoleName.ADMIN, icon: Shield, title: 'System Admin', desc: 'Manage overall operations, manual assignments, and system settings', colors: 'from-rose-500 to-rose-500' }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => activeCardIndex === idx ? onSelectRole(item.role) : setActiveCardIndex(idx)}
                className={`shrink-0 w-[250px] group flex flex-col items-center justify-center text-center p-6 rounded-3xl transition duration-500 border backdrop-blur-xl relative overflow-hidden cursor-pointer ${
                  activeCardIndex === idx ? 'scale-102 opacity-100 z-20' : 'scale-90 opacity-40 z-10'
                } ${
                  theme === 'dark' ? 'bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)]' : 'bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div className={`mb-4 p-4 rounded-2xl bg-gradient-to-br ${item.colors} text-white shadow-lg transition-transform group-hover:scale-105 shrink-0`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-extrabold transition-colors text-base mb-1.5 ${theme === 'dark' ? 'text-white group-hover:text-amber-400' : 'text-slate-800'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs leading-relaxed max-w-[190px] mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        </div>

        <div className="flex justify-center items-center gap-2 mt-5">
          {[0, 1, 2, 3].map((idx) => (
            <button 
              key={idx}
              onClick={() => setActiveCardIndex(idx)}
              className={`h-2 rounded-full transition duration-300 cursor-pointer ${
                activeCardIndex === idx ? 'w-6 bg-amber-500' : `w-2 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
