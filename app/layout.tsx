export const metadata = { title: 'Aplikacja firmowa — ACDCars' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body style={{margin:0,fontFamily:'system-ui, Segoe UI, Roboto, Arial, sans-serif'}}>
        {children}
      </body>
    </html>
  );
}
