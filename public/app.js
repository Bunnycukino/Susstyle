// Scena, kamera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("globeCanvas") });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tło - gwiazdy
const starsTexture = new THREE.TextureLoader().load("stars.jpg");
scene.background = starsTexture;

// Światło
scene.add(new THREE.AmbientLight(0xffffff));

// Globus z teksturą Ziemi
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

// Marker: Warszawa
const warsawMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xff66cc })
);
warsawMarker.position.copy(latLongToVector3(52.2297, 21.0122, 5.1));
globe.add(warsawMarker);

// Marker: Manchester
const manchesterMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x6699ff })
);
manchesterMarker.position.copy(latLongToVector3(53.4808, -2.2426, 5.1));
globe.add(manchesterMarker);

// Interakcja: kliknięcia
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

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    if (clicked === warsawMarker) alert("Witamy w Warszawie!");
    else if (clicked === manchesterMarker) alert("Witamy w Manchesterze!");
  }
}

window.addEventListener("pointerdown", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX || event.touches?.[0].clientX) - rect.left) / rect.width;
  const y = ((event.clientY || event.touches?.[0].clientY) - rect.top) / rect.height;

  mouse.x = x * 2 - 1;
  mouse.y = -(y * 2 - 1);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([warsawMarker, manchesterMarker]);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;

    if (clicked === warsawMarker) {
      window.location.href = "warsaw.html";
    } else if (clicked === manchesterMarker) {
      window.location.href = "manchester.html";
    }
  }
});

// Animacja
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}
animate();
