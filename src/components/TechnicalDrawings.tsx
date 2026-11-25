import Image from 'next/image';

type Dims = { width: number | null; depth: number | null; height: number | null; seatHeight: number | null };
type Labels = { front: string; side: string; plan: string; schematic: string; mm: string };

/**
 * Front, side and plan views. Uses the uploaded technical drawings when present;
 * otherwise draws a scaled schematic from the published dimensions.
 * Deliberately static: no animation, so details can be examined.
 */
export default function TechnicalDrawings({
  drawings,
  dims,
  labels,
}: {
  drawings: { front: string | null; side: string | null; plan: string | null };
  dims: Dims | null;
  labels: Labels;
}) {
  const views = [
    { key: 'front', label: labels.front, src: drawings.front, w: dims?.width, h: dims?.height, seat: dims?.seatHeight },
    { key: 'side', label: labels.side, src: drawings.side, w: dims?.depth, h: dims?.height, seat: dims?.seatHeight },
    { key: 'plan', label: labels.plan, src: drawings.plan, w: dims?.width, h: dims?.depth, seat: null },
  ] as const;
  const anyDrawing = views.some((v) => v.src);
  if (!anyDrawing && !dims) return null;
  const max = Math.max(dims?.width ?? 0, dims?.depth ?? 0, dims?.height ?? 0) || 1;

  return (
    <div className="drawings">
      <div className="drawings__grid">
        {views.map((v) => (
          <figure key={v.key} className="drawing">
            <div className="drawing__frame">
              {v.src ? (
                <Image src={v.src} alt={v.label} fill sizes="(min-width: 960px) 20vw, 33vw" unoptimized={v.src.endsWith('.svg')} />
              ) : v.w && v.h ? (
                <Schematic w={v.w} h={v.h} seat={v.seat ?? null} max={max} mm={labels.mm} plan={v.key === 'plan'} />
              ) : null}
            </div>
            <figcaption>{v.label}</figcaption>
          </figure>
        ))}
      </div>
      {!anyDrawing && <p className="drawings__note">{labels.schematic}</p>}
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
