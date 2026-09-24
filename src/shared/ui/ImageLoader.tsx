import { useEffect, useRef, useState } from 'react';

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * An image that fades in, and a quiet placeholder when there is no image to show.
 *
 * Until 2026-09-24 a missing or failing `src` still rendered the `<img>`: the browser drew its
 * broken-image glyph with the alt text beside it, which on the restaurant cover sat on top of
 * the back button. Most restaurants in the system have no photo yet, so that was the common
 * case, not the edge. Now a missing or failed image shows the paper-sunken ground with the
 * name's initial, and the alt text stays with the placeholder as its accessible name.
 */
export default function ImageLoader({ src, alt, className, containerClassName, ...props }: ImageLoaderProps) {
  const [state, setState] = useState<{ src?: string; loaded: boolean; failed: boolean }>({ src, loaded: false, failed: false });
  const imgRef = useRef<HTMLImageElement>(null);
  // Reset when the source changes, during render rather than in an effect.
  const current = state.src === src ? state : { src, loaded: false, failed: false };
  if (current !== state) setState(current);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setState((s) => (s.src === src ? { ...s, loaded: true } : s));
    }
  }, [src]);

  const missing = !src || current.failed;

  return (
    <div className={`relative overflow-hidden ${containerClassName || ''}`}>
      {missing ? (
        <div
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'var(--color-paper-sunken)' }}
        >
          <span aria-hidden="true" className="font-extrabold text-3xl" style={{ color: 'var(--color-ink-3)' }}>
            {(alt || '').trim().charAt(0).toUpperCase()}
          </span>
        </div>
      ) : (
        <>
          {!current.loaded && (
            <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-100/5 animate-pulse" />
          )}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ease-in-out ${current.loaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
            onLoad={() => setState((s) => (s.src === src ? { ...s, loaded: true } : s))}
            onError={() => setState((s) => (s.src === src ? { ...s, failed: true } : s))}
            {...props}
          />
        </>
      )}
    </div>
  );
}
