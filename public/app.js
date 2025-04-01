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

// Ustawienie tła sceny
const loader = new THREE.TextureLoader();
loader.load("stars.jpg", function(texture) {
  scene.background = texture;
});

// Światło
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

// Tekstura Ziemi
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("earthmap.jpg");

const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshBasicMaterial({ map: earthTexture });
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
// MARKER - Warszawa
const warsawGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const warsawMaterial = new THREE.MeshBasicMaterial({ color: 0xff66cc });
const warsawMarker = new THREE.Mesh(warsawGeometry, warsawMaterial);
warsawMarker.position.set(-2.86, 3.95, -1.10);
globe.add(warsawMarker);

// Interaktywność
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(globe.children);

  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object === warsawMarker) {
      alert("Witamy w Warszawie!");
    }
  }
});
// Kamera
camera.position.z = 15;

// Kontrolki
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  const warsawPosition = latLongToVector3(52.2297, 21.0122, 5.1); // 5.1 = trochę nad powierzchnią
const warsawGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const warsawMaterial = new THREE.MeshBasicMaterial({ color: 0xff66cc });
const warsawMarker = new THREE.Mesh(warsawGeometry, warsawMaterial);
warsawMarker.position.copy(warsawPosition);
globe.add(warsawMarker);
  
  return new THREE.Vector3(x, y, z);
}

animate();

