import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Piyano Ders Takip 🎹",
  description: "Özel ders, ödeme ve randevu takibi — öğretmene hediye",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#881337",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr">
      <body className="bg-stone-100 text-stone-900 antialiased">
        <AuthProvider>
          <div className="mx-auto min-h-dvh w-full max-w-md bg-stone-50 pb-24 shadow-sm">
            <header className="sticky top-0 z-40 bg-rose-900 px-4 py-3 text-white">
              <p className="text-base font-bold leading-tight">
                🎹 Piyano Ders Takip
              </p>
              <p className="text-[11px] opacity-80">
                Ödeme • Gün • Randevu — tek ekranda
              </p>
            </header>
            <main className="px-4 pt-4">{children}</main>
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
