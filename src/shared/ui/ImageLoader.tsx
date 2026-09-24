import { useEffect, useRef, useState } from 'react';

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  /**
   * An image to show when `src` is missing or fails -- the brand mark on a menu row, say.
   * Without one, a missing or failed image falls to the initial placeholder below.
   */
  fallbackSrc?: string;
  /** Classes for the fallback image instead of `className`: a logo is contained, not cropped. */
  fallbackClassName?: string;
}

type LoadState = { src?: string; loaded: boolean; failed: boolean; fallbackFailed: boolean };

/**
 * An image that fades in, and a quiet placeholder when there is no image to show.
 *
 * Until 2026-09-24 a missing or failing `src` still rendered the `<img>`: the browser drew its
 * broken-image glyph with the alt text beside it, which on the restaurant cover sat on top of
 * the back button. Most restaurants in the system have no photo yet, so that was the common
 * case, not the edge. Now a missing or failed image shows the paper-sunken ground with the
 * name's initial, and the alt text stays with the placeholder as its accessible name.
 *
 * With `fallbackSrc`, the order is: the photo, then the fallback image, then the initial. A
 * fallback that fails too is not retried, so an error can never loop.
 */
export default function ImageLoader({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc,
  fallbackClassName,
  ...props
}: ImageLoaderProps) {
  const [state, setState] = useState<LoadState>({ src, loaded: false, failed: false, fallbackFailed: false });
  const imgRef = useRef<HTMLImageElement>(null);
  // Reset when the source changes, during render rather than in an effect.
  const current = state.src === src ? state : { src, loaded: false, failed: false, fallbackFailed: false };
  if (current !== state) setState(current);

  const photo = src && !current.failed ? src : undefined;
  const fallback = !photo && fallbackSrc && !current.fallbackFailed ? fallbackSrc : undefined;
  const shown = photo ?? fallback;

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setState((s) => (s.src === src ? { ...s, loaded: true } : s));
    }
  }, [src, shown]);

  const onError = () =>
    setState((s) => {
      if (s.src !== src) return s;
      // The photo failed: move to the fallback, which has to load in its own right.
      return photo ? { ...s, failed: true, loaded: false } : { ...s, fallbackFailed: true };
    });

  return (
    <div
      className={`relative overflow-hidden ${containerClassName || ''}`}
      style={fallback ? { background: 'var(--color-paper-sunken)' } : undefined}
    >
      {!shown ? (
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
            // A new element per source, so a fallback starts from a fresh load rather than
            // inheriting the failed photo's state.
            key={shown}
            ref={imgRef}
            src={shown}
            alt={alt}
            className={`transition-opacity duration-300 ease-in-out ${current.loaded ? 'opacity-100' : 'opacity-0'} ${(fallback ? fallbackClassName ?? className : className) || ''}`}
            onLoad={() => setState((s) => (s.src === src ? { ...s, loaded: true } : s))}
            onError={onError}
            {...props}
          />
        </>
      )}
    </div>
  );
}
