import type { Metadata } from 'next';
import Media from '@/components/Media';
import BookingForm from '@/components/BookingForm';
import { getDict, t, type Locale } from '@/i18n';
import { getStores, IS_PRODUCTION } from '@/lib/content';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).stores.title };
}

export default async function StoresPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const ds = d.stores;
  const stores = await getStores();
  return (
    <div className="page-enter">
      <header className="page-head container">
        <span className="eyebrow" data-reveal>VBamboo</span>
        <h1 className="page-head__title" data-reveal>{ds.title}</h1>
        <p className="lead page-head__lead" data-reveal style={{ '--d': '100ms' } as React.CSSProperties}>{ds.lead}</p>
      </header>
      <section className="container stores">
        {stores.length === 0 && <p className="prose">{ds.empty}</p>}
        {stores.map((s, i) => (
          <article key={s.slug} className="store" data-reveal style={{ '--d': `${(i % 2) * 100}ms` } as React.CSSProperties}>
            <Media src={s.image} alt={s.name} ratio="3 / 2" sizes="(min-width: 960px) 40vw, 100vw" className="store__img" />
            <div className="store__body">
              <div className="store__head">
                <span className="eyebrow">{s.kind === 'showroom' ? ds.showroom : ds.dealer}</span>
                {!IS_PRODUCTION && s.sample && <span className="badge-sample">{d.common.sample}</span>}
              </div>
              <h2 className="store__name">{s.name}</h2>
              <p className="store__city caps">{[t(s.city, locale), t(s.country, locale)].filter(Boolean).join(', ')}</p>
              <dl className="store__details">
                <div>
                  <dt>{d.contact.direct}</dt>
                  <dd>
                    <address style={{ whiteSpace: 'pre-line' }}>{t(s.address, locale)}</address>
                    {s.phone && <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>}
                    {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
                  </dd>
                </div>
                <div>
                  <dt>{ds.hours}</dt>
                  <dd style={{ whiteSpace: 'pre-line' }}>{t(s.hours, locale)}</dd>
                </div>
              </dl>
              {s.appointmentRequired && <p className="store__appt">{ds.appointment}</p>}
              <div className="store__actions">
                {s.mapsUrl && (
                  <a href={s.mapsUrl} target="_blank" rel="noopener" className="btn btn--ghost">
                    {ds.directions} <span aria-hidden="true">↗</span>
                  </a>
                )}
                {s.appointmentRequired && s.bookingUrl && (
                  <a href={s.bookingUrl} target="_blank" rel="noopener" className="btn">
                    {ds.book} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
              {s.appointmentRequired && !s.bookingUrl && (
                <BookingForm store={s.name} locale={locale} dict={ds} formDict={d.contact} />
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
