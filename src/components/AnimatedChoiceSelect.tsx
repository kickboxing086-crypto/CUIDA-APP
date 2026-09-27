import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/* =========================================================================
   1. AnimatedSelect - Custom Animated Dropdown (Replaces generic <select>)
   ========================================================================= */
interface AnimatedSelectProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: ChoiceOption<T>[];
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AnimatedSelect<T extends string = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Selecione uma opção',
  className = '',
  disabled = false,
}: AnimatedSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button with Animated Feedback */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        whileTap={!disabled ? { scale: 0.99 } : undefined}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer text-left ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900 shadow-sm'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className={`truncate ${selectedOption ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-slate-500"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 left-0 right-0 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 space-y-0.5"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const OptIcon = opt.icon;

              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileHover={{ x: 2 }}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {OptIcon && (
                      <OptIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    )}
                    <div className="truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-blue-600">
                        <Check className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================================
   2. AnimatedSegmentedControl - Smooth sliding pill tabs/choices
   ========================================================================= */
interface AnimatedSegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: ChoiceOption<T>[];
  layoutId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedSegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  layoutId = 'animatedSegmentedPill',
  size = 'md',
  className = '',
}: AnimatedSegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'text-[11px] py-1 px-2.5',
    md: 'text-xs py-1.5 px-3.5',
    lg: 'text-sm py-2 px-4',
  };

  return (
    <div className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 relative select-none ${className}`}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors cursor-pointer z-10 whitespace-nowrap ${sizeClasses[size]} ${
              isActive
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {/* Sliding Animated Active Pill */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-blue-600 rounded-xl shadow-sm z-[-1]"
              />
            )}
            {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />}
            <span>{opt.label}</span>
            {opt.badge && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   3. AnimatedChoiceCards - Interactive Grid Option Cards with Micro-Feedback
   ========================================================================= */
interface AnimatedChoiceCardsProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: Array<ChoiceOption<T> & { description?: string }>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function AnimatedChoiceCards<T extends string = string>({
  value,
  onChange,
  options,
  columns = 3,
  className = '',
}: AnimatedChoiceCardsProps<T>) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-2.5 ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const Icon = opt.icon;

        return (
          <motion.button
            key={opt.value}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(opt.value)}
            className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <span
                  className={`text-xs font-bold ${
                    isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {opt.label}
                </span>
              </div>

              {isSelected ? (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
              )}
            </div>

            {opt.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                {opt.description}
              </p>
            )}

            {opt.badge && (
              <span className="mt-2 inline-block self-start text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100/70 text-blue-800 border border-blue-200">
                {opt.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
