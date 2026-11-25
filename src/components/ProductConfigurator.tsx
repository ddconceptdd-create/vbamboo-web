'use client';

import Image from 'next/image';
import { useState } from 'react';
import { setSelection, useSelection } from '@/lib/selection';

export type Option = { key: string; name: string; detail: string; swatchColor: string | null; swatchImage: string | null };
export type VersionImage = { finish: string; fabric: string; image: string };

type Props = {
  productName: string;
  finishes: Option[];
  fabrics: Option[];
  versionImages: VersionImage[];
  fallbackImage: string | null;
  labels: { finish: string; upholstery: string; selected: string; missing: string };
};

function pickImage(v: VersionImage[], finish: string | null, fabric: string | null, fallback: string | null) {
  const exact = v.find((x) => x.finish === (finish ?? '') && x.fabric === (fabric ?? ''));
  const byFabric = fabric ? v.find((x) => x.fabric === fabric && !x.finish) : undefined;
  const byFinish = finish ? v.find((x) => x.finish === finish && !x.fabric) : undefined;
  const hit = exact ?? byFabric ?? byFinish;
  return { src: hit?.image ?? fallback, exact: !!hit };
}

/**
 * Finish and upholstery are shown together so they can be compared side by side.
 * Choosing an option updates the version name and photograph. Swatches stay static.
 */
export default function ProductConfigurator({ productName, finishes, fabrics, versionImages, fallbackImage, labels }: Props) {
  const sel = useSelection({ finish: finishes[0]?.key ?? null, fabric: fabrics[0]?.key ?? null });
  const finish = finishes.find((f) => f.key === sel.finish) ?? finishes[0];
  const fabric = fabrics.find((f) => f.key === sel.fabric) ?? fabrics[0];
  const { src, exact } = pickImage(versionImages, finish?.key ?? null, fabric?.key ?? null, fallbackImage);

  // Keep every image that has been displayed mounted, so changes cross-fade.
  const [shown, setShown] = useState<string[]>(src ? [src] : []);
  if (src && !shown.includes(src)) setShown([...shown, src]);

  const versionName = [finish?.name, fabric?.name].filter(Boolean).join(' · ');
  const hasPhotoSet = versionImages.length > 0;

  return (
    <div className="configurator">
      <div className="configurator__preview">
        <div className="configurator__stage media" aria-live="polite">
          {shown.map((s) => (
            <div key={s} className="configurator__img" data-active={s === src || undefined}>
              <Image src={s} alt={s === src ? `${productName} · ${versionName}` : ''} fill sizes="(min-width: 960px) 50vw, 100vw" unoptimized={s.endsWith('.svg')} />
            </div>
          ))}
        </div>
        <p className="configurator__version">
          <span className="eyebrow">{labels.selected}</span>
          <span className="configurator__version-name">{versionName || productName}</span>
          {hasPhotoSet && !exact && <span className="configurator__missing">{labels.missing}</span>}
        </p>
      </div>

      <div className="configurator__options">
        {finishes.length > 0 && (
          <OptionGroup
            title={labels.finish}
            options={finishes}
            value={finish?.key}
            onChange={(k) => setSelection({ finish: k })}
            name="finish"
          />
        )}
        {fabrics.length > 0 && (
          <OptionGroup
            title={labels.upholstery}
            options={fabrics}
            value={fabric?.key}
            onChange={(k) => setSelection({ fabric: k })}
            name="fabric"
          />
        )}
      </div>
    </div>
  );
}

function OptionGroup({
  title,
  options,
  value,
  onChange,
  name,
}: {
  title: string;
  options: Option[];
  value?: string;
  onChange: (k: string) => void;
  name: string;
}) {
  const current = options.find((o) => o.key === value);
  return (
    <fieldset className="swatches">
      <legend className="swatches__legend">
        <span className="eyebrow">{title}</span>
        <span className="swatches__current">{current?.name}</span>
        {current?.detail && <span className="swatches__detail">{current.detail}</span>}
      </legend>
      <div className="swatches__list">
        {options.map((o) => (
          <label key={o.key} className="swatch" title={o.name}>
            <input type="radio" name={name} value={o.key} checked={o.key === value} onChange={() => onChange(o.key)} />
            <span className="swatch__chip" style={{ background: o.swatchColor ?? 'var(--ivory-3)' }}>
              {o.swatchImage && <Image src={o.swatchImage} alt="" fill sizes="64px" unoptimized={o.swatchImage.endsWith('.svg')} />}
            </span>
            <span className="swatch__name">{o.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
