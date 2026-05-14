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

  const fetchBookings = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

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
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-600">Ecolavage Admin</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Déconnexion
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
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
      </div>
    </div>
  );
}
