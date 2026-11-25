'use client';

import Link from 'next/link';
import { useSelection } from '@/lib/selection';

/** Carries the product and the currently selected version into the contact form. */
export default function EnquireButton({
  locale,
  slug,
  defaults,
  label,
  className = 'btn',
}: {
  locale: string;
  slug: string;
  defaults: { finish: string | null; fabric: string | null };
  label: string;
  className?: string;
}) {
  const sel = useSelection(defaults);
  const q = new URLSearchParams({ type: 'purchase', product: slug });
  if (sel.finish) q.set('finish', sel.finish);
  if (sel.fabric) q.set('fabric', sel.fabric);
  return (
    <Link href={`/${locale}/contact?${q}`} className={className}>
      {label}
      <span aria-hidden="true">→</span>
    </Link>
  );
}
