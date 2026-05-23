"use client";

import { useState, useEffect, useCallback } from "react";

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  address: string;
  bin_count: number;
  price: number;
  date: string;
  time_slot: string;
  status: string;
  created_at: string;
}

const ALL_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const h = 8 + i;
  return `${String(h).padStart(2, "0")}:00 - ${String(h + 1).padStart(2, "0")}:00`;
});

const JOUR_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MOIS_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "À faire", color: "text-orange-700", bg: "bg-orange-100" },
  completed: { label: "Réalisé", color: "text-blue-700", bg: "bg-blue-100" },
  paid: { label: "Payé", color: "text-green-700", bg: "bg-green-100" },
  cancelled: { label: "Annulé", color: "text-red-700", bg: "bg-red-100" },
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"bookings" | "blocked">("bookings");
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [fullDayBlocked, setFullDayBlocked] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [blockedFullDays, setBlockedFullDays] = useState<string[]>([]);
  const [slotDates, setSlotDates] = useState<string[]>([]);

  const fetchBookings = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
  }, []);

  const fetchBlockedOverview = useCallback(async () => {
    const res = await fetch("/api/admin/blocked-dates");
    const data = await res.json();
    setBlockedFullDays((data.blockedDates || []).map((d: { date: string }) => d.date));
    setSlotDates(data.slotDates || []);
  }, []);

  const fetchDayDetail = useCallback(async (date: string) => {
    const res = await fetch(`/api/admin/blocked-dates?date=${date}`);
    const data = await res.json();
    setFullDayBlocked(data.fullDayBlocked);
    setBlockedSlots(data.blockedSlots || []);
    setBookedSlots(data.bookedSlots || []);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) {
      fetchBookings();
      fetchBlockedOverview();
    }
  }, [token, fetchBookings, fetchBlockedOverview]);

  useEffect(() => {
    if (selectedDate) fetchDayDetail(selectedDate);
  }, [selectedDate, fetchDayDetail]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error);
      return;
    }
    sessionStorage.setItem("admin_token", data.token);
    setToken(data.token);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchBookings();
  }

  async function deleteBooking(id: string) {
    if (!confirm("Supprimer cette réservation ?")) return;
    await fetch("/api/admin/bookings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBookings();
  }

  async function toggleSlot(slot: string) {
    if (!selectedDate) return;
    const isBlocked = blockedSlots.includes(slot);
    if (isBlocked) {
      await fetch("/api/admin/blocked-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time_slot: slot }),
      });
    } else {
      await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time_slot: slot }),
      });
    }
    fetchDayDetail(selectedDate);
    fetchBlockedOverview();
  }

  async function toggleFullDay() {
    if (!selectedDate) return;
    if (fullDayBlocked) {
      await fetch("/api/admin/blocked-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, unblock_full_day: true }),
      });
    } else {
      await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, block_full_day: true }),
      });
    }
    fetchDayDetail(selectedDate);
    fetchBlockedOverview();
  }

  function getCalendarDays() {
    const first = new Date(calYear, calMonth, 1);
    const startDay = first.getDay(); // 0=dim
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }

  function fmtDate(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken(null);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-center mb-2">Ecolavage</h1>
          <p className="text-gray-500 text-center mb-6">Espace administrateur</p>
          {loginError && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">
              {loginError}
            </p>
          )}
          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Identifiant"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const stats = {
    total: bookings.length,
    aFaire: bookings.filter((b) => b.status === "confirmed").length,
    realise: bookings.filter((b) => b.status === "completed").length,
    paye: bookings.filter((b) => b.status === "paid").length,
    revenue: bookings
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + b.price, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-green-600">Ecolavage Admin</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Déconnexion
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "bookings"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 Réservations
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "blocked"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🚫 Disponibilités
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "blocked" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendrier */}
            <div className="bg-white rounded-xl shadow-sm p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                    else setCalMonth(calMonth - 1);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-lg"
                >
                  &lsaquo;
                </button>
                <h3 className="font-bold text-lg">
                  {MOIS_LABELS[calMonth]} {calYear}
                </h3>
                <button
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                    else setCalMonth(calMonth + 1);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-lg"
                >
                  &rsaquo;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                {JOUR_LABELS.map((j) => <div key={j} className="py-1 font-medium">{j}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((day, i) => {
                  if (day === null) return <div key={`e${i}`} />;
                  const dateStr = fmtDate(day);
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  const isPast = dateStr < todayStr;
                  const isSelected = selectedDate === dateStr;
                  const isFullBlocked = blockedFullDays.includes(dateStr);
                  const hasBlockedSlots = slotDates.includes(dateStr);
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isPast && setSelectedDate(dateStr)}
                      disabled={isPast}
                      className={`aspect-square rounded-lg text-sm font-medium flex items-center justify-center relative transition-all
                        ${isPast ? "text-gray-300 cursor-default" : "hover:bg-gray-100 cursor-pointer"}
                        ${isSelected ? "ring-2 ring-green-500 bg-green-50" : ""}
                        ${isFullBlocked ? "bg-red-100 text-red-700" : ""}
                        ${hasBlockedSlots && !isFullBlocked ? "bg-orange-50 text-orange-700" : ""}
                        ${isToday && !isFullBlocked && !hasBlockedSlots ? "bg-green-50 text-green-700 font-bold" : ""}
                      `}
                    >
                      {day}
                      {isFullBlocked && <span className="absolute bottom-0.5 text-[8px]">bloqué</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Jour bloqué</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-50 border border-orange-300" /> Créneaux bloqués</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-green-300" /> Aujourd&apos;hui</span>
              </div>
            </div>

            {/* Détail du jour sélectionné */}
            <div className="bg-white rounded-xl shadow-sm p-5 lg:w-80">
              {!selectedDate ? (
                <div className="text-center text-gray-400 py-12">
                  <p className="text-4xl mb-3">📅</p>
                  <p>Clique sur un jour du calendrier</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-lg mb-1">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>

                  {/* Bouton journée entière */}
                  <button
                    onClick={toggleFullDay}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm mb-4 transition-colors ${
                      fullDayBlocked
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {fullDayBlocked ? "🔴 Journée bloquée — Débloquer" : "Bloquer toute la journée"}
                  </button>

                  {!fullDayBlocked && (
                    <div className="space-y-1.5">
                      {ALL_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isBlocked = blockedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            onClick={() => !isBooked && toggleSlot(slot)}
                            disabled={isBooked}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                              isBooked
                                ? "bg-blue-50 text-blue-400 cursor-not-allowed"
                                : isBlocked
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            <span className="font-medium">{slot}</span>
                            <span className="text-xs">
                              {isBooked ? "Réservé" : isBlocked ? "Bloqué" : "Dispo"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "bookings" && <>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-400">
            <p className="text-sm text-gray-500">À faire</p>
            <p className="text-2xl font-bold text-orange-600">{stats.aFaire}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-400">
            <p className="text-sm text-gray-500">Réalisé</p>
            <p className="text-2xl font-bold text-blue-600">{stats.realise}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-400">
            <p className="text-sm text-gray-500">Payé</p>
            <p className="text-2xl font-bold text-green-600">{stats.paye}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">CA encaissé</p>
            <p className="text-2xl font-bold">{stats.revenue}&nbsp;&euro;</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "all", label: "Tous" },
            { key: "confirmed", label: "À faire" },
            { key: "completed", label: "Réalisé" },
            { key: "paid", label: "Payé" },
            { key: "cancelled", label: "Annulé" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste des commandes */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm">
              Aucune commande trouvée.
            </div>
          ) : (
            filtered.map((b) => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.confirmed;
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  {/* Info client */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-base">{b.client_name}</p>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {b.client_phone} &middot; {b.client_email}
                    </p>
                    <p className="text-sm text-gray-400 truncate">{b.address}</p>
                  </div>

                  {/* Détails RDV */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Date</p>
                      <p className="font-medium">
                        {new Date(b.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Heure</p>
                      <p className="font-medium">{b.time_slot}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Bacs</p>
                      <p className="font-medium">{b.bin_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Prix</p>
                      <p className="font-bold text-green-600">{b.price}&nbsp;&euro;</p>
                    </div>
                  </div>

                  {/* Actions statut */}
                  <div className="flex flex-wrap items-center gap-2">
                    {b.status !== "confirmed" && (
                      <button
                        onClick={() => updateStatus(b.id, "confirmed")}
                        className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                      >
                        À faire
                      </button>
                    )}
                    {b.status !== "completed" && (
                      <button
                        onClick={() => updateStatus(b.id, "completed")}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        Réalisé
                      </button>
                    )}
                    {b.status !== "paid" && (
                      <button
                        onClick={() => updateStatus(b.id, "paid")}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                      >
                        Payé
                      </button>
                    )}
                    {b.status !== "cancelled" && (
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      onClick={() => deleteBooking(b.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>}
      </div>
    </div>
  );
}
