// Configuración del webhook de n8n
// ⚠️ IMPORTANTE: Reemplaza esta URL con tu webhook real de n8n
const WEBHOOK_URL = 'https://TU_WEBHOOK_N8N_AQUI.com/webhook/pedidos';

// Variables globales
let cart = [];

// Funciones principales
function updateQuantity(button, change) {
    const quantityDisplay = button.parentElement.querySelector('.quantity-display');
    let currentQuantity = parseInt(quantityDisplay.textContent);
    const newQuantity = Math.max(0, currentQuantity + change);
    quantityDisplay.textContent = newQuantity;
}

function addToCart(productName, price, button) {
    const quantityElement = button.parentElement.querySelector('.quantity-display');
    const quantity = parseInt(quantityElement.textContent);
    
    if (quantity === 0) {
        alert('Selecciona una cantidad primero');
        return;
    }

    // Verificar si el producto ya existe en el carrito
    const existingItemIndex = cart.findIndex(item => item.producto === productName);
    
    if (existingItemIndex > -1) {
        // Si existe, sumar la cantidad
        cart[existingItemIndex].cantidad += quantity;
        cart[existingItemIndex].total = cart[existingItemIndex].cantidad * cart[existingItemIndex].precio;
    } else {
        // Si no existe, agregarlo al carrito
        cart.push({
            producto: productName,
            cantidad: quantity,
            precio: price,
            total: quantity * price
        });
    }

    // Resetear la cantidad mostrada
    quantityElement.textContent = '0';
    
    // Actualizar la visualización del carrito
    updateCartDisplay();
    
    // Mostrar mensaje de éxito
    button.textContent = '✅ Agregado';
    button.style.background = '#28a745';
    setTimeout(() => {
        button.textContent = 'Agregar al Carrito';
        button.style.background = 'linear-gradient(45deg, #ffcc00, #ffa500)';
    }, 1500);
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartBadge = document.getElementById('cartBadge');
    const customerInfo = document.getElementById('customerInfo');
    const sendOrderBtn = document.getElementById('sendOrder');
    const cartSection = document.getElementById('cartSection');
    
    if (cart.length === 0) {
        // Ocultar toda la sección del carrito
        cartSection.style.display = 'none';
        cartBadge.classList.add('empty');
        cartBadge.textContent = '0';
    } else {
        // Mostrar la sección del carrito
        cartSection.style.display = 'block';
        
        let cartHTML = '';
        let total = 0;
        let totalItems = 0;

        cart.forEach((item, index) => {
            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.cantidad}x ${item.producto}</div>
                        <div class="cart-item-price">$${item.total.toLocaleString()} COP</div>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">×</button>
                </div>
            `;
            total += item.total;
            totalItems += item.cantidad;
        });

        cartItems.innerHTML = cartHTML;
        cartTotal.innerHTML = `Total: $${total.toLocaleString()} COP`;
        cartTotal.style.display = 'block';
        customerInfo.style.display = 'grid';
        sendOrderBtn.style.display = 'block';
        cartB