export default function Footer() {
  return (
    <footer className="bg-[var(--color-text)] text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-lg font-semibold text-white mb-2">Ecolavage</p>
        <p className="text-sm">
          Nettoyage de poubelles professionnel &agrave; domicile
        </p>
        <p className="text-xs mt-4 text-gray-500">
          &copy; {new Date().getFullYear()} Ecolavage. Tous droits r&eacute;serv&eacute;s.
        </p>
      </div>
    </footer>
  );
}
