export const metadata = { title: 'VBamboo · Content editor', robots: { index: false } };

export default function KeystaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
