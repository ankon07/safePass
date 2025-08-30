"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// This component represents a single, interactive floating shape
function Shape() {
  const meshRef = useRef<THREE.Mesh>(null!);

  // A ref to store the shape's current velocity for smooth movement
  const velocity = useRef(new THREE.Vector3(0, 0, 0));

  // === SPEED CONTROL PARAMETERS ===
  // Adjust these values to control animation speeds
  const ROTATION_SPEED = 0.002; // Base rotation speed (0.001 = very slow, 0.01 = fast)
  const ROTATION_VARIATION = 0.8; // Random variation multiplier (0-1, higher = more variation)
  const MOVEMENT_SPEED_MULTIPLIER = 1.2; // Overall movement speed (1.0 = normal, 2.0 = double speed)
  const REPULSION_FORCE_MULTIPLIER = 3.0; // Mouse repulsion strength
  const RETURN_FORCE_BASE = 0.003; // Base return-to-home force
  const RETURN_FORCE_RANGE = 0.012; // Additional return force when mouse is far
  const VELOCITY_DAMPING = 0.86; // Movement friction (0.8 = less friction/faster, 0.95 = more friction/slower)

  // Store the initial "home" position and a random rotation factor
  const initialPosition = useMemo(
    () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ),
    []
  );
  const randomFactor = useMemo(() => 0.5 + Math.random() * 0.5, []);

  // Per-shape speed multipliers for variation
  const rotationSpeedMultiplier = useMemo(
    () => 1.0 + (Math.random() - 0.5) * ROTATION_VARIATION,
    []
  );
  const movementSpeedMultiplier = useMemo(
    () => 1.0 + (Math.random() - 0.5) * 0.3,
    [] // ±15% variation in movement speed
  );

  // Colors for boundary status indication
  const normalColor = useMemo(() => new THREE.Color("#85aa9b"), []); // Sage Green
  const warningColor = useMemo(() => new THREE.Color("#ff6b35"), []); // Orange-Red
  const currentColor = useRef(normalColor.clone());

  // This hook runs on every single animation frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      // --- 1. Get Mouse and Shape Positions ---
      const meshPosition = meshRef.current.position;

      // Convert normalized mouse coordinates to world coordinates
      // Expand scene bounds to cover full hero section
      const sceneWidth = 16; // Expanded for full hero section coverage
      const sceneHeight = 12; // Expanded for full hero section coverage
      const mousePosition3D = new THREE.Vector3(
        state.pointer.x * sceneWidth * 0.8, // Allow movement across full hero section
        state.pointer.y * sceneHeight * 0.8,
        meshPosition.z // Use the same Z position as the shape
      );

      // --- 2. Calculate Repulsion from Mouse ---
      const repulsionForce = new THREE.Vector3();
      const distanceToMouse = meshPosition.distanceTo(mousePosition3D);
      const repulsionRadius = 4.5; // Increased radius for hero section coverage

      if (distanceToMouse < repulsionRadius) {
        // Calculate a vector pointing away from the mouse
        repulsionForce.subVectors(meshPosition, mousePosition3D).normalize();
        // The force is stronger the closer the mouse is
        const strength = (repulsionRadius - distanceToMouse) / repulsionRadius;
        // Apply configurable repulsion force with per-shape variation
        repulsionForce.multiplyScalar(
          strength * REPULSION_FORCE_MULTIPLIER * movementSpeedMultiplier
        );

        // Add a minimum force to ensure movement even at the edge of the radius
        if (strength > 0) {
          repulsionForce.multiplyScalar(Math.max(strength, 0.4));
        }
      }

      // --- 3. Calculate Dynamic Return Home Force ---
      const returnForce = new THREE.Vector3();
      // Calculate a vector pointing from the current position back to the home position
      returnForce.subVectors(initialPosition, meshPosition);
      const distanceFromHome = returnForce.length();

      // Dynamic return force based on mouse proximity and distance from home
      // When mouse is close, reduce return force (allow free movement)
      // When mouse is far, increase return force (bring shapes back home)
      const mouseInfluence = Math.min(distanceToMouse / repulsionRadius, 1.0);
      const returnStrength =
        (RETURN_FORCE_BASE + mouseInfluence * RETURN_FORCE_RANGE) *
        MOVEMENT_SPEED_MULTIPLIER *
        movementSpeedMultiplier;
      returnForce.multiplyScalar(returnStrength);

      // --- 4. Soft Boundary System (No Hard Constraints) ---
      // Only apply gentle guidance when shapes are very far from home
      const boundaryForce = new THREE.Vector3();
      const softBoundaryDistance = 12; // Much larger boundary for hero section
      const warningDistance = 8; // Start showing visual warning at this distance

      // Only apply soft boundary force when mouse is not actively pushing
      if (
        distanceFromHome > softBoundaryDistance &&
        distanceToMouse > repulsionRadius
      ) {
        boundaryForce.subVectors(initialPosition, meshPosition).normalize();
        const excessDistance = distanceFromHome - softBoundaryDistance;
        boundaryForce.multiplyScalar(excessDistance * 0.05); // Gentle guidance back
      }

      // --- 5. Update Boundary Visual Status ---
      // Only show warning colors when shapes are far from home AND not being pushed
      let colorLerpFactor = 0;
      const isBeingPushed = distanceToMouse < repulsionRadius;

      if (distanceFromHome > warningDistance && !isBeingPushed) {
        // Gradually transition from normal to warning color
        colorLerpFactor = Math.min(
          (distanceFromHome - warningDistance) /
            (softBoundaryDistance - warningDistance),
          1.0
        );
      }

      // Smoothly interpolate between normal and warning colors
      currentColor.current.lerpColors(
        normalColor,
        warningColor,
        colorLerpFactor
      );

      // Update the material color
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.color.copy(currentColor.current);
      }

      // --- 6. Update Velocity ---
      // Add all forces to the current velocity
      velocity.current.add(repulsionForce);
      velocity.current.add(returnForce);
      velocity.current.add(boundaryForce);

      // --- 7. Apply Friction (Damping) ---
      // Use configurable damping for speed control
      velocity.current.multiplyScalar(VELOCITY_DAMPING);

      // --- 8. Update Position ---
      // Apply movement speed multiplier to final position update
      const scaledVelocity = velocity.current
        .clone()
        .multiplyScalar(MOVEMENT_SPEED_MULTIPLIER);
      meshPosition.add(scaledVelocity);

      // --- 9. Apply configurable rotation with per-shape variation ---
      const rotationIncrement =
        ROTATION_SPEED * rotationSpeedMultiplier * randomFactor;
      meshRef.current.rotation.x += rotationIncrement;
      meshRef.current.rotation.y += rotationIncrement;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={initialPosition}
      scale={[randomFactor, randomFactor, randomFactor]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#85aa9b" // Sage Green
        transparent
        opacity={0.6}
        roughness={0.5}
      />
    </mesh>
  );
}

// The main component that sets up the scene for full hero section coverage
export function AnimatedHeroBackground() {
  const shapes = useMemo(
    () => Array.from({ length: 50 }, (_, i) => <Shape key={i} />),
    []
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 90 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1, // Put behind other content instead of blocking pointer events
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {shapes}
    </Canvas>
  );
}
