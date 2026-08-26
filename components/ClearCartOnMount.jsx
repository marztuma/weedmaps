"use client";

import { useEffect } from "react";
import { useCart } from "./CartContext";

/* The order exists in the database now, so the browser bag has done its job.
   Clearing it here rather than at submit means a failed submit keeps the bag. */
export default function ClearCartOnMount() {
  const { clear, count } = useCart();
  useEffect(() => { if (count > 0) clear(); }, [count, clear]);
  return null;
}
