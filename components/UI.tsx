
import React, { useState, useRef, useEffect, memo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

const BUTTON_BASE = "px-4 py-3 rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm";
const BUTTON_VARIANTS: Record<string, string> = {
  primary: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200 dark:shadow-none',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
  outline: 'border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  danger: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
};

export const Button: React.FC<ButtonProps> = memo(({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => (
  <button
    className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
));

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode, className?: string }> = memo(({ children, className = '', ...props }) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors ${className}`}
    {...props}
  >
    {children}
  </div>
));

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = memo(({ label, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-gray-600 dark:text-slate-400 px-1">{label}</label>}
    <input
      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 focus:border-rose-400 dark:focus:border-rose-700 transition-all text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-600"
      {...props}
    />
  </div>
));

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string; icon?: React.ReactNode }[];
}

export const Select: React.FC<CustomSelectProps> = memo(({ label, value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && <label className="text-sm font-semibold text-gray-600 dark:text-slate-400 px-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border ${isOpen ? 'border-rose-400 ring-2 ring-rose-200 dark:ring-rose-900' : 'border-gray-200 dark:border-slate-700'} rounded-2xl px-4 py-3.5 transition-all text-left active:scale-[0.99]`}
      >
        <div className="flex items-center gap-3">
          {selectedOption.icon && <div className="text-rose-500">{selectedOption.icon}</div>}
          <span className="text-gray-800 dark:text-slate-100 font-medium">{selectedOption.label}</span>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in p-1.5">
          <div className="max-h-60 overflow-y-auto beauty-scroll">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors ${
                  value === option.value 
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {option.icon && <div className={`${value === option.value ? 'text-rose-500' : 'text-gray-400 dark:text-slate-500'}`}>{option.icon}</div>}
                  <span className="font-semibold text-sm">{option.label}</span>
                </div>
                {value === option.value && <Check size={16} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const BADGE_COLORS: Record<string, string> = {
  rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
  amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
  gray: 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-700'
};

export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { color?: string, children: React.ReactNode }> = memo(({ color = 'gray', children, ...props }) => (
  <span
    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-tight ${BADGE_COLORS[color]}`}
    {...props}
  >
    {children}
  </span>
));
