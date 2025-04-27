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
        
        // Modified shard mechanics
        this.dataShards = 1; // Start with 1 shard
        this.blackHoleTimer = 0;
        this.isTrapped = false;
        this.lastShardLossTime = 0;
        this.shardLossInterval = 2; // 2 seconds between shard loss
        this.lastMovementTime = Date.now(); // Track last movement time
        this.escapeBoostActive = false;
        this.escapeBoostDuration = 0;

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
            bodyColor: 0xffffff,
            helmetColor: 0xdddddd
        };
        
        // Store materials for color updates
        this.bodyMaterial = null;
        this.helmetMaterial = null;

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
        this.x = sceneManager.centerX;
        this.y = sceneManager.height - 100;
        
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
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.helmetMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.helmetColor,
            metalness: 0.8,
            roughness: 0.2,
            shininess: 100
        });
        const head = new THREE.Mesh(headGeometry, this.helmetMaterial);
        head.position.y = 0.9;
        this.robot.add(head);
        
        // Create robot eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff, // Cyan glowing eyes
            emissive: 0x00ffff,
            emissiveIntensity: 0.7,
            shininess: 100
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.15, 0.95, 0.25);
        this.robot.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.15, 0.95, 0.25);
        this.robot.add(rightEye);
        
        // Create antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        const antennaMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            metalness: 0.8
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, 1.25, 0);
        this.robot.add(antenna);
        
        // Create antenna tip
        const antennaTipGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const antennaTipMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const antennaTip = new THREE.Mesh(antennaTipGeometry, antennaTipMaterial);
        antennaTip.position.set(0, 1.35, 0);
        this.robot.add(antennaTip);
        
        // Create robot body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        this.bodyMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.bodyColor,
            metalness: 0.6,
            shininess: 70
        });
        const body = new THREE.Mesh(bodyGeometry, this.bodyMaterial);
        body.position.y = 0.3;
        this.robot.add(body);
        
        // Create chest panel
        const panelGeometry = new THREE.PlaneGeometry(0.4, 0.3);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 70
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, 0.4, 0.21);
        this.robot.add(panel);
        
        // Add indicator lights to panel
        const lightGeometry = new THREE.CircleGeometry(0.05, 8);
        const greenLightMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
        const redLightMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
        const blueLightMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});
        
        const light1 = new THREE.Mesh(lightGeometry, greenLightMaterial);
        light1.position.set(0.1, 0.45, 0.22);
        this.robot.add(light1);
        
        const light2 = new THREE.Mesh(lightGeometry, redLightMaterial);
        light2.position.set(0, 0.45, 0.22);
        this.robot.add(light2);
        
        const light3 = new THREE.Mesh(lightGeometry, blueLightMaterial);
        light3.position.set(-0.1, 0.45, 0.22);
        this.robot.add(light3);
        
        // Create robot arms
        const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        
        const leftArm = new THREE.Mesh(armGeometry, this.bodyMaterial);
        leftArm.position.set(0.38, 0.3, 0);
        this.robot.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, this.bodyMaterial);
        rightArm.position.set(-0.38, 0.3, 0);
        this.robot.add(rightArm);
        
        // Create robot hands
        const handGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        
        const leftHand = new THREE.Mesh(handGeometry, this.helmetMaterial);
        leftHand.position.set(0.38, 0, 0);
        this.robot.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeometry, this.helmetMaterial);
        rightHand.position.set(-0.38, 0, 0);
        this.robot.add(rightHand);
        
        // Create robot legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        
        const leftLeg = new THREE.Mesh(legGeometry, this.bodyMaterial);
        leftLeg.position.set(0.2, -0.4, 0);
        this.robot.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, this.bodyMaterial);
        rightLeg.position.set(-0.2, -0.4, 0);
        this.robot.add(rightLeg);
        
        // Create robot feet
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
        const jetpackMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            shininess: 50
        });
        const jetpackBody = new THREE.Mesh(jetpackGeometry, jetpackMaterial);
        this.jetpack.add(jetpackBody);
        
        // Jetpack thrusters (main vertical thrusters)
        const thrusterGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8);
        const thrusterMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            shininess: 80
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
        const flameGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
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

        // Determine if player is actively moving with jetpack
        const isUsingJetpack = this.isMoving.up || this.isMoving.down || 
                              this.isMoving.left || this.isMoving.right;
        
        // Update whether player is affected by universe rotation
        this.affectedByRotation = !isUsingJetpack && !this.escapeBoostActive;
        
        // Apply player input as acceleration
        const acceleration = { x: 0, y: 0 };
        
        if (this.isMoving.up) acceleration.y -= this.speed;
        if (this.isMoving.down) acceleration.y += this.speed;
        if (this.isMoving.left) acceleration.x -= this.speed;
        if (this.isMoving.right) acceleration.x += this.speed;
        
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

                // Check for shard loss
                const currentTime = Date.now();
                if (this.blackHoleTimer >= 5 && 
                    currentTime - this.lastShardLossTime >= this.shardLossInterval * 1000) {
                    this.dataShards = Math.max(0, this.dataShards - 1);
                    this.lastShardLossTime = currentTime;
                    
                    // Trigger game over if no shards left
                    if (this.dataShards <= 0) {
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
        
        // Cap maximum speed
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (currentSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / currentSpeed;
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
        
        // Set overall visibility of jetpack flames
        this.jetpackFlame.visible = isUsingJetpack;
        
        if (isUsingJetpack) {
            // Control individual flames based on movement direction
            // Find the main thruster flames
            const mainLeftFlame = this.jetpackFlame.children.find(child => child.name === "mainLeft");
            const mainRightFlame = this.jetpackFlame.children.find(child => child.name === "mainRight");
            const leftSideFlame = this.jetpackFlame.children.find(child => child.name === "sideLeft");
            const rightSideFlame = this.jetpackFlame.children.find(child => child.name === "sideRight");
            const forwardFlame = this.jetpackFlame.children.find(child => child.name === "forward");
            
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
        
        // Only apply universe rotation if the robot is affected AND moving
        // This prevents the robot from spinning when stationary
        if (this.affectedByRotation && velocityMagnitude > 10) {
            // Create a quaternion for the universe rotation
            const universeRotationQuat = new THREE.Quaternion();
            universeRotationQuat.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0), // Rotate around Y axis
                this.sceneManager.universeRotationAngle
            );
            
            // Apply universe rotation to the robot's current orientation
            // This preserves any orientation from movement while adding universe spin
            this.robot.quaternion.premultiply(universeRotationQuat);
        }
        
        // Enhance jetpack flames based on movement speed and direction
        if (this.jetpackFlame.visible) {
            // Calculate movement intensity (0 to 1)
            const velocityMagnitude = Math.sqrt(
                this.velocity.x * this.velocity.x + 
                this.velocity.y * this.velocity.y
            );
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
                const baseScale = 0.8 + (directionIntensity * 0.6);
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
                const flameColors = [0xff6600, 0xff9900, 0xffcc00];
                // More intense flames are more yellow/white
                const colorIndex = Math.min(2, Math.floor(directionIntensity * 3));
                
                // Randomly change colors with flickering effect
                if (Math.random() > 0.85) {
                    const randomColor = flameColors[colorIndex];
                    if (flame.material) {
                        flame.material.color.setHex(randomColor);
                    }
                }
            });
        }
    }
    
    draw() {
        // Render the 3D model to an offscreen canvas
        this.renderer.setSize(this.robotSize, this.robotSize); // Use dynamic size
        this.renderer.render(this.scene, this.camera);
        
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
                this.tryEscape();
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
        if (this.isTrapped && this.dataShards >= 5) {
            // Subtract 5 exotic particles when escaping
            this.dataShards -= 5;
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

    checkCollision(object) {
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + object.radius;
    }
    
    reset() {
        this.x = this.sceneManager.centerX;
        this.y = this.sceneManager.height - 100;
        this.velocity = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };
        this.isMoving = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        // Reset exotic particle properties
        this.dataShards = 1;
        this.blackHoleTimer = 0;
        this.isTrapped = false;
        this.lastShardLossTime = 0;
        // Reset the drag to default value
        this.drag = this.defaultDrag;
        
        // Update robot size in case window size changed
        this.updateRobotSize();
        
        // Reset movement direction tracking
        this.lastMovementAngle = 0;
        
        if (this.robot) {
            // Reset all rotations
            this.robot.rotation.set(0, 0, 0);
            // Reset quaternion to identity (no rotation)
            this.robot.quaternion.set(0, 0, 0, 1);
        }
    }
}
