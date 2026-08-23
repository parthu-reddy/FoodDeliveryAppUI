import { useEffect, useRef, useState } from 'react';

interface ImageLoaderProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  [key: string]: any;
}

export default function ImageLoader({ src, alt, className, containerClassName, ...props }: ImageLoaderProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${containerClassName || ''}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-100/5 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        {...props}
      />
    </div>
  );
}
