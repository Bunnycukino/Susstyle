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

// Tło
const loader = new THREE.TextureLoader();
loader.load("stars.jpg", function (texture) {
  scene.background = texture;
});

// Światło
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

// Tekstura globusa
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("earthmap.jpg");

const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshBasicMaterial({ map: earthTexture });
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

// Funkcja do przeliczenia lat/lon na pozycję 3D
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Dodajemy marker Warszawa
const warsawPosition = latLongToVector3(52.2297, 21.0122, 5.1);
const warsawGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const warsawMaterial = new THREE.MeshBasicMaterial({ color: 0xff66cc });
const warsawMarker = new THREE.Mesh(warsawGeometry, warsawMaterial);
warsawMarker.position.copy(warsawPosition);
globe.add(warsawMarker);
// Dodajemy marker Manchester
const manchesterPosition = latLongToVector3(53.4808, -2.2426, 5.1);
const manchesterGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const manchesterMaterial = new THREE.MeshBasicMaterial({ color: 0x6699ff });
const manchesterMarker = new THREE.Mesh(manchesterGeometry, manchesterMaterial);
manchesterMarker.position.copy(manchesterPosition);
globe.add(manchesterMarker);
// Raycaster do interakcji
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX || event.touches?.[0].clientX) - rect.left) / rect.width;
  const y = ((event.clientY || event.touches?.[0].clientY) - rect.top) / rect.height;

  mouse.x = x * 2 - 1;
  mouse.y = - (y * 2 - 1);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(globe.children, true);

  if (intersects.length > 0 && intersects[0].object === warsawMarker) {
    alert("Witamy w Warszawie!");
  }
}

window.addEventListener("pointerdown", onPointerDown);

// Kamera
camera.position.z = 15;

// Kontrolki
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
