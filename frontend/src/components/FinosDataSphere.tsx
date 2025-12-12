"use client";

import dynamic from "next/dynamic";

export const FinosDataSphere = dynamic(
    () =>
        import("@/components/three/FinosDataSphereScene").then(
            (mod) => mod.FinosDataSphereScene,
        ),
    { ssr: false },
);

export default FinosDataSphere;
