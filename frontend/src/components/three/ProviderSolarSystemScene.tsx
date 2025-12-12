"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    AdditiveBlending,
    BufferAttribute,
    Color,
    InstancedMesh,
    Object3D,
    Points,
    PointsMaterial,
    Vector2,
    Vector3,
} from "three";

type ProviderPlanet = {
    id: string;
    label: string;
    radius: number;
    angularSpeed: number;
    color: string;
    icon: ReactNode;
    initialAngle: number;
    size: number;
};

type Packet = {
    providerId: string;
    t: number;
    speed: number;
};

type ProviderSolarSystemSceneProps = {
    accentColor?: string;
    height?: number | string;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const providerPlanets: ProviderPlanet[] = [
    {
        id: "trustbank",
        label: "TrustBank",
        radius: 1.6,
        angularSpeed: (Math.PI * 2) / 24,
        color: "#60a5fa",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                    x="4"
                    y="7"
                    width="16"
                    height="11"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="currentColor"
                    fillOpacity="0.08"
                />
                <path
                    d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4H14.5A1.5 1.5 0 0 1 16 5.5V7"
                    stroke="currentColor"
                    strokeWidth="1.2"
                />
            </svg>
        ),
        initialAngle: 0,
        size: 0.16,
    },
    {
        id: "youtrip",
        label: "YouTrip",
        radius: 2.0,
        angularSpeed: (Math.PI * 2) / 26,
        color: "#8b5cf6",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                    x="4"
                    y="6"
                    width="16"
                    height="12"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="currentColor"
                    fillOpacity="0.08"
                />
                <path
                    d="M9 10h6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                />
                <path
                    d="M9 13h6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                />
            </svg>
        ),
        initialAngle: Math.PI / 2.6,
        size: 0.15,
    },
    {
        id: "revolut",
        label: "Revolut",
        radius: 2.5,
        angularSpeed: (Math.PI * 2) / 28,
        color: "#22d3ee",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle
                    cx="12"
                    cy="12"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="currentColor"
                    fillOpacity="0.08"
                />
                <path
                    d="M10.5 9.5h2c1 0 1.5.5 1.5 1.25 0 .75-.5 1.25-1.5 1.25H11v2.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </svg>
        ),
        initialAngle: Math.PI * 1.1,
        size: 0.16,
    },
    {
        id: "wise",
        label: "Wise",
        radius: 3.0,
        angularSpeed: (Math.PI * 2) / 30,
        color: "#34d399",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                    d="M5 6h10.5L13 10l3.5 4H5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="currentColor"
                    fillOpacity="0.08"
                />
            </svg>
        ),
        initialAngle: Math.PI * 0.35,
        size: 0.15,
    },
];

const createStarfield = (count: number) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
};

const SceneContents = ({ accentColor }: { accentColor: string }) => {
    const orbitGroup = useRef<Object3D>(null);
    const packetsRef = useRef<InstancedMesh>(null);
    const tmp = useMemo(() => new Object3D(), []);
    const pointer = useRef(new Vector2(0, 0));
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const starPositions = useMemo(() => createStarfield(240), []);

    const packets = useMemo(() => {
        const list: Packet[] = [];
        providerPlanets.forEach((provider) => {
            const count = 6;
            for (let i = 0; i < count; i += 1) {
                list.push({
                    providerId: provider.id,
                    t: Math.random(),
                    speed: 0.15 + Math.random() * 0.1,
                });
            }
        });
        return list;
    }, []);

    useFrame((_, delta) => {
        const group = orbitGroup.current;
        if (group) {
            const targetX = pointer.current.y * 0.15;
            const targetY = pointer.current.x * 0.25;
            group.rotation.x += (targetX - group.rotation.x) * 0.06;
            group.rotation.y += (targetY - group.rotation.y) * 0.06;
        }

        const now = performance.now() / 1000;

        const packetMesh = packetsRef.current;
        if (packetMesh) {
            packets.forEach((packet, idx) => {
                const provider = providerPlanets.find(
                    (p) => p.id === packet.providerId,
                );
                if (!provider) return;
                packet.t += delta * packet.speed;
                if (packet.t > 1) packet.t -= 1;

                const angle =
                    provider.initialAngle +
                    now * provider.angularSpeed +
                    idx * 0.05;
                const orbitPos = new Vector3(
                    Math.cos(angle) * provider.radius,
                    Math.sin(angle * 0.6) * 0.3,
                    Math.sin(angle) * provider.radius,
                );
                const pos = orbitPos.clone().multiplyScalar(1 - packet.t * 0.6);
                tmp.position.copy(pos);
                tmp.scale.setScalar(0.05);
                tmp.updateMatrix();
                packetMesh.setMatrixAt(idx, tmp.matrix);
            });
            packetMesh.instanceMatrix.needsUpdate = true;
        }
    });

    const handlePointerMove = (event: { uv?: { x: number; y: number } }) => {
        if (!event.uv) return;
        const x = event.uv.x * 2 - 1;
        const y = event.uv.y * 2 - 1;
        pointer.current.set(clamp(x, -1, 1), clamp(y, -1, 1));
    };

    return (
        <>
            <color attach="background" args={["#020617"]} />
            <ambientLight intensity={0.55} color={new Color("#f8fbff")} />
            <pointLight
                position={[3, 3, 2]}
                intensity={1.1}
                color={accentColor}
            />
            <pointLight
                position={[-3, -2, -2]}
                intensity={0.6}
                color="#7dd3fc"
            />

            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[starPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.05}
                    color="#cbd5ff"
                    transparent
                    opacity={0.35}
                    depthWrite={false}
                />
            </points>

            <group
                ref={orbitGroup}
                onPointerMove={handlePointerMove}
                onPointerOut={() => pointer.current.set(0, 0)}
            >
                <mesh>
                    <sphereGeometry args={[0.6, 48, 48]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
                <Html
                    position={[0, 0, 0]}
                    center
                    distanceFactor={6}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--foreground)",
                        textShadow: "0 2px 8px rgba(0,0,0,0.45)",
                        pointerEvents: "none",
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "34px",
                            height: "34px",
                            borderRadius: "9999px",
                            background:
                                "radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(124,58,237,0.15) 60%, transparent 100%)",
                            color: accentColor,
                            boxShadow: `0 0 18px ${accentColor}55`,
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        >
                            <rect
                                x="4"
                                y="6"
                                width="16"
                                height="12"
                                rx="2.2"
                                stroke="currentColor"
                                fill="currentColor"
                                fillOpacity="0.12"
                            />
                            <path
                                d="M4.5 7.5 12 12l7.5-4.5"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>
                        Gmail
                    </span>
                </Html>

                {providerPlanets.map((provider) => {
                    const angle =
                        provider.initialAngle +
                        (performance.now() / 1000) * provider.angularSpeed;
                    const x = Math.cos(angle) * provider.radius;
                    const z = Math.sin(angle) * provider.radius;
                    const y = Math.sin(angle * 0.6) * 0.3;
                    const pos = new Vector3(x, y, z);

                    const isHovered = hoveredId === provider.id;
                    const ringColor = isHovered
                        ? provider.color
                        : "rgba(255,255,255,0.12)";

                    return (
                        <group
                            key={provider.id}
                            position={[0, 0, 0]}
                            onPointerOver={() => setHoveredId(provider.id)}
                            onPointerOut={() =>
                                setHoveredId((prev) =>
                                    prev === provider.id ? null : prev,
                                )
                            }
                            onClick={() => {
                                // TODO: handle provider node click
                            }}
                        >
                            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry
                                    args={[
                                        provider.radius - 0.02,
                                        provider.radius + 0.02,
                                        96,
                                    ]}
                                />
                                <meshBasicMaterial
                                    color={ringColor}
                                    transparent
                                    opacity={isHovered ? 0.5 : 0.18}
                                />
                            </mesh>

                            <Html
                                position={pos
                                    .clone()
                                    .add(
                                        new Vector3(0, provider.size + 0.14, 0),
                                    )}
                                center
                                distanceFactor={6}
                                style={{
                                    color: "var(--foreground)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    opacity: isHovered ? 1 : 0.6,
                                    transition: "opacity 0.2s ease",
                                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "4px",
                                    pointerEvents: "none",
                                    transform: isHovered
                                        ? "scale(1.08)"
                                        : "scale(1)",
                                    transformOrigin: "center",
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "9999px",
                                        background: "rgba(255,255,255,0.06)",
                                        color: provider.color,
                                        boxShadow: isHovered
                                            ? `0 0 12px ${provider.color}66`
                                            : "none",
                                    }}
                                >
                                    {provider.icon}
                                </span>
                                <span>{provider.label}</span>
                            </Html>
                        </group>
                    );
                })}

                <instancedMesh
                    ref={packetsRef}
                    args={[
                        undefined as never,
                        undefined as never,
                        packets.length,
                    ]}
                >
                    <sphereGeometry args={[0.07, 10, 10]} />
                    <meshStandardMaterial
                        color="#a5b4fc"
                        emissive="#a5b4fc"
                        emissiveIntensity={0.6}
                        roughness={0.3}
                        metalness={0.2}
                    />
                </instancedMesh>
            </group>

            <OrbitControls enableZoom={false} enablePan={false} />
        </>
    );
};

export function ProviderSolarSystemScene({
    accentColor = "var(--accent)",
    height = "100%",
}: ProviderSolarSystemSceneProps) {
    return (
        <Canvas
            style={{ width: "100%", height }}
            camera={{ position: [0, 0, 5], fov: 50 }}
        >
            <SceneContents accentColor={accentColor} />
        </Canvas>
    );
}

export default ProviderSolarSystemScene;
