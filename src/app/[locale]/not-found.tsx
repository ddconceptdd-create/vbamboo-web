import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-head container" style={{ minHeight: '60vh' }}>
      <span className="eyebrow">404</span>
      <h1 className="page-head__title">Không tìm thấy trang · Page not found</h1>
      <p style={{ marginTop: 32 }}>
        <Link href="/vi" className="link-line">Trang chủ</Link>
        <span style={{ margin: '0 16px' }}>·</span>
        <Link href="/en" className="link-line">Home</Link>
      </p>
    </div>
  );
}
