const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 20);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("globeCanvas"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło
const textureLoader = new THREE.TextureLoader();
textureLoader.load("stars.jpg", (texture) => {
  scene.background = texture;
});

// Światło
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Ziemia
const earthTexture = textureLoader.load("earthmap.jpg");
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Funkcja konwertująca współrzędne
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Dodajemy markery z GLB
const loader = new THREE.GLTFLoader();

function addCityIcon(lat, lon, file, link) {
  loader.load(file, (gltf) => {
    const icon = gltf.scene;
    icon.scale.set(0.3, 0.3, 0.3);
    const pos = latLongToVector3(lat, lon, 5.3);
    icon.position.copy(pos);
    icon.userData = { url: link };
    globe.add(icon);
    clickableIcons.push(icon);
  });
}

const clickableIcons = [];
addCityIcon(52.2297, 21.0122, "warsaw-icon.glb", "https://susstyle.shop/warsaw");
addCityIcon(53.4808, -2.2426, "manchester-icon.glb", "https://susstyle.shop/manchester");

// Kontrolki
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Klikanie
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("pointerdown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableIcons, true);

  if (intersects.length > 0) {
    const url = intersects[0].object.userData.url;
    if (url) window.location.href = url;
  }
});

// Animacja
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.0015;
  controls.update();
  renderer.render(scene, camera);
}

animate();
