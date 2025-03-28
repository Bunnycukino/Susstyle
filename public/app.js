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

// Światło ambient bardzo jasne
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// Tekstura nocna
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("earthnight.jpg");

// Globus z awaryjnym kolorem jeśli tekstura nie zadziała
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshBasicMaterial({
  map: earthTexture,
  color: 0x3333ff,
});

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

camera.position.z = 15;

function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.002;
  renderer.render(scene, camera);
}
animate();
