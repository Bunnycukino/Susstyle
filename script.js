// ================================================================
// SUSSTYLE - GŁÓWNY SKRYPT JAVASCRIPT
// Wersja 1.0 - Nowoczesny design z globusem 3D
// ================================================================

const products = [
    { id: 1, name: "Elegancka Sukienka", description: "Klasyczna elegancja z Warszawy", image: "public/model.jpeg", location: "warszawa", category: "warszawa" },
    { id: 2, name: "Urban Style Jacket", description: "Miejski styl z Manchesteru", image: "public/model2.jpeg", location: "manchester", category: "manchester" }
];

const ADMIN_PASSWORD = 'susstyle2025';
let isAdminLoggedIn = false;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initGallery();
    initFilters();
    initModals();
    initAdminPanel();
    initGlobe();
});

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        lastScroll = currentScroll;
    });

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#') && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }
        });
    });
}

function initGallery() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    renderProducts(products);
}

function renderProducts(productsToRender) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';
    
    productsToRender.forEach(product => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.category = product.category;
        
        item.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="gallery-item-image" loading="lazy" onerror="this.src='public/model.jpeg'">
            <div class="gallery-item-content">
                <h3 class="gallery-item-title">${product.name}</h3>
                <p class="gallery-item-description">${product.description}</p>
                <span class="gallery-item-location">${product.location === 'warszawa' ? 'Warszawa' : 'Manchester'}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            openImageModal(product.image, product.name);
        });
        
        productGrid.appendChild(item);
    });
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            if (filter === 'all') {
                renderProducts(products);
            } else {
                const filtered = products.filter(p => p.category === filter);
                renderProducts(filtered);
            }
        });
    });
}

function initModals() {
    const imageModal = document.getElementById('imageModal');
    const modalClose = document.querySelector('.modal-close');
    
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            imageModal.style.display = 'none';
        });
    }
    
    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                imageModal.style.display = 'none';
            }
        });
    }
}

function openImageModal(imageSrc, caption) {
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    if (imageModal && modalImage) {
        modalImage.src = imageSrc;
        modalCaption.textContent = caption;
        imageModal.style.display = 'flex';
    }
}

function initAdminPanel() {
    const adminLink = document.getElementById('adminLink');
    const adminModal = document.getElementById('adminModal');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const closeModal = document.querySelector('.modal .close');
    
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAdminLoggedIn) {
                window.location.href = 'admin.html';
            } else {
                adminModal.classList.add('active');
                adminModal.style.display = 'flex';
            }
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            adminModal.classList.remove('active');
            adminModal.style.display = 'none';
        });
    }
    
    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.classList.remove('active');
                adminModal.style.display = 'none';
            }
        });
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            const errorMessage = document.getElementById('loginError');
            
            if (password === ADMIN_PASSWORD) {
                isAdminLoggedIn = true;
                sessionStorage.setItem('adminLoggedIn', 'true');
                window.location.href = 'admin.html';
            } else {
                errorMessage.textContent = '❌ Nieprawidłowe hasło!';
                setTimeout(() => { errorMessage.textContent = ''; }, 3000);
            }
        });
    }
}

// ================================================================
// INICJALIZACJA GLOBUSA 3D (zachowanie istniejącego kodu)
// ================================================================
function initGlobe() {
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
    renderer.setSize(window.innerWidth, window.innerHeight * 0.8);

    // Tło
    const loader = new THREE.TextureLoader();
    loader.load("public/stars.jpg", texture => {
        scene.background = texture;
    });

    // Światło
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    // Ziemia
    const earthTexture = loader.load("public/earthmap.jpg");
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
    const clickableMarkers = [];
    
    function addMarker(lat, lon, color, cityName) {
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(latLongToVector3(lat, lon));
        marker.userData.city = cityName;
        globe.add(marker);
        clickableMarkers.push(marker);
    }

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
                window.location.href = "public/warsaw.html";
            } else if (city === "Manchester") {
                window.location.href = "public/manchester.html";
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
        renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
    });
}