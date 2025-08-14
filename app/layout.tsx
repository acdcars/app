import "./globals.css";

export const metadata = { title: "ACD Cars AutoUpdate Test" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}