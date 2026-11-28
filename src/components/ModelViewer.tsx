'use client';

import Image from 'next/image';
import { createElement, useState } from 'react';

type Props = {
  src: string;
  ios: string | null;
  poster: string | null;
  alt: string;
  labels: { load: string; loading: string; hint: string; ar: string };
};

/**
 * 360° viewer for glTF/GLB models, built on Google's <model-viewer>.
 *
 * Nothing 3D is downloaded until the visitor asks: the poster photo is shown
 * with a "View the 3D model" button, then the viewer script (~250 KB gzip) and
 * the model load. Draco- and meshopt-compressed GLB files are decoded in the
 * browser. Phones get AR ("view in your room") where supported.
 */
export default function ModelViewer({ src, ios, poster, alt, labels }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle');

  const start = async () => {
    setState('loading');
    const mod = await import('@google/model-viewer');
    const MV = (mod as unknown as { ModelViewerElement?: { meshoptDecoderLocation: string } }).ModelViewerElement;
    if (MV) MV.meshoptDecoderLocation = 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.22.0/meshopt_decoder.js';
    setState('ready');
  };

  return (
    <div className="model" data-state={state}>
      {state === 'ready' ? (
        createElement(
          'model-viewer',
          {
            src,
            'ios-src': ios ?? undefined,
            poster: poster ?? undefined,
            alt,
            'camera-controls': '',
            'touch-action': 'pan-y',
            'interaction-prompt': 'auto',
            'auto-rotate': '',
            'auto-rotate-delay': '1500',
            'rotation-per-second': '18deg',
            'shadow-intensity': '0.9',
            'shadow-softness': '0.8',
            exposure: '1',
            'environment-image': 'neutral',
            ar: '',
            'ar-modes': 'webxr scene-viewer quick-look',
            class: 'model__viewer',
          },
          createElement('button', { slot: 'ar-button', className: 'btn btn--ghost model__ar' }, labels.ar),
        )
      ) : (
        <>
          {poster && (
            <div className="model__poster">
              <Image src={poster} alt={alt} fill sizes="(min-width: 960px) 60vw, 100vw" />
            </div>
          )}
          <button type="button" className="btn model__load" onClick={start} disabled={state === 'loading'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z M4 7.5 12 12l8-4.5M12 12v9" strokeLinejoin="round" />
            </svg>
            {state === 'loading' ? labels.loading : labels.load}
          </button>
        </>
      )}
      <p className="model__hint">{labels.hint}</p>
    </div>
  );
}
