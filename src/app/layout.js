import './globals.css';

export const metadata = {
  title: 'Prowider — Lead Distribution System',
  description: 'Mini Lead Distribution System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}