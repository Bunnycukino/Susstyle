const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 20);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("globeCanvas"),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło – gwiazdy
const textureLoader = new THREE.TextureLoader();
textureLoader.load("stars.jpg", texture => {
  scene.background = texture;
});

// Światło
const ambient = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambient);

// Tekstura ziemi
const earthTexture = textureLoader.load("earthmap.jpg");
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Funkcja: lat/lon → Vector3
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Ładowanie ikon .glb
const loader = new THREE.GLTFLoader();

function addCityIcon(file, lat, lon) {
  loader.load(file, gltf => {
    const icon = gltf.scene;
    icon.scale.set(0.3, 0.3, 0.3);
    icon.position.copy(latLongToVector3(lat, lon, 5.2));
    globe.add(icon);
  }, undefined, error => {
    console.error("Błąd ładowania:", file, error);
  });
}

// Dodaj miasta
addCityIcon("warsaw-icon.glb", 52.2297, 21.0122);
addCityIcon("manchester-icon.glb", 53.4808, -2.2426);

// Kontrolki + render
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.001;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Responsywność
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
