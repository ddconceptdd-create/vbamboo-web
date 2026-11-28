'use client';

import { useRef, useState } from 'react';

/**
 * Touch screens have no hover: a small button (and a sideways swipe on the
 * photo) switches the card between the studio shot and the room photograph.
 */
export default function CardViewToggle({ labels }: { labels: { studio: string; room: string; toggle: string } }) {
  const [room, setRoom] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const flip = (next: boolean) => {
    setRoom(next);
    btn.current?.closest('.product-card')?.toggleAttribute('data-room', next);
  };
  return (
    <button
      ref={btn}
      type="button"
      className="card-toggle"
      aria-pressed={room}
      aria-label={labels.toggle}
      onClick={() => flip(!room)}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <span data-on={!room || undefined}>{labels.studio}</span>
      <span data-on={room || undefined}>{labels.room}</span>
    </button>
  );
}
