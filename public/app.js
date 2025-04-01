const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("globeCanvas") });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło gwiazd
const loader = new THREE.TextureLoader();
loader.load("stars.jpg", (texture) => {
  scene.background = texture;
});

// Światło
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// Tekstura ziemi
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("earthmap.jpg");
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Funkcja konwersji pozycji
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Ładowanie modeli
const loaderGLTF = new THREE.GLTFLoader();

const iconData = [
  {
    name: "warsaw",
    file: "warsaw-icon.glb",
    lat: 52.2297,
    lon: 21.0122,
    url: "https://susstyle.com/warsaw"
  },
  {
    name: "manchester",
    file: "manchester-icon.glb",
    lat: 53.4808,
    lon: -2.2426,
    url: "https://susstyle.com/manchester"
  }
];

const clickableIcons = [];

iconData.forEach((city) => {
  loaderGLTF.load(city.file, (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.2, 0.2, 0.2); // dopasuj skalę
    const position = latLongToVector3(city.lat, city.lon, 5.2);
    model.position.copy(position);
    model.name = city.name;
    globe.add(model);
    clickableIcons.push({ mesh: model, url: city.url });
  });
});

// Raycaster do kliknięć
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableIcons.map(i => i.mesh));
  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    const match = clickableIcons.find(i => i.mesh === clicked);
    if (match) {
      window.location.href = match.url;
    }
  }
});

// Kontrolki do obracania
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.0015;
  controls.update();
  renderer.render(scene, camera);
}

animate();
