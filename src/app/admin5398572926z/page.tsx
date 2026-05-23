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

interface BlockedDate {
  id: number;
  date: string;
  reason: string | null;
}

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
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  const fetchBookings = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
  }, []);

  const fetchBlockedDates = useCallback(async () => {
    const res = await fetch("/api/admin/blocked-dates");
    const data = await res.json();
    setBlockedDates(data.blockedDates || []);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) {
      fetchBookings();
      fetchBlockedDates();
    }
  }, [token, fetchBookings, fetchBlockedDates]);

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

  async function addBlockedDate(e: React.FormEvent) {
    e.preventDefault();
    if (!newBlockedDate) return;
    await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newBlockedDate, reason: newBlockedReason }),
    });
    setNewBlockedDate("");
    setNewBlockedReason("");
    fetchBlockedDates();
  }

  async function removeBlockedDate(id: number) {
    await fetch("/api/admin/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBlockedDates();
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
          <div>
            <h2 className="text-2xl font-bold mb-6">Bloquer des jours</h2>
            <p className="text-gray-500 mb-6">
              Les jours bloqués n&apos;apparaîtront plus dans les créneaux disponibles pour les clients.
            </p>

            {/* Formulaire */}
            <form
              onSubmit={addBlockedDate}
              className="bg-white rounded-xl shadow-sm p-5 mb-8 flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date à bloquer</label>
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Raison (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex : Vacances, cours..."
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Bloquer
                </button>
              </div>
            </form>

            {/* Liste des dates bloquées */}
            <div className="space-y-3">
              {blockedDates.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm">
                  Aucun jour bloqué. Vous êtes disponible tous les jours.
                </div>
              ) : (
                blockedDates.map((bd) => {
                  const d = new Date(bd.date + "T00:00:00");
                  const isPast = d < new Date(new Date().toDateString());
                  return (
                    <div
                      key={bd.id}
                      className={`bg-white rounded-xl shadow-sm p-5 flex items-center justify-between ${
                        isPast ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex flex-col items-center justify-center text-xs font-bold">
                          <span className="text-lg leading-none">
                            {d.getDate()}
                          </span>
                          <span className="uppercase text-[10px]">
                            {d.toLocaleDateString("fr-FR", { month: "short" })}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {d.toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          {bd.reason && (
                            <p className="text-sm text-gray-500">{bd.reason}</p>
                          )}
                          {isPast && (
                            <span className="text-xs text-gray-400">Passé</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeBlockedDate(bd.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Débloquer
                      </button>
                    </div>
                  );
                })
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
