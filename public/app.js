const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 20);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("globeCanvas"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Tło i Ziemia
const loader = new THREE.TextureLoader();
scene.background = loader.load("stars.jpg");

const earthTexture = loader.load("earthmap.jpg");
const globe = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), new THREE.MeshBasicMaterial({ map: earthTexture }));
scene.add(globe);

// Ikony
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

const gltfLoader = new THREE.GLTFLoader();
function addCity(file, lat, lon) {
  gltfLoader.load(file, gltf => {
    const icon = gltf.scene;
    icon.scale.set(0.3, 0.3, 0.3);
    icon.position.copy(latLongToVector3(lat, lon, 5.2));
    globe.add(icon);
  });
}

addCity("warsaw-icon.glb", 52.2297, 21.0122);
addCity("manchester-icon.glb", 53.4808, -2.2426);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.001;
  controls.update();
  renderer.render(scene, camera);
}
animate();
