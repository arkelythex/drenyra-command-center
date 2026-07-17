import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "IBM Plex Sans, system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
