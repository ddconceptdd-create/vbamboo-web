import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '@fontsource/be-vietnam-pro/300.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@/styles/globals.css';
import '@/styles/site.css';
import { LOCALES, getDict, isLocale, type Locale } from '@/i18n';
import { getCategoriesInUse, getSearchIndex, getSite, IS_PRODUCTION } from '@/lib/content';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevealObserver from '@/components/RevealObserver';

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

export const viewport: Viewport = {
  themeColor: '#2D3826',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const vi = locale === 'vi';
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      default: vi ? 'VBamboo · Nội thất tre Việt Nam' : 'VBamboo · Vietnamese bamboo furniture',
      template: '%s · VBamboo',
    },
    description: vi
      ? 'Nội thất tre đương đại, chế tác thủ công tại Việt Nam cho kiến trúc sư, nhà thiết kế và dự án khách sạn.'
      : 'Contemporary bamboo furniture handcrafted in Vietnam for architects, designers and hospitality projects.',
    openGraph: { images: ['/brand/cover.webp'], siteName: 'VBamboo' },
    robots: IS_PRODUCTION ? undefined : { index: false, follow: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDict(locale);
  const [index, site, categories] = await Promise.all([getSearchIndex(locale), getSite(), getCategoriesInUse()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Marks the page as JS-enabled before paint so entrance effects never flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {dict.nav.skip}
        </a>
        <Header locale={locale} dict={dict.nav} searchDict={dict.search} index={index} />
        <main id="main">{children}</main>
        <Footer locale={locale} site={site} categories={[...categories]} />
        <RevealObserver />
      </body>
    </html>
  );
}
