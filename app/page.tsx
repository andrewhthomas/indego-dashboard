"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr:false because deck.gl + MapLibre touch window/document.
const LivingMap = dynamic(
  () => import("@/components/maps/living-map").then((m) => m.LivingMap),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-background" />,
  },
);

export default function Home() {
  return <LivingMap />;
}
