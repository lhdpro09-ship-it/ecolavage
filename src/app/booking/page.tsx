"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityResponse {
  slots: TimeSlot[];
}

const PRICING: Record<number, number> = { 1: 10, 2: 18, 3: 25 };

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const searchParams = useSearchParams();
  const initialBins = Number(searchParams.get("bins")) || 1;

  const [step, setStep] = useState(1);
  const [bins, setBins] = useState(initialBins);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const fetchSlots = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setSlots([]);
    setTimeSlot("");
    try {
      const res = await fetch(`/api/availability?date=${selectedDate}`);
      const data: AvailabilityResponse = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (date) fetchSlots(date);
  }, [date, fetchSlots]);

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: name,
          client_email: email,
          client_phone: phone,
          address,
          bin_count: bins,
          date,
          time_slot: timeSlot,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la réservation");
      }
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    setSubmitting(false);
  }

  if (confirmed) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              ✓
            </div>
            <h2 className="text-2xl font-bold mb-3">Réservation confirmée !</h2>
            <p className="text-[var(--color-text-light)] mb-2">
              <strong>{bins} bac{bins > 1 ? "s" : ""}</strong> — {PRICING[bins]}&nbsp;&euro;
            </p>
            <p className="text-[var(--color-text-light)] mb-2">
              {new Date(date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              à {timeSlot}
            </p>
            <p className="text-[var(--color-text-light)] mb-6">{address}</p>
            <p className="text-sm text-[var(--color-text-light)]">
              Un email de confirmation vous sera envoyé à <strong>{email}</strong>.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Réserver un nettoyage
          </h1>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-1 rounded ${
                      step > s ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1 - Formule */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow p-8">
              <h2 className="text-xl font-semibold mb-6">
                Choisissez votre formule
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBins(n)}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      bins === n
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-2xl font-bold text-green-600">
                      {PRICING[n]}&nbsp;&euro;
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {n} bac{n > 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Continuer
              </button>
            </div>
          )}

          {/* Step 2 - Date & Heure */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow p-8">
              <h2 className="text-xl font-semibold mb-6">
                Choisissez une date et un créneau
              </h2>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {date && loading && (
                <p className="text-sm text-gray-500 mb-4">
                  Chargement des créneaux...
                </p>
              )}
              {date && !loading && slots.length === 0 && (
                <p className="text-sm text-red-500 mb-4">
                  Aucun créneau disponible pour cette date. Essayez un autre jour.
                </p>
              )}
              {slots.length > 0 && (
                <>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Créneau horaire
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {slots.map((slot) => {
                      const label = `${slot.start} - ${slot.end}`;
                      return (
                        <button
                          key={label}
                          onClick={() => setTimeSlot(label)}
                          className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            timeSlot === label
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!date || !timeSlot}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Infos client */}
          {step === 3 && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow p-8"
            >
              <h2 className="text-xl font-semibold mb-6">Vos informations</h2>
              {error && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">
                  {error}
                </p>
              )}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse complète
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Numéro, rue, code postal, ville"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Récap */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-2">Récapitulatif</h3>
                <p className="text-sm text-gray-600">
                  {bins} bac{bins > 1 ? "s" : ""} —{" "}
                  <strong>{PRICING[bins]}&nbsp;&euro;</strong>
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  — {timeSlot}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Réservation..." : `Confirmer — ${PRICING[bins]} €`}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
