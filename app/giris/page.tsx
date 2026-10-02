"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      router.push("/");
    } catch {
      setErr("Giriş olmadı. E-posta / şifreyi kontrol edin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pt-10">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-center text-5xl">🎹</p>
        <h1 className="mt-2 text-center text-xl font-bold">
          Öğretmen Girişi
        </h1>
        <p className="mt-1 text-center text-sm text-stone-500">
          Sadece piyano öğretmeni kullanır
        </p>
        {!isFirebaseConfigured && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            Önce .env.local dosyasına Firebase anahtarlarını ekleyin.
          </p>
        )}
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            placeholder="E-posta"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            placeholder="Şifre"
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
          {err && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {err}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-rose-800 py-3 font-bold text-white active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "Giriliyor…" : "Giriş Yap"}
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] text-stone-400">
          Firebase Console → Authentication → Email/Password kullanıcısı açın
        </p>
      </div>
    </div>
  );
}
