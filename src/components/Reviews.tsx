"use client";

import { useState, useEffect } from "react";

interface Review {
  id: number;
  client_name: string;
  rating: number;
  comment: string;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow-400 text-lg">
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews || []));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">
          Ce que disent nos clients
        </h2>
        <p className="text-center text-gray-500 mb-14">
          Découvrez les avis de nos clients satisfaits
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <Stars count={r.rating} />
              <p className="text-gray-700 mt-3 mb-4 leading-relaxed">
                &ldquo;{r.comment}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                  {r.client_name.charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-sm">{r.client_name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
