import Image from 'next/image';

type Props = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  ratio?: string; // e.g. "3 / 2"
  priority?: boolean;
  className?: string;
  reveal?: boolean;
  delay?: number;
  contain?: boolean;
  style?: React.CSSProperties;
};

/**
 * Responsive image with reserved space (no layout shift). Real photography is
 * optimised to AVIF/WebP by Next.js; SVG placeholders are served as-is.
 */
export default function Media({ src, alt, sizes, ratio, priority, className = '', reveal, delay = 0, contain, style }: Props) {
  return (
    <div
      className={`media ${contain ? 'media--contain' : ''} ${className}`}
      style={{ aspectRatio: ratio, ...(delay ? ({ '--d': `${delay}ms` } as React.CSSProperties) : null), ...style }}
      data-reveal={reveal ? 'image' : undefined}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? 'high' : undefined}
          unoptimized={src.endsWith('.svg')}
        />
      ) : (
        <div className="media__missing" role="img" aria-label={alt}>
          <span className="logo logo--emblem" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
