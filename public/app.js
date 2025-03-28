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

// Światło kierunkowe + ambient
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.2);
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);

// Tekstura nocna
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("earthnight.jpg");

// Używamy lepszego materiału do oświetlenia
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshPhongMaterial({
  map: earthTexture,
  shininess: 2,
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
