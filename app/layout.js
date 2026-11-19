import { Source_Sans_3 } from 'next/font/google';
import './globals.css';

const body = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'Admin | Consultation Requests',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" className={body.variable}>
      <body>{children}</body>
    </html>
  );
}
