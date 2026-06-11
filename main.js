// Basic Three.js first-person horror prototype

let camera, scene, renderer, controls;
let monster, clock;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();

init();
animate();

function init() {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.05);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.7, 5); // eye height

  // Controls (pointer lock)
  controls = new THREE.PointerLockControls(camera, document.body);
  document.body.addEventListener("click", () => {
    controls.lock();
  });

  controls.addEventListener("lock", () => {
    console.log("Pointer locked");
  });

  controls.addEventListener("unlock", () => {
    console.log("Pointer unlocked");
  });

  // Floor
  const floorGeo = new THREE.PlaneGeometry(200, 200);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 1,
    metalness: 0
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Dim ambient light
  const ambient = new THREE.AmbientLight(0x202020);
  scene.add(ambient);

  // Player flashlight (spotlight)
  const flashlight = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 8, 0.5, 1);
  flashlight.position.set(0, 1.7, 0);
  flashlight.target.position.set(0, 1.7, -1);
  flashlight.castShadow = true;
  scene.add(flashlight);
  scene.add(flashlight.target);

  // Monster (shadowy figure)
  const monsterGeo = new THREE.BoxGeometry(0.8, 1.8, 0.4);
  const monsterMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x050505
  });
  monster = new THREE.Mesh(monsterGeo, monsterMat);
  monster.position.set(0, 1, -15);
  monster.castShadow = true;
  scene.add(monster);

  // Clock
  clock = new THREE.Clock();

  // Keyboard input
  const onKeyDown = (event) => {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        moveForward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        moveBackward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        moveLeft = true;
        break;
      case "KeyD":
      case "ArrowRight":
        moveRight = true;
        break;
    }
  };

  const onKeyUp = (event) => {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        moveForward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        moveBackward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        moveLeft = false;
        break;
      case "KeyD":
      case "ArrowRight":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Resize
  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Simple horror logic: monster slowly moves toward player
function updateMonster(delta) {
  const playerPos = new THREE.Vector3();
  camera.getWorldPosition(playerPos);

  const dir = new THREE.Vector3().subVectors(playerPos, monster.position);
  const distance = dir.length();

  if (distance > 1.5) {
    dir.normalize();
    const speed = 0.5; // creep speed
    monster.position.addScaledVector(dir, speed * delta);
  } else {
    // "caught" – you can expand this into a death screen
    document.getElementById("overlay").innerText =
      "You feel the darkness close in. Refresh to try again.";
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls.isLocked) {
    // Movement
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    const speed = 5.0;

    if (moveForward) velocity.z -= speed * delta;
    if (moveBackward) velocity.z += speed * delta;
    if (moveLeft) velocity.x -= speed * delta;
    if (moveRight) velocity.x += speed * delta;

    controls.moveRight(velocity.x * delta);
    controls.moveForward(velocity.z * delta);

    // Flashlight follows camera
    const flashlight = scene.children.find(
      (obj) => obj.isSpotLight === true
    );
    if (flashlight) {
      const camPos = new THREE.Vector3();
      camera.getWorldPosition(camPos);
      flashlight.position.copy(camPos);

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      flashlight.target.position.copy(
        camPos.clone().add(camDir.multiplyScalar(5))
      );
      flashlight.target.updateMatrixWorld();
    }

    // Update monster
    updateMonster(delta);
  }

  renderer.render(scene, camera);
}
