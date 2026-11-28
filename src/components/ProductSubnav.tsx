'use client';

import { useEffect, useState } from 'react';

/**
 * Product bar (Tribù-style): stays under the site header once the opening image
 * has passed, names the piece, jumps to dimensions, drawings, versions or 3D,
 * and keeps "Enquire" one tap away with the chosen version.
 */
export default function ProductSubnav({
  name,
  sections,
  label,
  children,
}: {
  name: string;
  sections: { id: string; label: string }[];
  label: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? '');
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav className="p-nav" aria-label={label}>
      <div className="container p-nav__inner">
        <span className="p-nav__name caps">{name}</span>
        <ul className="p-nav__links">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="p-nav__cta">{children}</div>
      </div>
    </nav>
  );
}
