import Image from 'next/image';

type Dims = { width: number | null; depth: number | null; height: number | null; seatHeight: number | null };
type Labels = { front: string; side: string; plan: string; schematic: string; mm: string; open: string };
export type Drawing = { image: string | null; caption: string; background: 'light' | 'dark' };

/**
 * Technical drawings. Uses the uploaded drawings when present, each on the
 * panel colour that suits its line work (ivory for dark lines, moss green for
 * light lines); otherwise draws a scaled schematic from the published dimensions.
 * Deliberately static: no animation, so details can be examined.
 */
export default function TechnicalDrawings({ drawings, dims, labels }: { drawings: Drawing[]; dims: Dims | null; labels: Labels }) {
  const uploaded = drawings.filter((d): d is Drawing & { image: string } => Boolean(d.image));

  if (uploaded.length > 0) {
    return (
      <div className="drawings" data-count={uploaded.length}>
        <div className="drawings__grid">
          {uploaded.map((d, i) => (
            <figure key={i} className={`drawing drawing--${d.background}`}>
              <a href={d.image} target="_blank" rel="noopener" className="drawing__frame" aria-label={`${labels.open}: ${d.caption}`}>
                <Image src={d.image} alt={d.caption} fill sizes="(min-width: 960px) 40vw, 100vw" unoptimized={d.image.endsWith('.svg')} />
              </a>
              {d.caption && <figcaption>{d.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    );
  }

  if (!dims) return null;
  const views = [
    { key: 'front', label: labels.front, w: dims.width, h: dims.height, seat: dims.seatHeight },
    { key: 'side', label: labels.side, w: dims.depth, h: dims.height, seat: dims.seatHeight },
    { key: 'plan', label: labels.plan, w: dims.width, h: dims.depth, seat: null },
  ] as const;
  const max = Math.max(dims.width ?? 0, dims.depth ?? 0, dims.height ?? 0) || 1;

  return (
    <div className="drawings drawings--schematic" data-count={3}>
      <div className="drawings__grid">
        {views.map((v) => (
          <figure key={v.key} className="drawing drawing--light">
            <div className="drawing__frame">
              {v.w && v.h ? <Schematic w={v.w} h={v.h} seat={v.seat ?? null} max={max} mm={labels.mm} plan={v.key === 'plan'} /> : null}
            </div>
            <figcaption>{v.label}</figcaption>
          </figure>
        ))}
      </div>
      <p className="drawings__note">{labels.schematic}</p>
    </div>
  );
}

function Schematic({ w, h, seat, max, mm, plan }: { w: number; h: number; seat: number | null; max: number; mm: string; plan: boolean }) {
  const S = 200;
  const pad = 34;
  const rw = (w / max) * (S - pad * 2);
  const rh = (h / max) * (S - pad * 2);
  const x = (S - rw) / 2 + 8;
  const y = (S - rh) / 2 - 6;
  const sy = seat ? y + rh - (seat / h) * rh : null;
  const f = (n: number) => n.toLocaleString('en-US').replace(/,/g, ' ');
  return (
    <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`${f(w)} × ${f(h)} ${mm}`} className="schematic">
      <rect x={x} y={y} width={rw} height={rh} rx={plan ? 4 : 2} className="schematic__body" />
      {sy && <line x1={x} x2={x + rw} y1={sy} y2={sy} className="schematic__seat" />}
      {/* width */}
      <g className="schematic__dim">
        <line x1={x} x2={x + rw} y1={y + rh + 14} y2={y + rh + 14} />
        <line x1={x} x2={x} y1={y + rh + 9} y2={y + rh + 19} />
        <line x1={x + rw} x2={x + rw} y1={y + rh + 9} y2={y + rh + 19} />
        <text x={x + rw / 2} y={y + rh + 28} textAnchor="middle">{f(w)}</text>
      </g>
      {/* height */}
      <g className="schematic__dim">
        <line x1={x - 14} x2={x - 14} y1={y} y2={y + rh} />
        <line x1={x - 19} x2={x - 9} y1={y} y2={y} />
        <line x1={x - 19} x2={x - 9} y1={y + rh} y2={y + rh} />
        <text x={x - 20} y={y + rh / 2} textAnchor="middle" transform={`rotate(-90 ${x - 20} ${y + rh / 2})`}>{f(h)}</text>
      </g>
      {sy && seat && (
        <g className="schematic__dim schematic__dim--seat">
          <line x1={x + rw - 10} x2={x + rw - 10} y1={sy} y2={y + rh} />
          <text x={x + rw - 14} y={(sy + y + rh) / 2 + 3} textAnchor="end">{f(seat)}</text>
        </g>
      )}
    </svg>
  );
}
