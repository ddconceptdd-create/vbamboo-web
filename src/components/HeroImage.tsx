import { getImageProps } from 'next/image';

/**
 * Full-bleed hero with optional art direction: a portrait crop for phones and a
 * wide architectural view for larger screens. Only one of the two is downloaded.
 */
export default function HeroImage({ src, mobileSrc, alt }: { src: string | null | undefined; mobileSrc?: string | null; alt: string }) {
  if (!src) return null;
  const common = { alt, fill: true, sizes: '100vw', priority: true } as const;
  const desktop = getImageProps({ ...common, src, unoptimized: src.endsWith('.svg') }).props;
  const mobile = mobileSrc ? getImageProps({ ...common, src: mobileSrc, unoptimized: mobileSrc.endsWith('.svg') }).props : null;
  return (
    <div className="media hero__img" style={{ height: '100%' }}>
      <picture>
        {mobile && <source media="(max-width: 699px)" srcSet={mobile.srcSet ?? mobile.src} sizes={mobile.sizes} />}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img {...desktop} />
      </picture>
    </div>
  );
}
