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
        cartTotal.innerHTML = `Total: ${total.toLocaleString()} COP`;
        cartTotal.style.display = 'block';
        customerInfo.style.display = 'grid';
        sendOrderBtn.style.display = 'block';
        cartBadge.classList.remove('empty');
        cartBadge.textContent = totalItems;
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function scrollToCart() {
    if (cart.length > 0) {
        document.querySelector('.cart-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    } else {
        // Si no hay productos en el carrito, hacer scroll a los productos
        document.querySelector('.products-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

function sendOrder() {
    // Validar que hay productos en el carrito
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    // Obtener información del cliente
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    const customerNotes = document.getElementById('customerNotes').value.trim();

    // Validar campos obligatorios
    if (!customerName) {
        alert('Por favor ingresa tu nombre');
        document.getElementById('customerName').focus();
        return;
    }

    if (!customerPhone) {
        alert('Por favor ingresa tu número de teléfono');
        document.getElementById('customerPhone').focus();
        return;
    }

    // Calcular total
    const total = cart.reduce((sum, item) => sum + item.total, 0);

    // Preparar datos para n8n
    const orderData = {
        nombre_cliente: customerName,
        telefono: customerPhone,
        direccion: customerAddress || 'No especificada',
        notas: customerNotes || 'Sin notas especiales',
        pedido: cart,
        total: total,
        fecha: new Date().toISOString(),
        timestamp: Date.now()
    };

    // Deshabilitar botón mientras se procesa
    const sendBtn = document.getElementById('sendOrder');
    sendBtn.disabled = true;
    sendBtn.textContent = '📤 Enviando...';

    // 1️⃣ Enviar a n8n (webhook)
    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en el servidor');
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Pedido enviado exitosamente a n8n:', data);
        
        // 2️⃣ Generar mensaje para WhatsApp
        generateWhatsAppMessage(orderData);
        
    })
    .catch(error => {
        console.error('❌ Error al enviar a n8n:', error);
        
        // Si falla n8n, al menos enviar por WhatsApp
        alert('Hubo un problema con el sistema, pero te redirigiremos a WhatsApp para completar tu pedido.');
        generateWhatsAppMessage(orderData);
    })
    .finally(() => {
        // Restaurar botón
        sendBtn.disabled = false;
        sendBtn.textContent = '📱 Enviar Pedido por WhatsApp';
    });
}

function generateWhatsAppMessage(orderData) {
    // Generar mensaje formateado para WhatsApp
    let mensaje = `🍽️ *NUEVO PEDIDO - LA MONA PIQUETEADERO*\n\n`;
    mensaje += `👤 *Cliente:* ${orderData.nombre_cliente}\n`;
    mensaje += `📱 *Teléfono:* ${orderData.telefono}\n`;
    
    if (orderData.direccion && orderData.direccion !== 'No especificada') {
        mensaje += `📍 *Dirección:* ${orderData.direccion}\n`;
    }
    
    mensaje += `\n🛒 *PEDIDO:*\n`;
    
    orderData.pedido.forEach(item => {
        mensaje += `• ${item.cantidad}x ${item.producto} = ${item.total.toLocaleString()} COP\n`;
    });
    
    mensaje += `\n💰 *TOTAL: ${orderData.total.toLocaleString()} COP*\n`;
    
    if (orderData.notas && orderData.notas !== 'Sin notas especiales') {
        mensaje += `\n📝 *Notas:* ${orderData.notas}\n`;
    }
    
    mensaje += `\n⏰ Pedido realizado: ${new Date().toLocaleString('es-CO')}`;

    // Crear URL de WhatsApp
    const phoneNumber = '573000001234'; // Número de WhatsApp del negocio
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Mostrar mensaje de confirmación
    alert('🎉 ¡Pedido procesado! Te hemos redirigido a WhatsApp para completar tu orden.');
    
    // Limpiar carrito después del envío
    clearCart();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    
    // Limpiar formulario
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNotes').value = '';
    
    // Hacer scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Funciones de utilidad para formato
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Validación de teléfono colombiano
function validateColombianPhone(phone) {
    const phoneRegex = /^(\+57|57)?[3][0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Event listeners cuando la página se carga
document.addEventListener('DOMContentLoaded', function() {
    // Validación en tiempo real del teléfono
    const phoneInput = document.getElementById('customerPhone');
    phoneInput.addEventListener('input', function() {
        const phone = this.value.replace(/\s/g, '');
        if (phone && !validateColombianPhone(phone)) {
            this.style.borderColor = '#dc3545';
        } else {
            this.style.borderColor = '#ddd';
        }
    });
    
    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

/* 
=================================
INSTRUCCIONES PARA INTEGRAR N8N:
=================================

1. Crear un webhook en n8n:
   - Ve a tu instancia de n8n
   - Crea un nuevo workflow
   - Agrega un nodo "Webhook"
   - Copia la URL del webhook

2. Reemplazar la URL en este archivo:
   - Busca la línea: const WEBHOOK_URL = 'https://TU_WEBHOOK_N8N_AQUI.com/webhook/pedidos';
   - Reemplaza con tu URL real

3. Configurar el flujo en n8n:
   - El webhook recibirá un JSON con esta estructura:
   {
     "nombre_cliente": "Juan Pérez",
     "telefono": "+573001234567",
     "direccion": "Calle 123 #45-67",
     "notas": "Sin cebolla en la hamburguesa",
     "pedido": [
       {
         "producto": "Hamburguesa La Mona",
         "cantidad": 2,
         "precio": 15000,
         "total": 30000
       }
     ],
     "total": 30000,
     "fecha": "2024-01-15T10:30:00.000Z",
     "timestamp": 1705320600000
   }

4. Posibles acciones en n8n:
   - Guardar en base de datos
   - Enviar email de notificación
   - Integrar con sistema de inventario
   - Enviar notificación a Slack/Discord
   - Integrar con WhatsApp Business API
   - Generar factura automática

5. Respuesta esperada de n8n:
   - Status 200 para éxito
   - JSON con { "success": true, "message": "Pedido recibido" }

6. Testing:
   - Puedes probar el webhook usando herramientas como Postman
   - O simplemente hacer un pedido de prueba desde la página web
*/