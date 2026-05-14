import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-[var(--color-primary)]">
          Ecolavage
        </Link>
        <Link
          href="/booking"
          className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Réserver
        </Link>
      </div>
    </header>
  );
}
