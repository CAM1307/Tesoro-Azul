document.addEventListener('DOMContentLoaded', function() {
    const API = {
        baseUrl: 'https://api.tesoroazul.com',
        
        async getProducts() {
            try {
                const response = await fetch(`${this.baseUrl}/products`);
                return await response.json();
            } catch (error) {
                console.error('Error al obtener productos:', error);
                return [];
            }
        },

        async saveOrder(orderData) {
            try {
                const response = await fetch(`${this.baseUrl}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                return await response.json();
            } catch (error) {
                console.error('Error al guardar orden:', error);
                throw error;
            }
        }
    };

    const Storage = {
        saveCart(cart) {
            localStorage.setItem('carrito', JSON.stringify(cart));
        },

        getCart() {
            const cart = localStorage.getItem('carrito');
            return cart ? JSON.parse(cart) : [];
        },

        clearCart() {
            localStorage.removeItem('carrito');
        }
    };

    let carrito = Storage.getCart();
    let contadorCarrito = document.getElementById('carrito-contador');
    actualizarContadorCarrito();

    // Funcionalidad para botones de compra
    const botonesComprar = document.querySelectorAll('.card .btn-primary');
    botonesComprar.forEach(boton => {
        boton.addEventListener('click', function(event) {
            event.preventDefault();
            
            const card = this.closest('.card');
            const producto = {
                titulo: card.querySelector('.card-title').textContent,
                precio: parseFloat(card.querySelector('.card-text.precio').textContent.replace('$', '')),
                cantidad: 1
            };
            
            agregarAlCarrito(producto);
        });
    });

    function agregarAlCarrito(producto) {
        const itemExistente = carrito.find(item => item.titulo === producto.titulo);
        
        if (itemExistente) {
            itemExistente.cantidad++;
        } else {
            carrito.push(producto);
        }
        
        Storage.saveCart(carrito);
        actualizarContadorCarrito();
        mostrarNotificacion(`${producto.titulo} añadido al carrito`);
    }

    function mostrarNotificacion(mensaje) {
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion';
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);
        setTimeout(() => notificacion.remove(), 3000);
    }

    function actualizarContadorCarrito() {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        contadorCarrito.textContent = totalItems;
    }

    // Funcionalidad del botón del carrito
    const carritoBtn = document.getElementById('carrito-btn');
    if (carritoBtn) {
        carritoBtn.addEventListener('click', function(event) {
            event.preventDefault();
            mostrarCarrito();
        });
    }

    function mostrarCarrito() {
        const carritoModal = document.getElementById('carrito-modal');
        const listaCarrito = document.getElementById('lista-carrito');
        const totalCarrito = document.getElementById('total-carrito');

        listaCarrito.innerHTML = '';
        let total = 0;

        carrito.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${item.titulo} - Cantidad: ${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}
                <button onclick="eliminarDelCarrito(${index})">Eliminar</button>
            `;
            listaCarrito.appendChild(li);
            total += item.precio * item.cantidad;
        });

        totalCarrito.textContent = `$${total.toFixed(2)}`;
        carritoModal.style.display = 'flex';
    }

    function eliminarDelCarrito(index) {
        carrito.splice(index, 1);
        Storage.saveCart(carrito);
        actualizarContadorCarrito();
        mostrarCarrito();
    }

    // Integración con Stripe
    const stripe = Stripe('TU_CLAVE_PUBLICA_DE_STRIPE');

    document.getElementById('pagar').addEventListener('click', async function() {
        try {
            const response = await fetch(`${API.baseUrl}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ carrito })
            });

            const session = await response.json();
            const result = await stripe.redirectToCheckout({ sessionId: session.id });

            if (result.error) {
                alert(result.error.message);
            }
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            alert('Hubo un error al procesar el pago. Por favor, intenta nuevamente.');
        }
    });
});