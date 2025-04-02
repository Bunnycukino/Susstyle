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

// Tło
const loader = new THREE.TextureLoader();
loader.load("stars.jpg", texture => {
  scene.background = texture;
});

// Światło
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// Ziemia
const earthTexture = loader.load("earthmap.jpg");
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(5, 64, 64),
  new THREE.MeshBasicMaterial({ map: earthTexture })
);
scene.add(globe);

// Funkcja przeliczania współrzędnych
function latLongToVector3(lat, lon, radius = 5.1) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Dodajemy markery
function addMarker(lat, lon, color, cityName) {
  const geometry = new THREE.SphereGeometry(0.15, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const marker = new THREE.Mesh(geometry, material);
  marker.position.copy(latLongToVector3(lat, lon));
  marker.userData.city = cityName;
  globe.add(marker);
  clickableMarkers.push(marker);
}

const clickableMarkers = [];

addMarker(52.2297, 21.0122, 0xff66cc, "Warszawa");
addMarker(53.4808, -2.2426, 0x6699ff, "Manchester");

// Interakcja
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("pointerdown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableMarkers);

  if (intersects.length > 0) {
    const city = intersects[0].object.userData.city;
    if (city === "Warszawa") {
      window.location.href = "warsaw.html";
    } else if (city === "Manchester") {
      window.location.href = "manchester.html";
    }
  }
});

// Kontrolki
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Animacja
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
