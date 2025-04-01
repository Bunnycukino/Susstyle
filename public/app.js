const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("globeCanvas") });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło
const starsTexture = new THREE.TextureLoader().load("stars.jpg");
scene.background = starsTexture;

// Światło
scene.add(new THREE.AmbientLight(0xffffff));

// Globus
const earthTexture = new THREE.TextureLoader().load("earthmap.jpg");
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(5, 64, 64),
  new THREE.MeshBasicMaterial({ map: earthTexture })
);
scene.add(globe);

// Funkcja pozycjonująca
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Ikony 3D
const gltfLoader = new THREE.GLTFLoader();

gltfLoader.load('warsaw-icon.glb', (gltf) => {
  const warsawIcon = gltf.scene;
  warsawIcon.position.copy(latLongToVector3(52.2297, 21.0122, 5.1));
  warsawIcon.scale.set(0.5, 0.5, 0.5);
  globe.add(warsawIcon);
});

gltfLoader.load('manchester-icon.glb', (gltf) => {
  const manchesterIcon = gltf.scene;
  manchesterIcon.position.copy(latLongToVector3(53.4808, -2.2426, 5.1));
  manchesterIcon.scale.set(0.5, 0.5, 0.5);
  globe.add(manchesterIcon);
});

// Kamera i kontrolki
camera.position.z = 15;
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Animacja
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}
animate();
