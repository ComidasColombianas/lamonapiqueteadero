        // // 🔒 CONFIGURACIÓN GITHUB ACTION PROXY
        // const GITHUB_CONFIG = {
        //     owner: 'comidascolombianas',
        //     repo: 'comidascolombianas.github.io'

        // };
// Variables globales
let cart = [];
const WHATSAPP_NUMBER = '573213700248';
const WEBHOOK_URL = 'https://la-mona-proxy-shrill-dew-f9c0.alexa9001.workers.dev'; // nuevo proxy


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

    const existingItemIndex = cart.findIndex(item => item.producto === productName);
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].cantidad += quantity;
        cart[existingItemIndex].total = cart[existingItemIndex].cantidad * cart[existingItemIndex].precio;
    } else {
        cart.push({
            producto: productName,
            cantidad: quantity,
            precio: price,
            total: quantity * price
        });
    }

    quantityElement.textContent = '0';
    updateCartDisplay();
    
    // Feedback visual mejorado
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
    const payBtn = document.getElementById('payButton');
    const cartSection = document.getElementById('cartSection');
    
    if (cart.length === 0) {
        cartSection.style.display = 'none';
        cartBadge.classList.add('empty');
        cartBadge.textContent = '0';
        return;
    }

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
    payBtn.style.display = 'block';
    cartBadge.classList.remove('empty');
    cartBadge.textContent = totalItems;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function scrollToCart() {
    if (cart.length > 0) {
        document.querySelector('.cart-section').scrollIntoView({ behavior: 'smooth' });
    } else {
        document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Nueva función: Mostrar modal de confirmación
function showPaymentModal() {
    if (cart.length === 0) {
        alert('🛒 Tu carrito está vacío\n\nAgrega algunos productos antes de continuar.');
        return;
    }

    if (!validateCustomerInfo()) {
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const customerName = document.getElementById('customerName').value.trim();
    
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🍽️ Confirmar Pedido</h3>
            <p><strong>${customerName}</strong>, se redireccionará a WhatsApp para:</p>
            <ul>
                <li>📄 Resumen de tu pedido</li>
                <li>💳 Link de pago seguro</li>
                <li>📧 Confirmación por email</li>
            </ul>
            <p><strong>Total: $${total.toLocaleString()} COP</strong></p>
            <div class="modal-buttons">
                <button onclick="closeModal()" class="btn-cancel">Cancelar</button>
                <button onclick="processPayment()" class="btn-confirm">Enviar y Pagar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector('.payment-modal');
    if (modal) modal.remove();
}

// Función principal de pago actualizada
function processPayment() {
    closeModal();

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    const customerNotes = document.getElementById('customerNotes').value.trim();

    const total = cart.reduce((sum, item) => sum + item.total, 0);

    const orderData = {
        cliente_nombre: customerName,
        cliente_telefono: customerPhone,
        cliente_email: customerEmail,
        cliente_direccion: customerAddress,
        items: cart.map(item => ({
            nombre: item.producto,
            cantidad: item.cantidad,
            precio: item.precio
        })),
        notas: customerNotes || 'Sin notas especiales'
    };

    const payBtn = document.getElementById('payButton');
    const originalText = payBtn.textContent;
    payBtn.disabled = true;
    payBtn.textContent = '💳 Procesando pago...';
    payBtn.style.opacity = '0.6';

    console.log('🚀 Enviando pedido para pago:', orderData);

    // Enviar a webhook
    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        console.log('📡 Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        return response.text().then(text => {
            try {
                return JSON.parse(text);
            } catch (e) {
                // Si no es JSON válido, crear respuesta de éxito
                return { 
                    success: true, 
                    message: 'Pedido procesado correctamente',
                    pedido_id: `PED-${Date.now()}`,
                    total_pedido: total
                };
            }
        });
    })
    .then(data => {
        console.log('📦 Datos recibidos:', data);
        
        // Siempre redirigir a WhatsApp para el pago
        redirectToWhatsAppPayment({
            ...orderData,
            pedido_id: data.pedido_id || `PED-${Date.now()}`,
            total: total
        });
        
        // Mostrar mensaje de éxito
        showSuccessMessage();
        
    })
    .catch(error => {
        console.error('❌ Error:', error);
        
        // Como respaldo, redirigir a WhatsApp
        alert('🔌 Error temporal del servidor\n\n✅ Te redirigiremos a WhatsApp para completar tu pedido manualmente');
        
        redirectToWhatsAppPayment({
            ...orderData,
            total: total,
            error_backup: true
        });
        
        showSuccessMessage();
    })
    .finally(() => {
        payBtn.disabled = false;
        payBtn.textContent = originalText;
        payBtn.style.opacity = '1';
    });
}

function redirectToWhatsAppPayment(orderData) {
    let mensaje = `🍽️ *PEDIDO - LA MONA PIQUETEADERO*\n\n`;
    
    if (orderData.pedido_id) {
        mensaje += `📋 *ID:* ${orderData.pedido_id}\n`;
    }
    
    mensaje += `👤 *Cliente:* ${orderData.cliente_nombre}\n`;
    mensaje += `📱 *Teléfono:* ${orderData.cliente_telefono}\n`;
    mensaje += `📧 *Email:* ${orderData.cliente_email}\n`;
    mensaje += `📍 *Dirección:* ${orderData.cliente_direccion}\n\n`;
    
    mensaje += `🛒 *PRODUCTOS:*\n`;
    orderData.items.forEach(item => {
        const itemTotal = item.cantidad * item.precio;
        mensaje += `• ${item.cantidad}x ${item.nombre} - $${itemTotal.toLocaleString()}\n`;
    });
    
    mensaje += `\n💰 *TOTAL: $${orderData.total.toLocaleString()} COP*\n\n`;
    
    if (orderData.notas && orderData.notas !== 'Sin notas especiales') {
        mensaje += `📝 *Notas:* ${orderData.notas}\n\n`;
    }
    
    mensaje += `🙏 *Por favor envíame el link de pago para confirmar mi pedido*\n\n`;
    mensaje += `⏰ ${new Date().toLocaleString('es-CO')}`;

    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    
    console.log('🔗 Redirigiendo a WhatsApp:', whatsappURL);
    
    // Abrir WhatsApp
    const whatsappWindow = window.open(whatsappURL, '_blank');
    
    if (!whatsappWindow) {
        alert('❌ No se pudo abrir WhatsApp\n\n📋 El mensaje se ha copiado al portapapeles');
        if (navigator.clipboard) {
            navigator.clipboard.writeText(mensaje);
        }
    }
}

function showSuccessMessage() {
    // Crear overlay de éxito
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✅</div>
            <h2>¡Gracias por tu compra!</h2>
            <p>Tu pedido ha sido procesado exitosamente</p>
            <p>Revisa WhatsApp para completar el pago</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Limpiar carrito después de 3 segundos
    setTimeout(() => {
        clearCart();
        overlay.remove();
    }, 3000);
}

function validateCustomerInfo() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name) {
        alert('📝 Por favor ingresa tu nombre completo');
        document.getElementById('customerName').focus();
        return false;
    }

    if (!phone) {
        alert('📱 Por favor ingresa tu número de teléfono');
        document.getElementById('customerPhone').focus();
        return false;
    }

    if (!email) {
        alert('📧 Por favor ingresa tu correo electrónico');
        document.getElementById('customerEmail').focus();
        return false;
    }

    if (!address) {
        alert('📍 Por favor ingresa tu dirección');
        document.getElementById('customerAddress').focus();
        return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('📧 Por favor ingresa un email válido');
        document.getElementById('customerEmail').focus();
        return false;
    }

    // Validar teléfono colombiano
    const phoneRegex = /^(\+57|57)?[3][0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        const confirmPhone = confirm('⚠️ El número puede no ser válido para Colombia.\n\n¿Continuar?');
        if (!confirmPhone) {
            document.getElementById('customerPhone').focus();
            return false;
        }
    }

    return true;
}

function clearCart() {
    console.log('🧹 Limpiando carrito...');
    
    cart = [];
    updateCartDisplay();
    
    // Limpiar formulario
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNotes').value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 La Mona Piqueteadero - Sistema iniciado');
    
    // Validaciones en tiempo real
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            const phone = this.value.replace(/\s/g, '');
            const isValid = /^(\+57|57)?[3][0-9]{9}$/.test(phone);
            this.style.borderColor = phone && !isValid ? '#dc3545' : '#28a745';
        });
    }

    const emailInput = document.getElementById('customerEmail');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            this.style.borderColor = email && !isValid ? '#dc3545' : '#28a745';
        });
    }

    const nameInput = document.getElementById('customerName');
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            const name = this.value.trim();
            this.style.borderColor = name.length < 2 ? '#dc3545' : '#28a745';
        });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    updateCartDisplay();
});

// CSS para modal y overlay (agregar a tu CSS)
const style = document.createElement('style');
style.textContent = `
.payment-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 15px;
    max-width: 400px;
    text-align: center;
    margin: 20px;
}

.modal-buttons {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

.btn-cancel, .btn-confirm {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.btn-cancel {
    background: #dc3545;
    color: white;
}

.btn-confirm {
    background: #28a745;
    color: white;
}

.success-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
}

.success-message {
    background: white;
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 350px;
    margin: 20px;
}

.success-icon {
    font-size: 60px;
    margin-bottom: 20px;
}
`;
document.head.appendChild(style);

/* 
=================================
RECOMENDACIONES DE SEGURIDAD:
=================================

1. OCULTAR WEBHOOK URL:
   - Crear API intermedia en tu servidor
   - Usar variables de entorno
   - Implementar proxy reverso

2. OFUSCAR CÓDIGO:
   - Usar herramientas como: terser, uglify-js
   - Minificar y comprimir archivos
   - Ejemplo: npm install terser -g && terser script.js -c -m -o script.min.js

3. PROXY BACKEND (Recomendado):
   - Crear endpoint: /api/orders en tu servidor
   - Redirigir peticiones a n8n desde backend
   - Nunca exponer URLs directas de n8n

4. VALIDACIONES ADICIONALES:
   - Rate limiting
   - CORS headers
   - Input sanitization

5. IMPLEMENTACIÓN SUGERIDA:
   
   Backend (Node.js/PHP):
   POST /api/orders -> proxy to n8n webhook
   
   Frontend:
   const WEBHOOK_URL = '/api/orders'; // URL relativa segura
*/