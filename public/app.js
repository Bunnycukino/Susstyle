const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("globeCanvas"),
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło gwiezdne
const loader = new THREE.TextureLoader();
loader.load("stars.jpg", function(texture) {
  scene.background = texture;
});

// Światło
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

// Ziemia
const earthTexture = loader.load("earthmap.jpg");
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshBasicMaterial({ map: earthTexture });
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

// Kamera
camera.position.z = 15;

// Kontrolki
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Ładowarka GLB
const gltfLoader = new THREE.GLTFLoader();

function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function addCityIcon(file, lat, lon) {
  gltfLoader.load(
    file,
    (gltf) => {
      const icon = gltf.scene;
      icon.scale.set(0.2, 0.2, 0.2); // Zmniejszenie
      const position = latLongToVector3(lat, lon, 5.1); // Trochę nad kulą
      icon.position.copy(position);
      icon.userData.city = file.includes("warsaw") ? "Warszawa" : "Manchester";
      globe.add(icon);
      clickableObjects.push(icon);
    },
    undefined,
    (error) => {
      console.error("Błąd ładowania GLB:", error);
    }
  );
}

// Dodajemy miasta
const clickableObjects = [];
addCityIcon("/warsaw-icon.glb", 52.2297, 21.0122);
addCityIcon("/manchester-icon.glb", 53.4808, -2.2426);

// Interakcje
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX || event.touches?.[0].clientX) - rect.left) / rect.width;
  const y = ((event.clientY || event.touches?.[0].clientY) - rect.top) / rect.height;
  mouse.x = x * 2 - 1;
  mouse.y = -(y * 2 - 1);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const city = intersects[0].object.userData.city;
    if (city === "Warszawa") {
      window.location.href = "/warsaw.html";
    } else if (city === "Manchester") {
      window.location.href = "/manchester.html";
    }
  }
}
window.addEventListener("pointerdown", onPointerDown);

// Animacja
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}
animate();
