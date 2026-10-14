// Utilitas format untuk modul HR One (locale Indonesia).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2024-03-05" -> "5 Mar 2024". Mengembalikan fallback bila kosong. */
export function formatDate(value, fallback = "—") {
    if (!value) return fallback;
    const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return fallback;
    return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatNumber(value) {
    return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}

/** Selisih tahun & bulan dari tanggal sampai hari ini, mis. "3 th 4 bln". */
export function durationSince(value) {
    if (!value) return null;
    const start = new Date(String(value).slice(0, 10) + "T00:00:00");
    if (Number.isNaN(start.getTime())) return null;
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months -= 1;
    if (months < 0) return null;
    const years = Math.floor(months / 12);
    const rest = months % 12;
    if (years === 0) return `${rest} bln`;
    return rest === 0 ? `${years} th` : `${years} th ${rest} bln`;
}

export function ageFrom(value) {
    if (!value) return null;
    const birth = new Date(String(value).slice(0, 10) + "T00:00:00");
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age >= 0 ? age : null;
}

export function initials(name = "") {
    return (
        String(name)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join("") || "?"
    );
}

/** Indeks warna yang konsisten untuk teks yang sama (dipakai Avatar). */
export function hashIndex(seed = "", size = 1) {
    let hash = 0;
    for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return hash % size;
}
