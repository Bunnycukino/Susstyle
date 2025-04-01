const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("globeCanvas") });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło gwiazd
const starsTexture = new THREE.TextureLoader().load("stars.jpg");
scene.background = starsTexture;

// Światło
scene.add(new THREE.AmbientLight(0xffffff));

// Globus z teksturą
const earthTexture = new THREE.TextureLoader().load("earthmap.jpg");
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(5, 64, 64),
  new THREE.MeshBasicMaterial({ map: earthTexture })
);
scene.add(globe);

// Funkcja: współrzędne geograficzne → pozycja 3D
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// MARKER WARSZAWA (box)
const warsawBox = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.5, 0.3),
  new THREE.MeshBasicMaterial({ color: 0xff69b4 }) // różowy
);
warsawBox.position.copy(latLongToVector3(52.2297, 21.0122, 5.1));
globe.add(warsawBox);

// MARKER MANCHESTER (box)
const manchesterBox = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.5, 0.3),
  new THREE.MeshBasicMaterial({ color: 0x6699ff }) // niebieski
);
manchesterBox.position.copy(latLongToVector3(53.4808, -2.2426, 5.1));
globe.add(manchesterBox);

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
