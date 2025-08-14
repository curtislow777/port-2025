import * as THREE from 'three';

const PARTICLE_COUNT = 1000; // The max number of particles in the pool
const PARTICLE_LIFETIME = 1.0; // How long a particle lives, in seconds
const PARTICLE_BASE_SIZE = 0.1;

export default class ParticleTrail {
    constructor(scene) {
        this.scene = scene;
        this.particleCursor = 0; // The index of the next particle to be spawned

        // 1. GEOMETRY
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);

        // Custom attributes for animation, stored on the GPU
        const lifetimes = new Float32Array(PARTICLE_COUNT);
        const initialSizes = new Float32Array(PARTICLE_COUNT);

        // Initialize all particles as "dead" (lifetime = 0)
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3 + 0] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            lifetimes[i] = 0.0;
            initialSizes[i] = PARTICLE_BASE_SIZE * (0.5 + Math.random() * 0.5);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('aInitialSize', new THREE.BufferAttribute(initialSizes, 1));

        this.geometry = geometry;

        // 2. MATERIAL (with custom shader)
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: PARTICLE_BASE_SIZE,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false, // Important for blending
        });

        // This function injects code into Three.js's built-in shaders
        material.onBeforeCompile = (shader) => {
            // Add custom uniforms and attributes to the top of the shader
            shader.vertexShader = `
        attribute float aLifetime;
        attribute float aInitialSize;
        varying float vLifetime;
        ${shader.vertexShader}
      `;
            shader.fragmentShader = `
        varying float vLifetime;
        ${shader.fragmentShader}
      `;

            // Animate size in the vertex shader
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
        #include <begin_vertex>
        vLifetime = aLifetime;
        float size = aInitialSize * (aLifetime / ${PARTICLE_LIFETIME.toFixed(2)});
        gl_PointSize = size;
        `
            );

            // Animate opacity in the fragment shader
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
        #include <color_fragment>
        float progress = vLifetime / ${PARTICLE_LIFETIME.toFixed(2)};
        diffuseColor.a *= smoothstep(0.0, 0.2, progress) * (1.0 - smoothstep(0.5, 1.0, progress));
        `
            );
        };

        // 3. POINTS OBJECT
        this.points = new THREE.Points(geometry, material);
        this.scene.add(this.points);
    }

    /**
     * Spawns a particle at a given 3D position.
     * @param {THREE.Vector3} position - The world position to spawn the particle.
     */
    spawnParticle(position) {
        const i = this.particleCursor;

        this.geometry.attributes.position.setXYZ(i, position.x, position.y, position.z);
        this.geometry.attributes.aLifetime.setX(i, PARTICLE_LIFETIME);

        // Mark attributes for update
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.aLifetime.needsUpdate = true;

        // Advance the cursor, wrapping around if it reaches the end
        this.particleCursor = (i + 1) % PARTICLE_COUNT;
    }

    /**
     * Call this every frame in your render loop.
     * @param {number} deltaTime - The time since the last frame, in seconds.
     */
    update(deltaTime) {
        const lifetimes = this.geometry.attributes.aLifetime;
        let needsUpdate = false;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            if (lifetimes.getX(i) > 0) {
                lifetimes.setX(i, lifetimes.getX(i) - deltaTime);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            lifetimes.needsUpdate = true;
        }
    }
}