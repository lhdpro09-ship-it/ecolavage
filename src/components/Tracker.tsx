"use client";

import { useEffect } from "react";

export default function Tracker() {
  useEffect(() => {
    // On ne compte qu'une fois par session de navigation
    if (!sessionStorage.getItem("_ev")) {
      fetch("/api/track", { method: "POST" }).catch(() => {});
      sessionStorage.setItem("_ev", "1");
    }
  }, []);

  return null;
}
