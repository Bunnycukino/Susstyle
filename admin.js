// Sprawdź czy admin jest zalogowany
if (!sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'index.html';
}

const GITHUB_TOKEN = 'TWÓJ_TOKEN_TUTAJ'; // Zmień na swój token
const GITHUB_REPO = 'Bunnycukino/Susstyle';

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.textContent = '⏳ Dodawanie produktu...';
    statusDiv.className = 'status-message';
    
    try {
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const location = document.getElementById('productLocation').value;
        const imageFile = document.getElementById('productImage').files[0];
        
        // Tutaj dodaj logikę uploadu do GitHub
        // (podobnie jak w BabciaHalina.com)
        
        statusDiv.textContent = '✅ Produkt dodany pomyślnie!';
        statusDiv.className = 'status-message success';
        
        // Wyczyść formularz
        document.getElementById('uploadForm').reset();
        
    } catch (error) {
        statusDiv.textContent = '❌ Błąd: ' + error.message;
        statusDiv.className = 'status-message error';
    }
});

// Załaduj listę produktów
function loadProducts() {
    const productsList = document.getElementById('productsList');
    // Tutaj załaduj produkty z script.js
    productsList.innerHTML = '<p>Lista produktów zostanie załadowana...</p>';
}

loadProducts();