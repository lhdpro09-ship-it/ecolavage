import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SERVICES = [
  { bins: 1, price: 10, label: "1 bac" },
  { bins: 2, price: 18, label: "2 bacs" },
  { bins: 3, price: 25, label: "3 bacs" },
];

const STEPS = [
  {
    num: "1",
    title: "Choisissez votre formule",
    desc: "Sélectionnez le nombre de bacs à nettoyer.",
  },
  {
    num: "2",
    title: "Réservez un créneau",
    desc: "Choisissez une date et un horaire qui vous conviennent.",
  },
  {
    num: "3",
    title: "On s'occupe de tout",
    desc: "Nous venons chez vous pour un nettoyage impeccable.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-600 to-green-800 text-white">
          <div className="max-w-6xl mx-auto px-4 py-24 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Des poubelles propres,
              <br />
              sans effort
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Ecolavage nettoie vos bacs à domicile. Hygiène, fraîcheur et
              tranquillité d&apos;esprit, à partir de 10&nbsp;&euro;.
            </p>
            <Link
              href="/booking"
              className="inline-block bg-white text-green-700 font-semibold text-lg px-8 py-4 rounded-xl hover:bg-green-50 transition-colors"
            >
              Réserver maintenant
            </Link>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-14">
              Comment ça marche ?
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {STEPS.map((s) => (
                <div key={s.num} className="text-center">
                  <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {s.num}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-[var(--color-text-light)]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tarifs */}
        <section id="tarifs" className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-14">
              Nos tarifs
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {SERVICES.map((svc) => (
                <div
                  key={svc.bins}
                  className={`bg-white rounded-2xl p-8 text-center border-2 transition-shadow hover:shadow-lg ${
                    svc.bins === 2
                      ? "border-green-500 shadow-md"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {svc.bins === 2 && (
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      Populaire
                    </span>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{svc.label}</h3>
                  <p className="text-4xl font-bold text-green-600 mb-1">
                    {svc.price}&nbsp;&euro;
                  </p>
                  <p className="text-sm text-[var(--color-text-light)] mb-6">
                    par intervention
                  </p>
                  <Link
                    href={`/booking?bins=${svc.bins}`}
                    className="inline-block w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Choisir
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
