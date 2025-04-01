const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("globeCanvas"),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło gwiazd
const starsTexture = new THREE.TextureLoader().load("stars.jpg");
scene.background = starsTexture;

// Światło
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// Tekstura globu
const globeTexture = new THREE.TextureLoader().load("earthmap.jpg");
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshBasicMaterial({ map: globeTexture });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Kontrolki
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Kamera
camera.position.z = 15;

// Funkcja konwersji współrzędnych
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Loader ikon 3D
const gltfLoader = new THREE.GLTFLoader();
function addCityIcon(path, lat, lon, radius = 5.2) {
  gltfLoader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.position.copy(latLongToVector3(lat, lon, radius));
      model.scale.set(0.4, 0.4, 0.4);
      globe.add(model);
    },
    undefined,
    (error) => {
      console.error("Błąd ładowania:", path, error);
    }
  );
}

// Dodaj ikony miast
addCityIcon("warsaw-icon.glb", 52.2297, 21.0122);       // Warszawa
addCityIcon("manchester-icon.glb", 53.4808, -2.2426);   // Manchester

// Animacja
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.001;
  controls.update();
  renderer.render(scene, camera);
}
animate();
