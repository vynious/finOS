"use client";

import dynamic from "next/dynamic";

export const ProviderSolarSystem = dynamic(
    () =>
        import("@/components/three/ProviderSolarSystemScene").then(
            (mod) => mod.ProviderSolarSystemScene,
        ),
    { ssr: false },
);

export default ProviderSolarSystem;
