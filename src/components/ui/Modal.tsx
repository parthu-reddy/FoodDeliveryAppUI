import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  /** If true, renders as a bottom sheet on mobile */
  sheet?: boolean;
  /** Custom header content (replaces title + close button) */
  header?: React.ReactNode;
  /** Custom footer content (rendered below children) */
  footer?: React.ReactNode;
  /** Additional className for the modal content container */
  className?: string;
  children: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  sheet = true,
  header,
  footer,
  className = '',
  children,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[60] flex ${sheet ? 'items-end sm:items-center' : 'items-center'} justify-center p-0 sm:p-4 bg-slate-900/20 backdrop-blur-sm`}
          onClick={onClose}
        >
          <motion.div
            initial={sheet ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            animate={sheet ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={sheet ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`
              w-full ${sizeClasses[size]}
              bg-white dark:bg-slate-900 
              ${sheet ? 'rounded-t-3xl sm:rounded-3xl' : 'rounded-3xl'}
              shadow-2xl border border-slate-200 dark:border-slate-800
              flex flex-col max-h-[85vh] overflow-hidden
              ${className}
            `}
          >
            {/* Header */}
            {(title || header) && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                {header || (
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h2>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
