import { LaBouffeLogoMark } from './LaBouffeLogoMark';

interface LaBouffeLogoProps {
  className?: string;
  iconSize?: string;
  showText?: boolean;
  textColorClass?: string;
  subColorClass?: string;
  align?: 'left' | 'center';
}

export { LaBouffeLogoMark };

export default function LaBouffeLogo({
  className = "flex items-center gap-4",
  iconSize = "w-12 h-12",
  showText = true,
  textColorClass = "text-slate-800 dark:text-[#f0ede6]",
  subColorClass = "text-rose-500 dark:text-rose-400",
  align = "left"
}: LaBouffeLogoProps) {
  return (
    <div className={className}>
      <LaBouffeLogoMark className={iconSize} />
      {showText && (
        <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
          <span className={`font-black text-2xl tracking-[0.08em] leading-none uppercase ${textColorClass}`}>
            LA BOUFFE
          </span>
          <span className={`font-bold text-[10px] tracking-[0.25em] leading-none uppercase mt-1.5 ${subColorClass}`}>
            ELEGANCE DELIVERED
          </span>
        </div>
      )}
    </div>
  );
}
