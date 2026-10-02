export function tl(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function fmtDate(ts: number) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date(ts));
}

export function fmtDateTime(ts: number) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function fmtTime(ts: number) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function toInputValue(ts: number) {
  const d = new Date(ts);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function normalizePhone(p?: string) {
  if (!p) return "";
  const digits = p.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "9" + digits;
  if (digits.length === 10) return "90" + digits;
  return digits;
}

export function whatsappLink(
  phone: string | undefined,
  message: string
): string | null {
  const to = normalizePhone(phone);
  if (!to) return null;
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}

export function isToday(ts: number) {
  const a = new Date(ts);
  const b = new Date();
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // pazartesi başlangıç
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

const TR_AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function ayEtiketi(yil: number, ay: number) {
  return `${TR_AYLAR[ay]} ${yil}`;
}

export function ayniGun(a: number, b: number) {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

export function gunBaslangici(gun: number) {
  const d = new Date(gun);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function gunBitisi(gun: number) {
  const d = new Date(gun);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function aydanSonra(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

export function aydanOnce(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
}
