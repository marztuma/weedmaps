"use client";

import { createContext, useContext, useMemo, useState } from "react";

/* This marketplace is delivery-only: there is no pickup, and no fulfilment fork.
   The master state is therefore the address, whether to show only services
   delivering right now, and how to rank them. All three drive the shop list and
   the counted statement — none of them is decorative. */

const DeliveryContext = createContext(null);

export function DeliveryProvider({ children, defaultLocation = "Los Angeles, CA" }) {
  const [location, setLocation] = useState(defaultLocation);
  const [liveOnly, setLiveOnly] = useState(true);
  const [sort, setSort] = useState("fastest");

  const value = useMemo(
    () => ({ location, setLocation, liveOnly, setLiveOnly, sort, setSort }),
    [location, liveOnly, sort]
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used inside <DeliveryProvider>");
  return ctx;
}
