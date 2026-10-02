"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

const Ctx = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u && pathname !== "/giris") router.replace("/giris");
      if (u && pathname === "/giris") router.replace("/");
    });
    return () => unsub();
  }, [router, pathname]);

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
          <p className="text-base font-bold">🔧 Firebase ayarı gerekli</p>
          <p className="mt-2">
            Proje köküne <code>.env.local</code> dosyası oluşturup{" "}
            <code>.env.example</code> içindeki anahtarları doldurun. Sonra
            sayfayı yenileyin.
          </p>
          <p className="mt-2 text-xs opacity-70">
            Detay: README-KURULUM.md dosyasına bakın.
          </p>
        </div>
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-2xl">🎹</p>
      </div>
    );
  }

  return <Ctx.Provider value={{ user, loading }}>{children}</Ctx.Provider>;
}

export async function logout() {
  await signOut(auth);
}
