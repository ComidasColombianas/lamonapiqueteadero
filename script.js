
// 🔒 CONFIGURACIÓN GITHUB ACTION PROXY
const GITHUB_CONFIG = {
    owner: 'ComidasColombianas', // Tu usuario de GitHub
    repo: 'lamonapiqueteadero'   // Tu repositorio
};

// Variables globales
let cart = [];
const WHATSAPP_NUMBER = '573213700248';

// Función para hacer pedidos a través del GitHub Issue (SIN TOKEN REQUERIDO)
async function hacerPedidoProxy(datosPedido) {
    try {
        console.log('📤 Enviando pedido a través de GitHub Issues...');
        
        // Crear título del issue
        const timestamp = new Date().toLocaleString('es-CO');
        const titulo = `🍽️ PEDIDO - ${datosPedido.cliente_nombre} - ${timestamp}`;
        
        // Crear cuerpo del issue con formato JSON
        const cuerpo = JSON.stringify({
            cliente_nombre: datosPedido.cliente_nombre,
            cliente_telefono: datosPedido.cliente_telefono,
            cliente_email: datosPedido.cliente_email,
            cliente_direccion: datosPedido.cliente_direccion,
            items: datosPedido.items,
            notas: datosPedido.notas || '',
            timestamp: new Date().toISOString(),
            procesado_por: "WebApp-Issues"
        }, null, 2);
        
        // URL para crear issue (NO requiere token desde navegador)
        const issueUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`;
        
        const response = await fetch(issueUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
                // ✅ NO se requiere Authorization para issues públicos
            },
            body: JSON.stringify({
                title: titulo,
                body: cuerpo,
                labels: ['pedido', 'pendiente']
            })
        });
        
        if (response.ok) {
            const issueData = await response.json();
            console.log('✅ Issue creado exitosamente:', issueData.number);
            return { 
                success: true, 
                message: 'Pedido procesado correctamente',
                issue_number: issueData.number 
            };
        } else {
            console.error('❌ Error creando issue:', response.status, response.statusText);
            return { success: false, message: 'Error procesando el pedido' };
        }
        
    } catch (error) {
        console.error('❌ Error conectando con GitHub:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

// Funciones principales (resto igual que antes)
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
            <p><strong>${customerName}</strong>, tu pedido será procesado automáticamente:</p>
            <ul>
                <li>📄 Se enviará a nuestro sistema</li>
                <li>💳 Recibirás link de pago por WhatsApp</li>
                <li>📧 Confirmación por email</li>
            </ul>
            <p><strong>Total: $${total.toLocaleString()} COP</strong></p>
            <div class="modal-buttons">
                <button onclick="closeModal()" class="btn-cancel">Cancelar</button>
                <button onclick="processPayment()" class="btn-confirm">Confirmar Pedido</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector('.payment-modal');
    if (modal) modal.remove();
}

// Función principal de pago - ACTUALIZADA
async function processPayment() {
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
    payBtn.textContent = '📤 Enviando pedido...';
    payBtn.style.opacity = '0.6';

    console.log('🚀 Enviando pedido:', orderData);

    try {
        const resultado = await hacerPedidoProxy(orderData);
        
        if (resultado.success) {
            console.log('✅ Pedido enviado exitosamente');
            
            // Mostrar mensaje de éxito primero
            showSuccessMessage(resultado.issue_number);
            
            // Esperar un momento antes de redirigir
            setTimeout(() => {
                redirectToWhatsAppPayment({
                    ...orderData,
                    pedido_id: `PED-${resultado.issue_number}-${Date.now()}`,
                    total: total
                });
            }, 1500);
            
        } else {
            console.error('❌ Error:', resultado.message);
            alert('❌ Error procesando el pedido\n\n📱 Te redirigiremos a WhatsApp');
            
            redirectToWhatsAppPayment({
                ...orderData,
                total: total,
                error_backup: true
            });
        }
        
    } catch (error) {
        console.error('❌ Error crítico:', error);
        alert('⚠️ Error de conexión\n\n📱 Redirigiendo a WhatsApp');
        
        redirectToWhatsAppPayment({
            ...orderData,
            total: total,
            error_backup: true
        });
        
    } finally {
        payBtn.disabled = false;
        payBtn.textContent = originalText;
        payBtn.style.opacity = '1';
    }
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
    
    console.log('🔗 Abriendo WhatsApp...');
    window.open(whatsappURL, '_blank');
}

function showSuccessMessage(issueNumber) {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✅</div>
            <h2>¡Pedido Enviado!</h2>
            <p>Tu pedido #${issueNumber || 'XXX'} ha sido procesado</p>
            <p>Redirigiendo a WhatsApp para el pago...</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        clearCart();
        overlay.remove();
    }, 4000);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('📧 Por favor ingresa un email válido');
        document.getElementById('customerEmail').focus();
        return false;
    }

    return true;
}

function clearCart() {
    console.log('🧹 Limpiando carrito...');
    cart = [];
    updateCartDisplay();
    
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNotes').value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 La Mona Piqueteadero - Sistema con GitHub Issues iniciado');
    
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