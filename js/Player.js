import * as THREE from 'three';

export class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.robotSize = 300; // Default size, will be updated in init based on window size
        this.radius = 45; // Default radius, will be updated in init
        this.speed = 200; // Acceleration force when keys are pressed
        this.velocity = { x: 0, y: 0 };
        this.drag = 0.98; // Increased from 0.95 to reduce friction in space
        this.defaultDrag = 0.98; // Store default drag for reset
        this.maxSpeed = 300; // Maximum speed limit
        this.isMoving = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Modified particle mechanics
        this.particles = 1; // Start with 1 particle
        this.blackHoleTimer = 0;
        this.isTrapped = false;
        this.lastParticleLossTime = 0;
        this.particleLossInterval = 2; // 2 seconds between particle loss
        this.lastMovementTime = Date.now(); // Track last movement time
        this.escapeBoostActive = false;
        this.escapeBoostDuration = 0;

        // Speed boost properties
        this.speedBoostActive = false;
        this.lastSpeedBoostCostTime = 0;
        this.speedBoostCostInterval = 1; // 1 second interval for consuming particles

        // 3D model properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.robot = null; // Robot model (renamed from astronaut)
        this.jetpack = null;
        this.jetpackFlame = null;
        this.clock = new THREE.Clock();
        this.mixer = null; // Animation mixer
        
        // Default colors (will be updated by settings if available)
        this.colors = {
            bodyColor: 0x0077ff, // Vibrant Blue
            helmetColor: 0xffd700 // Gold
        };
        
        // Store materials for color updates
        this.bodyMaterial = null;
        this.helmetMaterial = null;
        
        // Glow effect properties
        this.glowIntensity = 0; // Current glow intensity
        this.maxGlowIntensity = 3; // Maximum glow intensity
        this.glowDecayRate = 0.5; // How quickly glow fades per second
        this.glowColor = new THREE.Color(0x00ffff); // Cyan color for glow
        this.lastParticleValue = 1; // Track the score of the last collected particle

        // Universe rotation properties
        this.affectedByRotation = true; // By default, player is affected by universe rotation
        this.rotationVelocity = { x: 0, y: 0 }; // Store rotation-induced velocity separately
        
        // Movement orientation properties
        this.lastMovementAngle = 0; // Track the last movement direction
        this.rotationResponseFactor = 0.05; // How fast the robot rotates to face movement direction
        this.tiltFactor = 0.2; // Maximum tilt angle when moving (in radians)
    }
    
    init(sceneManager) {
        this.sceneManager = sceneManager;
        // Position the robot on the far left side of the screen with a small padding
        const leftPadding = 50; // Small padding from the left edge
        this.x = leftPadding + this.radius; // Add radius to ensure robot is fully visible
        this.y = sceneManager.centerY; // Place at vertical center
        
        // Calculate robot size based on 25% of the maximum dimension
        const maxDimension = Math.max(sceneManager.width, sceneManager.height);
        this.robotSizeRatio = 0.25; // Set to 25% of max dimension
        this.robotSize = Math.round(maxDimension * this.robotSizeRatio);
        
        // Scale collision radius proportionally, but larger to match visual size
        this.radius = this.robotSize / 3; // Maintain the /3 ratio to ensure head collects particles
        
        // Initialize 3D rendering
        this.setup3DScene();
        
        // Listen for color change events from settings
        window.addEventListener('playerColorChange', (event) => {
            this.updateColors(event.detail);
        });
        
        // Listen for game resize events to update robot size
        window.addEventListener('gameResize', () => {
            this.updateRobotSize();
        });
        
        // Listen for particle collection events to trigger glow effect
        window.addEventListener('particleCollected', (event) => {
            this.onParticleCollected(event.detail);
        });
    }
    
    updateRobotSize() {
        const maxDimension = Math.max(this.sceneManager.width, this.sceneManager.height);
        this.robotSize = Math.round(maxDimension * this.robotSizeRatio);
        this.radius = this.robotSize / 3; // Increased from /9 to /3 to match visual size
    }
    
    updateColors(colorScheme) {
        if (!this.bodyMaterial || !this.helmetMaterial) return;
        
        this.colors = {
            bodyColor: colorScheme.bodyColor,
            helmetColor: colorScheme.helmetColor
        };
        
        // Update material colors
        this.bodyMaterial.color.setHex(this.colors.bodyColor);
        this.helmetMaterial.color.setHex(this.colors.helmetColor);
    }
    
    setup3DScene() {
        // Create a separate scene for the 3D robot
        this.scene = new THREE.Scene();
        
        // Create a camera for the 3D scene
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            1, // Aspect ratio (will be updated in draw method)
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.z = 7.5; // Increased camera distance for larger model
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, // Transparent background
            antialias: true 
        });
        this.renderer.setSize(this.robotSize, this.robotSize); // Use dynamic size
        
        // Create robot model
        this.createRobotModel();
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    
    createRobotModel() {
        // Create robot body using basic shapes
        // In a real game, you'd load a proper 3D model
        
        // Create robot group
        this.robot = new THREE.Group();
        
        // Create robot head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Keep geometry simple
        // Use MeshStandardMaterial for better PBR rendering
        this.helmetMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.helmetColor,
            metalness: 0.9, // More metallic
            roughness: 0.1, // Smoother, shinier surface
            envMapIntensity: 1.5 // Enhance reflections if env map is present
        });
        const head = new THREE.Mesh(headGeometry, this.helmetMaterial);
        head.position.y = 0.9;
        this.robot.add(head);
        
        // Create robot eyes - make them larger and brighter
        const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Slightly larger eyes
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff, // Cyan glowing eyes
            emissive: 0x00ffff, // Make them glow
            emissiveIntensity: 1.5, // Brighter glow
            metalness: 0.1,
            roughness: 0.3
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.15, 0.95, 0.26); // Adjust z slightly forward
        this.robot.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.15, 0.95, 0.26); // Adjust z slightly forward
        this.robot.add(rightEye);
        
        // Store eye materials for glow effects
        this.eyeMaterial = eyeMaterial;
        
        // Create antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({ // Use Standard Material
            color: 0xaaaaaa, // Lighter grey
            metalness: 0.9,
            roughness: 0.2
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, 1.25, 0);
        this.robot.add(antenna);
        
        // Create antenna tip - make it glow brighter
        const antennaTipGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Slightly larger tip
        const antennaTipMaterial = new THREE.MeshStandardMaterial({ // Use Standard Material
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 2.0, // Much brighter glow
            metalness: 0.2,
            roughness: 0.5
        });
        const antennaTip = new THREE.Mesh(antennaTipGeometry, antennaTipMaterial);
        antennaTip.position.set(0, 1.35, 0);
        this.robot.add(antennaTip);
        
        // Create robot body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        // Use MeshStandardMaterial for body
        this.bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.bodyColor,
            metalness: 0.7, // Metallic look
            roughness: 0.3, // Moderately smooth
            envMapIntensity: 1.2
        });
        const body = new THREE.Mesh(bodyGeometry, this.bodyMaterial);
        body.position.y = 0.3;
        this.robot.add(body);
        
        // Add a glow sphere around the robot
        const glowGeometry = new THREE.SphereGeometry(1.0, 32, 32); // Slightly smaller default size
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.0, // Start invisible
            blending: THREE.AdditiveBlending, 
            depthWrite: false, // Prevent depth writing for better glow effect
            side: THREE.FrontSide // Only render front side for better performance
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.robot.add(this.glowMesh);
        
        // Create chest panel - make it darker and slightly reflective
        const panelGeometry = new THREE.PlaneGeometry(0.4, 0.3);
        const panelMaterial = new THREE.MeshStandardMaterial({ // Use Standard Material
            color: 0x222222, // Darker panel
            metalness: 0.5,
            roughness: 0.4,
            side: THREE.DoubleSide // Ensure it's visible
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, 0.4, 0.21); // Keep position
        this.robot.add(panel);
        
        // Add indicator lights to panel - use emissive materials
        const lightGeometry = new THREE.CircleGeometry(0.05, 16); // Smoother circles
        const greenLightMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 });
        const redLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
        const blueLightMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1 });
        
        const light1 = new THREE.Mesh(lightGeometry, greenLightMaterial);
        light1.position.set(0.1, 0.45, 0.22); // Slightly forward
        this.robot.add(light1);
        
        const light2 = new THREE.Mesh(lightGeometry, redLightMaterial);
        light2.position.set(0, 0.45, 0.22); // Slightly forward
        this.robot.add(light2);
        
        const light3 = new THREE.Mesh(lightGeometry, blueLightMaterial);
        light3.position.set(-0.1, 0.45, 0.22); // Slightly forward
        this.robot.add(light3);
        
        // Create robot arms - use body material
        const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        
        const leftArm = new THREE.Mesh(armGeometry, this.bodyMaterial);
        leftArm.position.set(0.38, 0.3, 0);
        this.robot.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, this.bodyMaterial);
        rightArm.position.set(-0.38, 0.3, 0);
        this.robot.add(rightArm);
        
        // Create robot hands - use helmet material
        const handGeometry = new THREE.SphereGeometry(0.12, 16, 16); // Smoother spheres
        
        const leftHand = new THREE.Mesh(handGeometry, this.helmetMaterial);
        leftHand.position.set(0.38, 0, 0);
        this.robot.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeometry, this.helmetMaterial);
        rightHand.position.set(-0.38, 0, 0);
        this.robot.add(rightHand);
        
        // Create robot legs - use body material
        const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        
        const leftLeg = new THREE.Mesh(legGeometry, this.bodyMaterial);
        leftLeg.position.set(0.2, -0.4, 0);
        this.robot.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, this.bodyMaterial);
        rightLeg.position.set(-0.2, -0.4, 0);
        this.robot.add(rightLeg);
        
        // Create robot feet - use helmet material
        const footGeometry = new THREE.BoxGeometry(0.25, 0.1, 0.35);
        
        const leftFoot = new THREE.Mesh(footGeometry, this.helmetMaterial);
        leftFoot.position.set(0.2, -0.75, 0.05);
        this.robot.add(leftFoot);
        
        const rightFoot = new THREE.Mesh(footGeometry, this.helmetMaterial);
        rightFoot.position.set(-0.2, -0.75, 0.05);
        this.robot.add(rightFoot);
        
        // Create jetpack
        this.createJetpack();
        
        // Add robot to scene
        this.scene.add(this.robot);
    }
    
    createJetpack() {
        // Create jetpack
        this.jetpack = new THREE.Group();
        
        // Jetpack main body
        const jetpackGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.3);
        // Use Standard Material for jetpack
        const jetpackMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344, // Dark metallic blue/grey
            metalness: 0.8,
            roughness: 0.3,
            envMapIntensity: 1.0
        });
        const jetpackBody = new THREE.Mesh(jetpackGeometry, jetpackMaterial);
        this.jetpack.add(jetpackBody);
        
        // Jetpack thrusters (main vertical thrusters)
        const thrusterGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 16); // Smoother cylinder
        // Use Standard Material for thrusters
        const thrusterMaterial = new THREE.MeshStandardMaterial({
            color: 0x888899, // Lighter metallic blue/grey
            metalness: 0.9,
            roughness: 0.2
        });
        
        const leftThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        leftThruster.position.set(0.2, -0.3, 0);
        this.jetpack.add(leftThruster);
        
        const rightThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        rightThruster.position.set(-0.2, -0.3, 0);
        this.jetpack.add(rightThruster);
        
        // Add maneuvering thrusters for realistic space movement
        const smallThrusterGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.2, 8);
        
        // Left side horizontal thruster
        const leftSideThruster = new THREE.Mesh(smallThrusterGeometry, thrusterMaterial);
        leftSideThruster.rotation.z = Math.PI/2; // Point horizontally
        leftSideThruster.position.set(0.4, 0, 0);
        this.jetpack.add(leftSideThruster);
        
        // Right side horizontal thruster
        const rightSideThruster = new THREE.Mesh(smallThrusterGeometry, thrusterMaterial);
        rightSideThruster.rotation.z = -Math.PI/2; // Point horizontally
        rightSideThruster.position.set(-0.4, 0, 0);
        this.jetpack.add(rightSideThruster);
        
        // Forward thruster (for backward movement)
        const frontThruster = new THREE.Mesh(smallThrusterGeometry, thrusterMaterial);
        frontThruster.rotation.x = Math.PI/2; // Point forward
        frontThruster.position.set(0, 0, 0.2);
        this.jetpack.add(frontThruster);
        
        // Jetpack flames groups for directional thrusters
        this.jetpackFlame = new THREE.Group();
        
        // Create flame geometry
        const flameGeometry = new THREE.ConeGeometry(0.1, 0.4, 16); // Smoother cone
        // Use MeshBasicMaterial for flames as they don't need lighting
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00, // Brighter orange base color
            transparent: true,
            opacity: 0.85, // Slightly less transparent
            blending: THREE.AdditiveBlending // Makes flames brighter when overlapping
        });
        
        // Main vertical flames
        const leftFlame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
        leftFlame.position.set(0.2, -0.5, 0);
        leftFlame.rotation.x = Math.PI;
        leftFlame.name = "mainLeft";
        this.jetpackFlame.add(leftFlame);
        
        const rightFlame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
        rightFlame.position.set(-0.2, -0.5, 0);
        rightFlame.rotation.x = Math.PI;
        rightFlame.name = "mainRight";
        this.jetpackFlame.add(rightFlame);
        
        // Create maneuvering flames with smaller size
        const smallFlameGeometry = new THREE.ConeGeometry(0.06, 0.25, 8);
        
        // Left side flame (for rightward movement)
        const leftSideFlame = new THREE.Mesh(smallFlameGeometry, flameMaterial.clone());
        leftSideFlame.position.set(0.5, 0, 0);
        leftSideFlame.rotation.z = -Math.PI/2;
        leftSideFlame.name = "sideLeft";
        leftSideFlame.visible = false; // Only show when needed
        this.jetpackFlame.add(leftSideFlame);
        
        // Right side flame (for leftward movement)
        const rightSideFlame = new THREE.Mesh(smallFlameGeometry, flameMaterial.clone());
        rightSideFlame.position.set(-0.5, 0, 0);
        rightSideFlame.rotation.z = Math.PI/2;
        rightSideFlame.name = "sideRight";
        rightSideFlame.visible = false; // Only show when needed
        this.jetpackFlame.add(rightSideFlame);
        
        // Forward flame (for backward movement)
        const forwardFlame = new THREE.Mesh(smallFlameGeometry, flameMaterial.clone());
        forwardFlame.position.set(0, 0, 0.3);
        forwardFlame.rotation.x = -Math.PI/2;
        forwardFlame.name = "forward";
        forwardFlame.visible = false; // Only show when needed
        this.jetpackFlame.add(forwardFlame);
        
        // Initially hide all flames
        this.jetpackFlame.visible = false;
        
        // Add flames to jetpack
        this.jetpack.add(this.jetpackFlame);
        
        // Position jetpack on astronaut's back
        this.jetpack.position.z = -0.4;
        
        // Add jetpack to robot
        this.robot.add(this.jetpack);
    }
    
    update(deltaTime, blackHole) {
        // Update escape boost
        if (this.escapeBoostActive) {
            this.escapeBoostDuration -= deltaTime;
            if (this.escapeBoostDuration <= 0) {
                this.escapeBoostActive = false;
                if (this.jetpackFlame) {
                    this.jetpackFlame.scale.set(1, 1, 1);
                }
            }
        }
        
        // Update glow effect (decay over time)
        if (this.glowIntensity > 0) {
            this.glowIntensity = Math.max(0, this.glowIntensity - (deltaTime * this.glowDecayRate));
            this.updateGlowEffect();
        }
        
        // Handle speed boost and score consumption
        if (this.speedBoostActive) {
            const currentTime = Date.now();
            if (currentTime - this.lastSpeedBoostCostTime >= this.speedBoostCostInterval * 1000) {
                // Emit an event to reduce score instead of consuming particles
                const event = new CustomEvent('speedBoostUsed', {
                    detail: { cost: 1 }
                });
                window.dispatchEvent(event);
                
                this.lastSpeedBoostCostTime = currentTime;
            }
        }

        // Determine if player is actively moving with jetpack
        const isUsingJetpack = this.isMoving.up || this.isMoving.down || 
                              this.isMoving.left || this.isMoving.right;
        
        // Update whether player is affected by universe rotation
        this.affectedByRotation = !isUsingJetpack && !this.escapeBoostActive;
        
        // Apply player input as acceleration
        const acceleration = { x: 0, y: 0 };
        
        // Calculate current speed based on speed boost status
        let currentSpeed = this.speedBoostActive ? this.speed * 3 : this.speed;
        
        if (this.isMoving.up) acceleration.y -= currentSpeed;
        if (this.isMoving.down) acceleration.y += currentSpeed;
        if (this.isMoving.left) acceleration.x -= currentSpeed;
        if (this.isMoving.right) acceleration.x += currentSpeed;
        
        // Apply acceleration to velocity
        this.velocity.x += acceleration.x * deltaTime;
        this.velocity.y += acceleration.y * deltaTime;
        
        // Calculate rotation effect
        if (this.affectedByRotation) {
            // Calculate the rotation center-relative position
            const relX = this.x - this.sceneManager.centerX;
            const relY = this.y - this.sceneManager.centerY;
            
            // Calculate rotation-induced velocity
            const rotationSpeed = this.sceneManager.universeRotationSpeed;
            this.rotationVelocity.x = -relY * rotationSpeed;
            this.rotationVelocity.y = relX * rotationSpeed;
            
            // Apply rotation velocity (scaled by distance from center)
            const distance = Math.sqrt(relX * relX + relY * relY);
            const rotationFactor = distance * rotationSpeed;
            
            // Apply rotation to velocity
            this.velocity.x += this.rotationVelocity.x * 60 * deltaTime;
            this.velocity.y += this.rotationVelocity.y * 60 * deltaTime;
        } else {
            // When actively using jetpack, gradually reduce rotation velocity
            this.rotationVelocity.x *= 0.9;
            this.rotationVelocity.y *= 0.9;
        }
        
        // Apply black hole gravity if available
        if (blackHole) {
            const gravityEffect = blackHole.applyGravity(this, deltaTime);
            
            // Add gravity effect to velocity
            this.velocity.x += gravityEffect.x;
            this.velocity.y += gravityEffect.y;
            
            // Calculate distance to black hole for visual effects
            const dx = blackHole.x - this.x;
            const dy = blackHole.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if player is within event horizon
            if (distance < blackHole.eventHorizonRadius) {
                if (!this.isTrapped) {
                    this.isTrapped = true;
                    this.blackHoleTimer = 0;
                    // Dispatch event when player becomes trapped
                    window.dispatchEvent(new CustomEvent('playerTrapped'));
                }
                
                // If not moving, increase timer
                if (!isUsingJetpack) {
                    this.blackHoleTimer += deltaTime;
                } else {
                    this.blackHoleTimer = 0;
                    this.lastMovementTime = Date.now();
                }

                // Check for particle loss
                const currentTime = Date.now();
                if (this.blackHoleTimer >= 5 && 
                    currentTime - this.lastParticleLossTime >= this.particleLossInterval * 1000) {
                    this.particles = Math.max(0, this.particles - 1);
                    this.lastParticleLossTime = currentTime;
                    
                    // Trigger game over if no particles left
                    if (this.particles <= 0) {
                        window.dispatchEvent(new CustomEvent('playerDestroyed'));
                        // Pull player towards black hole center
                        const pullAngle = Math.atan2(dy, dx);
                        const pullStrength = blackHole.pullStrength * 2;
                        this.velocity.x = Math.cos(pullAngle) * pullStrength;
                        this.velocity.y = Math.sin(pullAngle) * pullStrength;
                        return; // Stop further updates
                    }
                }
                
                // Check if player gets too close to the event horizon center
                const criticalDistance = blackHole.radius * 1.2;
                if (distance < criticalDistance) {
                    // Trigger immediate game over when too close to center
                    window.dispatchEvent(new CustomEvent('playerDestroyed'));
                    return; // Stop further updates
                }
            } else {
                if (this.isTrapped) {
                    this.isTrapped = false;
                    // Dispatch event when player is no longer trapped (without using escape boost)
                    window.dispatchEvent(new CustomEvent('playerEscaped'));
                }
                this.blackHoleTimer = 0;
            }
            
            // Apply visual distortion when near event horizon
            if (distance < blackHole.eventHorizonRadius * 1.5) {
                const distortionIntensity = 1 - (distance / (blackHole.eventHorizonRadius * 1.5));
                // Stretch the model towards the black hole
                const angle = Math.atan2(dy, dx);
                this.robot.scale.x = 1 + distortionIntensity * Math.abs(Math.cos(angle)) * 0.7;
                this.robot.scale.y = 1 + distortionIntensity * Math.abs(Math.sin(angle)) * 0.7;
                
                // Add wobble effect
                const wobble = Math.sin(Date.now() * 0.01) * distortionIntensity * 0.2;
                this.robot.rotation.z += wobble;
            } else {
                // Reset scale when outside event horizon influence
                this.robot.scale.set(1, 1, 1);
            }
            
            // Reduce drag when close to black hole to make gravity more dominant
            const baseDrag = this.defaultDrag;
            const distanceEffect = Math.min(1, distance / (blackHole.glowRadius * 2));
            this.drag = baseDrag * (0.95 + (distanceEffect * 0.05));
            
            // Reset drag to default when far from black hole
            const farDistance = blackHole.glowRadius * 3;
            if (distance > farDistance) {
                this.drag = this.defaultDrag;
            }
        } else {
            // If no blackhole, ensure drag is at default value
            this.drag = this.defaultDrag;
        }
        
        // Apply drag (friction)
        this.velocity.x *= this.drag;
        this.velocity.y *= this.drag;
        
        // Cap maximum speed - 3x during speed boost
        currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const maxSpeedLimit = this.speedBoostActive ? this.maxSpeed * 3 : this.maxSpeed;
        
        if (currentSpeed > maxSpeedLimit) {
            const scale = maxSpeedLimit / currentSpeed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
        }
        
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Keep player within bounds
        this.constrainToBounds();
        
        // Update 3D model
        this.update3DModel();
        
        // Draw player
        this.draw();
    }
    
    update3DModel() {
        // Check if any direction key is pressed
        const isUsingJetpack = this.isMoving.up || this.isMoving.down || 
                           this.isMoving.left || this.isMoving.right;
        
        // Set overall visibility of jetpack flames - now includes speed boost
        this.jetpackFlame.visible = isUsingJetpack || this.speedBoostActive;
        
        // Find the main thruster flames
        const mainLeftFlame = this.jetpackFlame.children.find(child => child.name === "mainLeft");
        const mainRightFlame = this.jetpackFlame.children.find(child => child.name === "mainRight");
        const leftSideFlame = this.jetpackFlame.children.find(child => child.name === "sideLeft");
        const rightSideFlame = this.jetpackFlame.children.find(child => child.name === "sideRight");
        const forwardFlame = this.jetpackFlame.children.find(child => child.name === "forward");
        
        if (this.speedBoostActive && !isUsingJetpack) {
            // When speed boost is active without directional movement, show all flames
            if (mainLeftFlame) mainLeftFlame.visible = true;
            if (mainRightFlame) mainRightFlame.visible = true;
            if (leftSideFlame) leftSideFlame.visible = true;
            if (rightSideFlame) rightSideFlame.visible = true;
            if (forwardFlame) forwardFlame.visible = true;
        } else if (isUsingJetpack) {
            // Control individual flames based on movement direction
            
            // Main vertical thrusters are active when moving up
            if (mainLeftFlame) mainLeftFlame.visible = this.isMoving.up;
            if (mainRightFlame) mainRightFlame.visible = this.isMoving.up;
            
            // Side thrusters activate in opposite direction of movement
            if (leftSideFlame) leftSideFlame.visible = this.isMoving.right;  // Right movement activates left thruster
            if (rightSideFlame) rightSideFlame.visible = this.isMoving.left; // Left movement activates right thruster
            
            // Forward thruster activates when moving down (backward)
            if (forwardFlame) forwardFlame.visible = this.isMoving.down;
        }
        
        // Calculate movement vector magnitude
        const velocityMagnitude = Math.sqrt(
            this.velocity.x * this.velocity.x + 
            this.velocity.y * this.velocity.y
        );
        
        // Only rotate when there is significant movement
        if (velocityMagnitude > 10) {
            // Calculate the angle of movement - invert the x to fix left/right orientation
            const movementAngle = Math.atan2(this.velocity.y, -this.velocity.x);
            
            // Make robot's head point in the direction of movement
            // We set z rotation to match movement direction
            // In THREE.js, z rotation is the one used for 2D plane rotations
            const targetRotation = movementAngle + Math.PI/2; // Add 90° to align head with movement direction
            
            // Use quaternions for smoother 3D rotation
            const targetQuaternion = new THREE.Quaternion();
            targetQuaternion.setFromEuler(new THREE.Euler(0, 0, targetRotation));
            
            // Smoothly interpolate current rotation to target rotation
            this.robot.quaternion.slerp(targetQuaternion, 0.1); // Increased from 0.05 for faster response
            
            // Slightly tilt the robot in the direction of movement for visual effect
            const tiltAngle = 0.2; // Maximum tilt angle in radians
            const tiltDirection = Math.sin(movementAngle - this.robot.rotation.z);
            
            // Apply tilt along the appropriate axis
            this.robot.rotation.x = THREE.MathUtils.lerp(
                this.robot.rotation.x,
                tiltDirection * tiltAngle * (velocityMagnitude / this.maxSpeed),
                0.1
            );
        } else {
            // If not moving much, gradually return to default orientation
            // Default orientation: head upright facing forward (toward screen)
            const defaultQuaternion = new THREE.Quaternion();
            // Use a rotation that puts the robot facing forward (toward the screen/camera)
            defaultQuaternion.setFromEuler(new THREE.Euler(0, 0, 0));
            
            // Smoothly interpolate to the default orientation
            this.robot.quaternion.slerp(defaultQuaternion, 0.05);
            
            // Reset any tilt
            this.robot.rotation.x = THREE.MathUtils.lerp(
                this.robot.rotation.x, 
                0, 
                0.1
            );
        }
        
        // Only apply universe rotation if the robot is affected AND has significant velocity
        // This prevents the robot from spinning when stationary
        if (this.affectedByRotation && velocityMagnitude > 20) { // Increased threshold
            // Create a quaternion for the universe rotation
            const universeRotationQuat = new THREE.Quaternion();
            universeRotationQuat.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0), // Rotate around Y axis
                this.sceneManager.universeRotationAngle * 0.5 // Reduced effect
            );
            
            // Apply universe rotation to the robot's current orientation
            // This preserves any orientation from movement while adding universe spin
            this.robot.quaternion.premultiply(universeRotationQuat);
        } else if (velocityMagnitude < 5) {
            // When nearly stationary, actively stabilize the robot
            // Reset any residual universe rotation effects
            const stabilizationQuaternion = new THREE.Quaternion();
            stabilizationQuaternion.setFromEuler(new THREE.Euler(0, 0, 0));
            this.robot.quaternion.slerp(stabilizationQuaternion, 0.1);
        }
        
        // Enhance jetpack flames based on movement speed and direction
        if (this.jetpackFlame.visible) {
            // Calculate movement intensity (0 to 1)
            const velocityMagnitude = Math.sqrt(
                this.velocity.x * this.velocity.x + 
                this.velocity.y * this.velocity.y
            );
            
            // Boost flame effects when speed boost is active
            const boostMultiplier = this.speedBoostActive ? 1.8 : 1.0;
            const movementIntensity = Math.min(1, velocityMagnitude / this.maxSpeed);
            
            // Apply flame effects to each visible flame
            this.jetpackFlame.children.forEach(flame => {
                if (!flame.visible) return;
                
                // Calculate specific intensity based on direction
                let directionIntensity = movementIntensity;
                let lengthMultiplier = 1.0;
                
                // Adjust flame intensity based on specific direction
                if (flame.name === "mainLeft" || flame.name === "mainRight") {
                    // Vertical flames stronger when moving upward
                    directionIntensity = this.isMoving.up ? movementIntensity * 1.2 : 0.6;
                    lengthMultiplier = 1.5; // Longer vertical flames
                } else if (flame.name === "sideLeft") {
                    // Left thruster stronger when moving right
                    directionIntensity = this.isMoving.right ? movementIntensity * 1.2 : 0.7;
                    lengthMultiplier = 1.2;
                } else if (flame.name === "sideRight") {
                    // Right thruster stronger when moving left
                    directionIntensity = this.isMoving.left ? movementIntensity * 1.2 : 0.7;
                    lengthMultiplier = 1.2;
                } else if (flame.name === "forward") {
                    // Forward thruster stronger when moving down
                    directionIntensity = this.isMoving.down ? movementIntensity * 1.2 : 0.7;
                    lengthMultiplier = 1.3;
                }
                
                // Make flame size responsive to velocity with randomized pulsing
                const baseScale = (0.8 + (directionIntensity * 0.6)) * boostMultiplier;
                const pulseScale = baseScale + Math.sin((Date.now() + Math.random() * 500) * 0.01) * 0.2;
                
                // Scale flame with direction-specific length
                // Each flame has its own scale based on its orientation
                if (flame.name.includes("main")) {
                    // Main vertical flames
                    flame.scale.set(
                        pulseScale, 
                        pulseScale * (1.2 + directionIntensity * lengthMultiplier), 
                        pulseScale
                    );
                } else if (flame.name.includes("side")) {
                    // Side horizontal flames - x scale affects length
                    flame.scale.set(
                        pulseScale * (1.2 + directionIntensity * lengthMultiplier),
                        pulseScale,
                        pulseScale
                    );
                } else if (flame.name === "forward") {
                    // Forward flame - z scale affects length
                    flame.scale.set(
                        pulseScale,
                        pulseScale,
                        pulseScale * (1.2 + directionIntensity * lengthMultiplier)
                    );
                }
                
                // Dynamic flame color based on intensity
                const flameColors = [0xffaa00, 0xffcc66, 0xffff99]; // Brighter, more yellow/white range
                // More intense flames are more yellow/white
                const colorIndex = Math.min(2, Math.floor(directionIntensity * 3));
                
                // Randomly change colors with flickering effect
                if (Math.random() > 0.8) { // Flicker more often
                    const randomColor = flameColors[colorIndex];
                    if (flame.material) {
                        flame.material.color.setHex(randomColor);
                        // Add slight opacity variation for flicker
                        flame.material.opacity = 0.7 + Math.random() * 0.3; 
                    }
                } else {
                     if (flame.material) {
                        // Reset opacity slightly if not flickering color
                        flame.material.opacity = 0.8 + Math.random() * 0.15;
                     }
                }
            });
        }
    }
    
    draw() {
        // Limit the render rate for 3D robot to improve performance
        const now = performance.now();
        const renderInterval = this.speedBoostActive ? 20 : 33; // 50 or 30 FPS for 3D rendering
        
        // Only render 3D model at specified intervals
        if (!this.lastRenderTime || now - this.lastRenderTime >= renderInterval) {
            // Renderer optimization - preserve WebGL context
            if (!this.renderer.setPixelRatio) {
                this.renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
            }
            
            this.renderer.setSize(this.robotSize, this.robotSize, false); // false prevents DOM style updates
            this.renderer.render(this.scene, this.camera);
            this.lastRenderTime = now;
        }
        
        // Draw to the main canvas
        const ctx = this.sceneManager.ctx;
        
        // Draw the 3D robot from the WebGL renderer to the 2D canvas
        ctx.save();
        ctx.drawImage(
            this.renderer.domElement,
            this.x - this.robotSize / 2, // Center horizontally
            this.y - this.robotSize / 2, // Center vertically
            this.robotSize, this.robotSize // Dynamic size
        );
        ctx.restore();
        
        // For debugging: draw collision circle
        if (false) { // Set to true to see the collision boundary
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.stroke();
            ctx.closePath();
        }
    }
    
    constrainToBounds() {
        // Use a small margin to allow the robot to get closer to the edges
        // Allow the robot's visual edges to reach screen edges
        const margin = 5; // Small margin to prevent going completely off-screen
        
        // Only constrain to screen edges, not near the black hole center
        if (this.x < margin) {
            this.x = margin;
            this.velocity.x *= -0.5; // Bounce with energy loss
        } else if (this.x > this.sceneManager.width - margin) {
            this.x = this.sceneManager.width - margin;
            this.velocity.x *= -0.5;
        }
        
        if (this.y < margin) {
            this.y = margin;
            this.velocity.y *= -0.5;
        } else if (this.y > this.sceneManager.height - margin) {
            this.y = this.sceneManager.height - margin;
            this.velocity.y *= -0.5;
        }
    }
    
    handleKeydown(e) {
        switch(e.key) {
            case ' ': // Spacebar
                if (this.isTrapped) {
                    this.tryEscape();
                } else {
                    // Activate speed boost regardless of particles
                    this.speedBoostActive = true;
                }
                break;
            case 'ArrowUp':
            case 'w':
                this.isMoving.up = true;
                this.lastMovementTime = Date.now();
                break;
            case 'ArrowDown':
            case 's':
                this.isMoving.down = true;
                this.lastMovementTime = Date.now();
                break;
            case 'ArrowLeft':
            case 'a':
                this.isMoving.left = true;
                this.lastMovementTime = Date.now();
                break;
            case 'ArrowRight':
            case 'd':
                this.isMoving.right = true;
                this.lastMovementTime = Date.now();
                break;
        }
    }
    
    handleKeyup(e) {
        switch(e.key) {
            case ' ': // Spacebar
                this.speedBoostActive = false;
                break;
            case 'ArrowUp':
            case 'w':
                this.isMoving.up = false;
                break;
            case 'ArrowDown':
            case 's':
                this.isMoving.down = false;
                break;
            case 'ArrowLeft':
            case 'a':
                this.isMoving.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                this.isMoving.right = false;
                break;
        }
    }
    
    tryEscape() {
        if (this.isTrapped && this.particles >= 5) {
            // Subtract 5 exotic particles when escaping
            this.particles -= 5;
            this.isTrapped = false;
            this.escapeBoostActive = true;
            this.escapeBoostDuration = 1.0; // 1 second boost

            // Calculate escape vector away from black hole
            const dx = this.x - this.sceneManager.centerX;
            const dy = this.y - this.sceneManager.centerY;
            const angle = Math.atan2(dy, dx);
            
            // Apply huge escape boost
            const escapeSpeed = this.maxSpeed * 3;
            this.velocity.x = Math.cos(angle) * escapeSpeed;
            this.velocity.y = Math.sin(angle) * escapeSpeed;
            
            // Store this as the last movement angle for proper orientation
            this.lastMovementAngle = angle;
            
            // Immediately rotate robot to face the escape direction
            if (this.robot) {
                const escapeQuaternion = new THREE.Quaternion();
                // Point robot's head in the direction of movement (away from black hole)
                // Use -dx to be consistent with the fix in update3DModel
                const escapeAngle = Math.atan2(dy, -dx);
                escapeQuaternion.setFromEuler(new THREE.Euler(0, 0, escapeAngle + Math.PI/2));
                this.robot.quaternion.copy(escapeQuaternion);
            }

            // Show intense jetpack flames
            if (this.jetpackFlame) {
                // Make the flames appear more powerful and elongated for escape boost
                this.jetpackFlame.scale.set(4.0, 6.0, 4.0); // Emphasize length for directional thrust
            }
            
            // Reset drag immediately to default when escaping
            this.drag = this.defaultDrag;
            
            // Dispatch event for escape boost
            window.dispatchEvent(new CustomEvent('playerEscaped'));
            
            return true;
        }
        return false;
    }

    onParticleCollected(particleData) {
        // Increase glow intensity based on the particle's value
        // Quantum (8-12) > Rare (5-7) > Unstable (3-5) > Normal (1-3)
        const { type, value } = particleData;
        
        // Different types of particles give different glow intensity
        let glowBoost = 0;
        
        switch(type) {
            case 'quantum':
                glowBoost = 2.0; // Most powerful glow
                break;
            case 'rare':
                glowBoost = 1.5; // Strong glow
                break;
            case 'unstable':
                glowBoost = 1.0; // Medium glow
                break;
            case 'normal':
            default:
                glowBoost = 0.5; // Standard glow
                break;
        }
        
        // Add value-based boost (normalized to 0-1 range based on typical particle values 1-12)
        glowBoost += value / 12;
        
        // Add to current glow intensity, but cap at maximum
        this.glowIntensity = Math.min(this.maxGlowIntensity, this.glowIntensity + glowBoost);
        
        // Set glow color based on particle type
        switch(type) {
            case 'quantum':
                this.glowColor.set(0x00ddff); // Bright cyan
                break;
            case 'rare':
                this.glowColor.set(0xff00ff); // Magenta
                break;
            case 'unstable':
                this.glowColor.set(0xff7700); // Orange
                break;
            case 'normal':
            default:
                this.glowColor.set(0x00ffff); // Cyan
                break;
        }
    }
    
    updateGlowEffect() {
        // Only proceed if we have materials to update
        if (!this.bodyMaterial || !this.helmetMaterial || !this.eyeMaterial) return;
        
        // Skip if no glow active
        if (this.glowIntensity <= 0) {
            // Reset materials to default state
            this.bodyMaterial.emissive.set(0x000000);
            this.helmetMaterial.emissive.set(0x000000);
            this.eyeMaterial.emissiveIntensity = 1.5; // Reset to default
            
            // Hide the glow mesh
            if (this.glowMesh) {
                this.glowMesh.material.opacity = 0;
            }
            return;
        }
        
        // Apply glow to robot materials
        // Make the body subtly glow
        this.bodyMaterial.emissive.copy(this.glowColor);
        this.bodyMaterial.emissiveIntensity = this.glowIntensity * 0.3; // Subtle body glow
        
        // Make the helmet glow slightly more
        this.helmetMaterial.emissive.copy(this.glowColor);
        this.helmetMaterial.emissiveIntensity = this.glowIntensity * 0.4; // More noticeable helmet glow
        
        // Make the eyes glow much more intensely
        this.eyeMaterial.color.copy(this.glowColor); // Change eye color to match particle
        this.eyeMaterial.emissive.copy(this.glowColor);
        this.eyeMaterial.emissiveIntensity = 1.5 + (this.glowIntensity * 1.0); // Intense eye glow
        
        // Find indicator lights on robot's chest panel and make them more intense
        this.robot.children.forEach(child => {
            if (child.material && child.material.emissive) {
                // Only affect small elements (lights) but not the main body parts
                if (child.geometry && 
                    (child.geometry.type === 'CircleGeometry' || child.geometry.type === 'SphereGeometry') && 
                    child.geometry.parameters.radius < 0.1) {
                    // Enhance existing emissive properties
                    const baseIntensity = child.material.emissiveIntensity || 1.0;
                    child.material.emissiveIntensity = baseIntensity + (this.glowIntensity * 0.8);
                }
            }
        });
        
        // Update glow sphere
        if (this.glowMesh) {
            // Update glow color
            this.glowMesh.material.color.copy(this.glowColor);
            
            // Update opacity based on glow intensity
            this.glowMesh.material.opacity = this.glowIntensity * 0.3; // Keep it subtle
            
            // Add pulsing effect to the glow
            const pulseScale = 1.0 + (Math.sin(Date.now() * 0.003) * 0.2); // Slow gentle pulse
            this.glowMesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
    }
    
    checkCollision(object) {
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + object.radius;
    }
    
    reset() {
        console.log("Player reset called");
        
        // Position the robot on the far left side of the screen with a small padding
        const leftPadding = 50; // Small padding from the left edge
        this.x = leftPadding + this.radius; // Add radius to ensure robot is fully visible
        this.y = this.sceneManager.centerY; // Place at vertical center
        this.velocity = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };
        this.isMoving = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Reset exotic particle properties
        this.particles = 1;
        this.blackHoleTimer = 0;
        this.isTrapped = false;
        this.lastParticleLossTime = 0;
        
        // Reset the drag to default value
        this.drag = this.defaultDrag;
        
        // Reset escape boost flags
        this.escapeBoostActive = false;
        this.escapeBoostDuration = 0;
        
        // Reset speed boost flags
        this.speedBoostActive = false;
        this.lastSpeedBoostCostTime = 0;
        
        // Update robot size in case window size changed
        this.updateRobotSize();
        
        // Reset movement direction tracking
        this.lastMovementAngle = 0;
        
        // Reset rendering timestamp to force a redraw
        this.lastRenderTime = 0;
        
        // Reset Three.js components
        if (this.robot) {
            // Reset all rotations
            this.robot.rotation.set(0, 0, 0);
            // Reset quaternion to identity (no rotation)
            this.robot.quaternion.set(0, 0, 0, 1);
            // Reset scale to prevent any lingering distortion effects
            this.robot.scale.set(1, 1, 1);
            
            // Ensure the robot is visible
            this.robot.visible = true;
        } else {
            console.warn("Robot model was not found during reset");
            // Try to recreate the 3D model if needed
            if (this.sceneManager && !this.robot) {
                console.log("Recreating 3D robot model");
                this.setup3DModel();
            }
        }
        
        // Reset jetpack flames
        if (this.jetpackFlame) {
            this.jetpackFlame.visible = false;
            this.jetpackFlame.scale.set(1, 1, 1);
            
            // Reset individual flames
            this.jetpackFlame.children.forEach(flame => {
                flame.scale.set(1, 1, 1);
                if (flame.material) {
                    flame.material.color.setHex(0xff6600); // Reset to default flame color
                }
            });
        }
        
        // Reset glow effect
        this.glowIntensity = 0;
        this.glowColor.set(0x00ffff); // Reset to default cyan
        
        // Apply reset to glow effect
        this.updateGlowEffect();
        
        // Force a renderer update
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
        this.updateGlowEffect(); // Apply the reset
    }
}
