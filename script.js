// Configuración del webhook de n8n
// ⚠️ IMPORTANTE: Reemplaza esta URL con tu webhook real de n8n
const WEBHOOK_URL = 'https://comidagourmet92302.app.n8n.cloud/webhook/recibir-pedido';

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
        alert('🛒 Tu carrito está vacío\n\nAgrega algunos productos antes de enviar tu pedido.');
        return;
    }

    // Obtener información del cliente
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail') ? document.getElementById('customerEmail').value.trim() : '';
    const customerAddress = document.getElementById('customerAddress').value.trim();
    const customerNotes = document.getElementById('customerNotes').value.trim();

    // Validaciones básicas del lado del cliente
    if (!customerName) {
        alert('📝 Por favor ingresa tu nombre completo');
        document.getElementById('customerName').focus();
        return;
    }

    if (!customerPhone) {
        alert('📱 Por favor ingresa tu número de teléfono');
        document.getElementById('customerPhone').focus();
        return;
    }

    // Validación básica de teléfono colombiano
    const phoneRegex = /^(\+57|57)?[3][0-9]{9}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
        const confirmPhone = confirm('⚠️ El número de teléfono puede no ser válido para Colombia.\n\n¿Deseas continuar de todas formas?');
        if (!confirmPhone) {
            document.getElementById('customerPhone').focus();
            return;
        }
    }

    // Calcular total
    const total = cart.reduce((sum, item) => sum + item.total, 0);

    // Preparar datos para n8n - FORMATO ACTUALIZADO
    const orderData = {
        cliente_nombre: customerName,
        cliente_telefono: customerPhone,
        cliente_email: customerEmail || undefined,
        cliente_direccion: customerAddress || 'Dirección no especificada',
        items: cart.map(item => ({
            nombre: item.producto,
            cantidad: item.cantidad,
            precio: item.precio
        })),
        notas: customerNotes || 'Sin notas especiales'
    };

    // Deshabilitar botón mientras se procesa
    const sendBtn = document.getElementById('sendOrder');
    const originalBtnText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = '📤 Procesando pedido...';
    sendBtn.style.opacity = '0.6';

    console.log('🚀 Enviando pedido a n8n:', orderData);

    // Enviar a n8n (webhook)
    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        console.log('📡 Respuesta del servidor:', response.status);
        
        // Intentar parsear la respuesta como JSON
        if (response.headers.get('content-type')?.includes('application/json')) {
            return response.json();
        } else {
            // Si no es JSON, crear respuesta básica
            if (response.ok) {
                return { 
                    success: true, 
                    message: 'Pedido procesado correctamente',
                    pedido_id: `PED-${Date.now()}`,
                    total_pedido: total
                };
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        }
    })
    .then(data => {
        console.log('📦 Datos recibidos:', data);
        
        if (data.success) {
            // ✅ ÉXITO - Pedido procesado correctamente
            console.log('✅ Pedido procesado exitosamente:', data);
            
            // Crear mensaje de éxito
            let successMessage = `🎉 ¡Pedido procesado exitosamente!\n\n`;
            
            if (data.pedido_id) {
                successMessage += `📋 Número de pedido: ${data.pedido_id}\n`;
            }
            
            successMessage += `💰 Total: $${(data.total_pedido || total).toLocaleString()} COP\n\n`;
            successMessage += `📱 Te redirigiremos a WhatsApp para confirmar tu pedido.`;
            
            alert(successMessage);
            
            // Mostrar advertencias si existen (no bloquean el proceso)
            if (data.warnings && data.warnings.length > 0) {
                console.warn('⚠️ Advertencias encontradas:', data.warnings);
                
                const warningMessage = `⚠️ Algunas advertencias (no afectan tu pedido):\n\n` + 
                                     data.warnings.map(w => `• ${w}`).join('\n') +
                                     `\n\n¿Continuar con WhatsApp?`;
                
                if (!confirm(warningMessage)) {
                    return; // No continuar si el usuario cancela
                }
            }
            
            // Generar mensaje para WhatsApp con datos actualizados
            const whatsappData = {
                nombre_cliente: customerName,
                telefono: customerPhone,
                direccion: customerAddress,
                notas: customerNotes,
                pedido: cart,
                total: data.total_pedido || total,
                pedido_id: data.pedido_id,
                fecha: new Date().toISOString()
            };
            
            generateWhatsAppMessage(whatsappData);
            
        } else {
            // ❌ ERROR DE VALIDACIÓN - El servidor encontró problemas
            console.error('❌ Errores de validación:', data);
            
            let errorMessage = `❌ Se encontraron problemas en tu pedido:\n\n`;
            
            // Mostrar errores críticos
            if (data.errors && data.errors.length > 0) {
                errorMessage += `🚫 Errores que debes corregir:\n`;
                data.errors.forEach(error => {
                    errorMessage += `• ${error}\n`;
                });
                errorMessage += '\n';
            }
            
            // Mostrar advertencias
            if (data.warnings && data.warnings.length > 0) {
                errorMessage += `⚠️ Advertencias:\n`;
                data.warnings.forEach(warning => {
                    errorMessage += `• ${warning}\n`;
                });
                errorMessage += '\n';
            }
            
            errorMessage += `Por favor revisa la información y vuelve a intentar.\n\n`;
            errorMessage += `💡 Si el problema persiste, puedes contactarnos por WhatsApp directamente.`;
            
            alert(errorMessage);
            
            // No limpiar el carrito para que puedan corregir los errores
        }
    })
    .catch(error => {
        // ❌ ERROR DE CONEXIÓN - Problemas de red o servidor
        console.error('❌ Error de conexión:', error);
        
        let connectionError = `🔌 Error de conexión con nuestro servidor\n\n`;
        connectionError += `No pudimos procesar tu pedido automáticamente, pero no te preocupes:\n\n`;
        connectionError += `✅ Te redirigiremos a WhatsApp para completar tu pedido manualmente\n`;
        connectionError += `✅ Nuestro equipo te atenderá personalmente\n\n`;
        connectionError += `Detalles del error: ${error.message}`;
        
        alert(connectionError);
        
        // Como respaldo, generar mensaje para WhatsApp
        const backupData = {
            nombre_cliente: customerName,
            telefono: customerPhone,
            direccion: customerAddress,
            notas: customerNotes,
            pedido: cart,
            total: total,
            fecha: new Date().toISOString(),
            error_backup: true
        };
        
        generateWhatsAppMessage(backupData);
    })
    .finally(() => {
        // Siempre restaurar el botón al estado original
        sendBtn.disabled = false;
        sendBtn.textContent = originalBtnText;
        sendBtn.style.opacity = '1';
    });
}

function generateWhatsAppMessage(orderData) {
    console.log('📱 Generando mensaje de WhatsApp:', orderData);
    
    // Generar mensaje formateado para WhatsApp
    let mensaje = `🍽️ *NUEVO PEDIDO - LA MONA PIQUETEADERO*\n\n`;
    
    // Información del pedido
    if (orderData.pedido_id) {
        mensaje += `📋 *Pedido:* ${orderData.pedido_id}\n`;
    }
    
    mensaje += `👤 *Cliente:* ${orderData.nombre_cliente}\n`;
    mensaje += `📱 *Teléfono:* ${orderData.telefono}\n`;
    
    if (orderData.direccion && orderData.direccion !== 'Dirección no especificada') {
        mensaje += `📍 *Dirección:* ${orderData.direccion}\n`;
    }
    
    mensaje += `\n🛒 *PRODUCTOS PEDIDOS:*\n`;
    
    // Listar productos
    orderData.pedido.forEach(item => {
        const itemTotal = item.cantidad * item.precio;
        mensaje += `• ${item.cantidad}x ${item.producto}\n`;
        mensaje += `  $${item.precio.toLocaleString()} c/u = $${itemTotal.toLocaleString()}\n`;
    });
    
    mensaje += `\n💰 *TOTAL: $${orderData.total.toLocaleString()} COP*\n`;
    
    if (orderData.notas && orderData.notas !== 'Sin notas especiales') {
        mensaje += `\n📝 *Notas especiales:* ${orderData.notas}\n`;
    }
    
    // Agregar timestamp
    mensaje += `\n⏰ *Pedido realizado:* ${new Date().toLocaleString('es-CO')}\n`;
    
    // Si fue un error de backup, mencionarlo
    if (orderData.error_backup) {
        mensaje += `\n⚠️ *Nota:* Este pedido se envía por WhatsApp debido a un problema técnico temporal.\n`;
    }
    
    mensaje += `\n🙏 ¡Gracias por preferirnos!`;

    // Crear URL de WhatsApp
    const phoneNumber = '573213700248'; // ⚠️ ACTUALIZA CON TU NÚMERO REAL
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}`;
    
    console.log('🔗 URL de WhatsApp generada:', whatsappURL);
    
    // Abrir WhatsApp en una nueva pestaña
    const whatsappWindow = window.open(whatsappURL, '_blank');
    
    // Verificar si se pudo abrir la ventana
    if (!whatsappWindow) {
        alert('❌ No se pudo abrir WhatsApp automáticamente.\n\nPor favor copia el mensaje y contáctanos manualmente:\n\n' + mensaje);
        
        // Como alternativa, copiar al clipboard si está disponible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(mensaje).then(() => {
                alert('📋 Mensaje copiado al portapapeles');
            });
        }
    } else {
        // Mostrar mensaje de confirmación
        setTimeout(() => {
            alert('📱 Te hemos redirigido a WhatsApp para completar tu pedido.\n\n✅ Si no se abrió automáticamente, revisa si tienes bloqueadas las ventanas emergentes.');
        }, 1000);
    }
    
    // Limpiar carrito después del envío exitoso
    if (!orderData.error_backup) {
        setTimeout(() => {
            clearCart();
        }, 2000);
    }
}

function clearCart() {
    console.log('🧹 Limpiando carrito...');
    
    cart = [];
    updateCartDisplay();
    
    // Limpiar formulario
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    if (document.getElementById('customerEmail')) {
        document.getElementById('customerEmail').value = '';
    }
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNotes').value = '';
    
    // Hacer scroll al inicio suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ Carrito limpiado exitosamente');
}

// Funciones de utilidad para formato
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Validación de teléfono colombiano mejorada
function validateColombianPhone(phone) {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(\+57|57)?[3][0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
}

// Event listeners cuando la página se carga
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 La Mona Piqueteadero - Sistema iniciado');
    
    // Validación en tiempo real del teléfono
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            const phone = this.value.replace(/\s/g, '');
            if (phone && !validateColombianPhone(phone)) {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 5px rgba(220, 53, 69, 0.3)';
            } else {
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 5px rgba(40, 167, 69, 0.3)';
            }
        });
    }
    
    // Validación en tiempo real del nombre
    const nameInput = document.getElementById('customerName');
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            const name = this.value.trim();
            if (name.length < 2) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    }
    
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
    
    // Inicializar carrito vacío
    updateCartDisplay();
});

// Manejo de errores globales
window.addEventListener('error', function(event) {
    console.error('❌ Error global capturado:', event.error);
});

// Manejo de promesas rechazadas
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promesa rechazada:', event.reason);
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