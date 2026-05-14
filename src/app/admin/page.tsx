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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmé", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Terminé", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
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
    if (saved) {
      setToken(saved);
    }
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
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    revenue: bookings
      .filter((b) => b.status !== "cancelled")
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total réservations</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Confirmées</p>
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Terminées</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Chiffre d&apos;affaires</p>
            <p className="text-2xl font-bold">{stats.revenue}&nbsp;&euro;</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "Tous" },
            { key: "confirmed", label: "Confirmés" },
            { key: "completed", label: "Terminés" },
            { key: "cancelled", label: "Annulés" },
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              Aucune réservation trouvée.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Créneau</th>
                    <th className="px-4 py-3 font-medium">Bacs</th>
                    <th className="px-4 py-3 font-medium">Prix</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{b.client_name}</p>
                        <p className="text-xs text-gray-500">{b.client_phone}</p>
                        <p className="text-xs text-gray-400">{b.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(b.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">{b.time_slot}</td>
                      <td className="px-4 py-3">{b.bin_count}</td>
                      <td className="px-4 py-3 font-medium">{b.price}&nbsp;&euro;</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_LABELS[b.status]?.color || "bg-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[b.status]?.label || b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {b.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => updateStatus(b.id, "completed")}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                              >
                                Terminer
                              </button>
                              <button
                                onClick={() => updateStatus(b.id, "cancelled")}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteBooking(b.id)}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
