
function mostrar(seccion) {
    // Ocultar todas
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('productos').style.display = 'none';
    document.getElementById('inventario').style.display = 'none';
    document.getElementById('ventas').style.display = 'none';
    document.getElementById(seccion).style.display = 'block';
    localStorage.setItem('seccionActual', seccion);
}

function cambiarSeccion(seccion) {
    mostrar(seccion);

    const url = window.location.pathname + '?seccion=' + seccion;
    window.history.pushState({ seccion: seccion }, '', url);
}

document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    let seccion = params.get('seccion');

    if (!seccion) {
        seccion = localStorage.getItem('seccionActual');
    }
    if (!seccion) {
        seccion = 'dashboard';
    }
    mostrar(seccion);
});

document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.sidebar a');

    links.forEach(function (link) {
        link.onclick = function (e) {
            e.preventDefault();

            let seccion = '';
            const texto = this.innerText.toLowerCase();
            if (texto.includes('dashboard')) seccion = 'dashboard';
            else if (texto.includes('producto')) seccion = 'productos';
            else if (texto.includes('inventario')) seccion = 'inventario';
            else if (texto.includes('venta')) seccion = 'ventas';
            if (seccion) {
                cambiarSeccion(seccion);
            }
        };
    });
});
window.onpopstate = function () {
    const params = new URLSearchParams(window.location.search);
    const seccion = params.get('seccion');
    if (seccion) {
        mostrar(seccion);
    }
};

function confirmarEliminar() {
    return confirm("¿Seguro que deseas eliminar este producto?");
}
function eliminarProducto(id) {
    fetch(`/api/productos/${id}`, {
        method: "DELETE"
    })
        .then(res => res.json())
        .then(data => {
            alert(data.msg);
            location.reload();
        });
}
function actualizarProducto(id) {
    fetch(`/api/productos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: document.getElementById("nombre").value,
            precio: document.getElementById("precio").value,
            stock: document.getElementById("stock").value
        })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.msg);
            location.reload();
        });
}



document.addEventListener("change", e => {
    if (e.target.matches("select")) calcularTotal();
});

document.addEventListener("input", e => {
    if (e.target.name === "cantidad[]") calcularTotal();
    if (e.target.id === "pago") calcularCambio();
});

function mostrar(seccion) {
    document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none');
    document.getElementById(seccion).style.display = 'block';
}

document.getElementById("buscarInventario").addEventListener("keyup", function () {
    let filtro = this.value.toLowerCase();
    let filas = document.querySelectorAll("#inventario tbody tr");

    filas.forEach(function (fila) {
        let id = fila.children[0].textContent.toLowerCase();

        if (id.includes(filtro)) {
            fila.style.display = "";
        } else {
            fila.style.display = "none";
        }
    });
});

function buscarProductoPorId() {
    let filtro = document.getElementById('buscadorId').value.trim().toLowerCase();
    let cards = document.querySelectorAll('#productosGrid .producto-card');
    let mensajeNoEncontrado = document.getElementById('mensajeNoEncontrado');
    let idBuscadoSpan = document.getElementById('idBuscado');

    // Ocultar mensaje inicialmente
    if (mensajeNoEncontrado) {
        mensajeNoEncontrado.style.display = 'none';
    }

    // Si el campo está vacío, mostrar todos los productos
    if (filtro === '') {
        cards.forEach(card => {
            card.style.display = '';
        });
        return;
    }

    let encontrado = false;

    cards.forEach(card => {
        // Extraer solo el ID del producto
        let idTexto = '';

        // Buscar el texto que contiene "ID:"
        const textoCompleto = card.innerText;
        const match = textoCompleto.match(/ID:\s*(\S+)/i);
        if (match) {
            idTexto = match[1].toLowerCase();
        }

        // También verificar atributo data-producto-id
        const dataId = card.getAttribute('data-producto-id');
        if (dataId && dataId.toLowerCase() === filtro) {
            idTexto = dataId.toLowerCase();
        }

        // Comparar si el ID coincide exactamente o contiene el filtro
        if (idTexto === filtro || idTexto.includes(filtro)) {
            card.style.display = '';
            encontrado = true;
            // Resaltar el producto encontrado
            card.style.transition = 'all 0.3s';
            card.style.boxShadow = '0 0 0 2px #0d6efd';
            setTimeout(() => {
                card.style.boxShadow = '';
            }, 1500);
        } else {
            card.style.display = 'none';
        }
    });

    // Mostrar mensaje si no se encontró ningún producto
    if (mensajeNoEncontrado && idBuscadoSpan) {
        if (!encontrado) {
            idBuscadoSpan.textContent = document.getElementById('buscadorId').value;
            mensajeNoEncontrado.style.display = 'block';
        } else {
            mensajeNoEncontrado.style.display = 'none';
        }
    }
}

//INVENTARIO
function buscarInventarioPorId() {

    let filtro = document.getElementById('buscarInventario')
        .value
        .trim()
        .toLowerCase();

    let cards = document.querySelectorAll('#gridInventario .producto-card');

    let mensajeNoEncontrado =
        document.getElementById('mensajeNoEncontradoInventario');

    let idBuscadoSpan =
        document.getElementById('idBuscadoInventario');

    // Ocultar mensaje inicialmente
    if (mensajeNoEncontrado) {
        mensajeNoEncontrado.style.display = 'none';
    }

    // Si está vacío mostrar todos
    if (filtro === '') {

        cards.forEach(card => {
            card.style.display = '';
        });

        return;
    }

    let encontrado = false;

    cards.forEach(card => {

        let idTexto = '';

        // Buscar ID en el texto
        const textoCompleto = card.innerText;

        const match = textoCompleto.match(/ID:\s*(\S+)/i);

        if (match) {
            idTexto = match[1].toLowerCase();
        }

        // Buscar también en data-producto-id
        const dataId = card.getAttribute('data-producto-id');

        if (dataId) {
            idTexto = dataId.toLowerCase();
        }

        // Comparar
        if (idTexto.includes(filtro)) {

            card.style.display = '';

            encontrado = true;

            // Resaltar
            card.style.transition = '0.3s';
            card.style.boxShadow = '0 0 10px #198754';

            setTimeout(() => {
                card.style.boxShadow = '';
            }, 1500);

        } else {

            card.style.display = 'none';
        }
    });

    // Mostrar mensaje si no existe
    if (!encontrado) {

        idBuscadoSpan.textContent =
            document.getElementById('buscarInventario').value;

        mensajeNoEncontrado.style.display = 'block';

    } else {

        mensajeNoEncontrado.style.display = 'none';
    }
}



// Buscar al presionar Enter
document.addEventListener('DOMContentLoaded', function () {
    const buscador = document.getElementById('buscadorId');
    if (buscador) {
        buscador.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                buscarProductoPorId();
            }
        });
    }
});




function toggleConfig(event) {
    event.preventDefault();
    const submenu = document.getElementById('config-submenu');
    const toggle = document.querySelector('.config-toggle');
    submenu.classList.toggle('open');
    toggle.classList.toggle('active');
}

// Abrir automáticamente si la URL es de configuración
const seccion = new URLSearchParams(window.location.search).get('seccion');
if (['usuarios', 'perfil', 'ajustes'].includes(seccion)) {
    document.getElementById('config-submenu').classList.add('open');
    document.querySelector('.config-toggle').classList.add('active');
}

function toggleCategoria() {
    var tipo = document.getElementById('tipoProducto').value;
    var campoCategoria = document.getElementById('campo-categoria');

    if (tipo === 'materia_prima') {
        campoCategoria.style.display = 'none';
    } else {
        campoCategoria.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    toggleCategoria();
});

document.addEventListener('DOMContentLoaded', function () {
    let buscador = document.getElementById('buscarInventario');
    if (buscador) {
        buscador.addEventListener('keyup', function () {
            let filtro = this.value.toLowerCase();
            let cards = document.querySelectorAll('#gridInventario .producto-card');
            cards.forEach(card => {
                let texto = card.innerText.toLowerCase();
                card.style.display = texto.includes(filtro) ? '' : 'none';
            });
        });
    }
});

let contadorProductos = 1;
function buscarPorId(input, index) {
    const idBuscado = input.value.trim().toUpperCase();
    const select = document.querySelector(`.select-producto[data-index="${index}"]`);
    if (!select) return;

    // Si el ID está vacío, limpiar todo
    if (idBuscado.length === 0) {
        select.value = "";

        // Limpiar la imagen
        const imgElement = document.querySelector(`#imagenProducto${index} img`);
        if (imgElement) {
            imgElement.src = "https://via.placeholder.com/80x80?text=Sin+imagen";
        }

        actualizarPrecio(index);
        return;
    }
    const opciones = select.options;
    let encontrado = false;

    for (let i = 0; i < opciones.length; i++) {
        if (opciones[i].value && opciones[i].value.toUpperCase() === idBuscado) {
            select.value = opciones[i].value;
            encontrado = true;

            // Mostrar imagen
            const imagen = opciones[i].getAttribute('data-imagen');
            const imgElement = document.querySelector(`#imagenProducto${index} img`);
            if (imgElement) {
                if (imagen && imagen !== '' && imagen !== 'null') {
                    imgElement.src = `/static/uploads/${imagen}`;
                    imgElement.onerror = function () {
                        this.src = 'https://via.placeholder.com/80x80?text=Error';
                    };
                } else {
                    imgElement.src = 'https://via.placeholder.com/80x80?text=NO+IMAGEN';
                }
            }

            actualizarPrecio(index);
            break;
        }
    }

    if (!encontrado && idBuscado.length > 0) {
        select.value = "";
        const imgElement = document.querySelector(`#imagenProducto${index} img`);
        if (imgElement) {
            imgElement.src = "https://via.placeholder.com/80x80?text=No+encontrado";
        }
        input.classList.add('is-invalid');
        setTimeout(() => input.classList.remove('is-invalid'), 1500);
    }
}

function actualizarPrecio(index) {
    calcularTotalGeneral();
}

function calcularTotalGeneral() {
    let total = 0;

    // Recorrer todos los selects
    const selects = document.querySelectorAll('.select-producto');
    const cantidades = document.querySelectorAll('.cantidad-input');

    for (let i = 0; i < selects.length; i++) {
        const select = selects[i];
        const cantidad = cantidades[i];

        if (select && select.value && cantidad && cantidad.value) {
            const precio = parseFloat(select.options[select.selectedIndex].getAttribute('data-precio'));
            const cant = parseFloat(cantidad.value);
            if (!isNaN(precio) && !isNaN(cant) && cant > 0) {
                total += precio * cant;
            }
        }
    }

    const totalInput = document.getElementById('total');
    if (totalInput) totalInput.value = total.toFixed(2);
    calcularCambio();
}
function calcularCambio() {
    const total = parseFloat(document.getElementById('total')?.value) || 0;
    const pago = parseFloat(document.getElementById('pago')?.value) || 0;
    const cambio = pago - total;
    const cambioInput = document.getElementById('cambio');
    if (cambioInput) cambioInput.value = cambio >= 0 ? cambio.toFixed(2) : '0.00';
}

function validarVenta() {
    let tieneProductos = false;
    let stockValido = true;
    let errores = [];
    const selects = document.querySelectorAll('.select-producto');
    const cantidades = document.querySelectorAll('.cantidad-input');
    for (let i = 0; i < selects.length; i++) {
        const select = selects[i];
        const cantidad = cantidades[i];
        if (select && select.value) {
            tieneProductos = true;
            const option = select.options[select.selectedIndex];
            const stock = parseInt(option.getAttribute('data-stock'));
            const nombre = option.getAttribute('data-nombre');
            const cant = parseInt(cantidad?.value);

            if (!cant || cant <= 0) {
                errores.push(` Cantidad inválida para ${nombre}`);
                stockValido = false;
            } else if (cant > stock) {
                errores.push(` Stock insuficiente para ${nombre}. Disponible: ${stock}`);
                stockValido = false;
            }
        }
    }
    if (!tieneProductos) {
        alert(' Seleccione al menos un producto');
        return;
    }
    if (!stockValido) {
        alert(errores.join('\n'));
        return;
    }
    const total = parseFloat(document.getElementById('total')?.value) || 0;
    const pago = parseFloat(document.getElementById('pago')?.value) || 0;
    if (!pago || pago < total) {
        alert(' El pago es insuficiente');
        return;
    }
    if (confirm('¿Confirmar venta?')) {
        document.getElementById('ventaForm').submit();
    }
}
document.addEventListener('DOMContentLoaded', function () {
    // Calcular total inicial
    calcularTotalGeneral();
    const pagoInput = document.getElementById('pago');
    if (pagoInput) {
        pagoInput.addEventListener('input', calcularCambio);
    }
});
function agregarProducto() {
    console.log('agregarProducto() ejecutado'); // Para debug
    let nuevoNumero = document.querySelectorAll('#productos-container .card').length + 2;
    const container = document.getElementById('productos-container');
    const selectOriginal = document.querySelector('.select-producto');
    if (!selectOriginal) {
        console.error('No se encontró el select original');
        alert('Error: No se pudieron cargar los productos');
        return;
    }
    let opciones = '<option value="">Seleccione producto</option>';
    for (let i = 0; i < selectOriginal.options.length; i++) {
        const opt = selectOriginal.options[i];
        if (opt.value) { // Solo opciones con valor
            opciones += `
                <option value="${opt.value}" 
                        data-precio="${opt.getAttribute('data-precio') || ''}"
                        data-stock="${opt.getAttribute('data-stock') || ''}"
                        data-nombre="${opt.getAttribute('data-nombre') || opt.text}"
                        data-imagen="${opt.getAttribute('data-imagen') || ''}">
                    ${opt.text}
                </option>
            `;
        }
    }
    const nuevaFila = document.createElement('div');
    nuevaFila.className = 'row g-3 mb-3 align-items-end';
    nuevaFila.id = `productoRow${nuevoNumero}`;
    nuevaFila.innerHTML = `
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
            <h6 class="fw-bold mb-0 text-white">
                Producto ${nuevoNumero}
            </h6>
            <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="eliminarProducto(this)">
                <i class="bi bi-trash"></i> Quitar
            </button>
        </div>
        <div class="card-body bg-white rounded-bottom">
            <div class="row g-3 align-items-center">
                    
                <div class="col-md-3">
                    <label class="form-label fw-bold">ID Producto</label>
                    <input type="text" class="form-control input-id" 
                        placeholder="Ej: A3"
                        oninput="buscarPorId(this, ${nuevoNumero})">
                </div>
                <div class="col-md-3">
                    <label class="form-label fw-bold">Producto</label>
                    <select name="producto_id[]" class="form-select select-producto"
                            data-index="${nuevoNumero}" 
                            onchange="actualizarPrecio(${nuevoNumero})" required>
                        ${opciones}
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label fw-bold">Cantidad</label>
                    <input name="cantidad[]" min="1" type="number"
                        class="form-control cantidad-input" 
                        data-index="${nuevoNumero}"
                        placeholder="Ej: 2" 
                        required oninput="calcularTotalGeneral()">
                </div>
                <div class="col-md-3">
                    <div id="imagenProducto${nuevoNumero}" class="text-center">
                        <img src="https://via.placeholder.com/80x80?text=Sin+imagen"
                            style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;">
                    </div>
                </div>
                <div class="col-md-12 mt-2">
                    <button type="button" class="btn btn-danger btn-sm" onclick="eliminarFilaProducto(this)">
                         Eliminar
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
    container.appendChild(nuevaFila);
}





function eliminarFilaProducto(boton) {
    const fila = boton.closest('.row');
    const totalFilas = document.querySelectorAll('#productos-container .row').length;
    if (totalFilas > 1) {
        fila.remove();
        renumerarProductos(); //  LLAMADA CLAVE
        calcularTotalGeneral();
    } else {
        alert('Debe haber al menos un producto en la venta');
    }
}
function eliminarProducto(boton) {
    const fila = boton.closest('.row');
    const totalFilas = document.querySelectorAll('#productos-container .row').length;
    if (totalFilas > 1) {
        fila.remove();
        renumerarProductos(); // 
        calcularTotalGeneral();
    } else {
        alert('Debe haber al menos un producto en la venta');
    }
}
function renumerarProductos() {
    const productos = document.querySelectorAll('#productos-container .row');
    productos.forEach((producto, index) => {
        const nuevoNumero = index + 1;
        producto.id = `productoRow${nuevoNumero}`;
        // Actualizar el texto del header (Producto X)
        const header = producto.querySelector('.card-header h6');
        if (header) {
            header.textContent = `Producto ${nuevoNumero}`;
        }
        const selectProducto = producto.querySelector('.select-producto');
        if (selectProducto) {
            selectProducto.setAttribute('data-index', nuevoNumero);
            selectProducto.setAttribute('onchange', `actualizarPrecio(${nuevoNumero})`);
        }
        const cantidadInput = producto.querySelector('.cantidad-input');
        if (cantidadInput) {
            cantidadInput.setAttribute('data-index', nuevoNumero);
        }
        const imagenDiv = producto.querySelector('[id^="imagenProducto"]');
        if (imagenDiv) {
            imagenDiv.id = `imagenProducto${nuevoNumero}`;
        }
        const inputId = producto.querySelector('.input-id');
        if (inputId) {
            inputId.setAttribute('oninput', `buscarPorId(this, ${nuevoNumero})`);
        }
    });
    console.log('Renumeración completada. Total productos:', productos.length);
}
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    const overlay = document.getElementById('overlay');
    let isCollapsed = false;
    function toggleMenu() {
        if (window.innerWidth > 768) {
            // Escritorio: contraer/expandir
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
                toggleBtn.classList.add('menu-shifted');
            } else {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
                toggleBtn.classList.remove('menu-shifted');
            }
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        } else {
            // Móvil: abrir/cerrar overlay
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
        }
    }
    toggleBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', function () {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    });
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true' && window.innerWidth > 768) {
        isCollapsed = true;
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        toggleBtn.classList.add('menu-shifted');
    }
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        }
    });
});


function mostrarNuevaVenta() {
    document.getElementById('formularioVenta').style.display = 'block';
    document.getElementById('historialVenta').style.display = 'none';
    document.getElementById('btnNuevaVenta').classList.remove('btn-outline-dark');
    document.getElementById('btnNuevaVenta').classList.add('btn-dark');
    document.getElementById('btnHistorialVentas').classList.remove('btn-dark');
    document.getElementById('btnHistorialVentas').classList.add('btn-outline-dark');
}
function mostrarHistorialVentas() {
    document.getElementById('formularioVenta').style.display = 'none';
    document.getElementById('historialVenta').style.display = 'block';
    document.getElementById('btnHistorialVentas').classList.remove('btn-outline-dark');
    document.getElementById('btnHistorialVentas').classList.add('btn-dark');
    document.getElementById('btnNuevaVenta').classList.remove('btn-dark');
    document.getElementById('btnNuevaVenta').classList.add('btn-outline-dark');

    if (typeof cargarVentas === 'function') {
        cargarVentas();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar Bootstrap tabs
    var triggerTabList = [].slice.call(document.querySelectorAll('#ventasTab button'));
    triggerTabList.forEach(function (triggerEl) {
        var tabTrigger = new bootstrap.Tab(triggerEl);
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();
        });
    });
});


sessionStorage.setItem('rol', '{{ session.get("rol", "") }}');
sessionStorage.setItem('usuario', '{{ session.get("usuario", "") }}');
function cargarVentas() {
    fetch('/api/ventas')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tbodyVentas');

            // Actualizar resumen
            let totalVentas = 0;
            data.forEach(v => totalVentas += v.total);
            document.getElementById('totalVentasLabel').innerHTML = `Total: $${totalVentas.toFixed(2)}`;
            document.getElementById('cantidadVentasLabel').innerHTML = `N° Ventas: ${data.length}`;

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center"> No hay ventas registradas</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(v => `
                    <tr style="text-align: center;">
                        <td>${v.id}</td>
                        <td>${v.fecha}</td>
                        <td>${v.hora}</td>
                        <td class="text-success fw-bold">$${v.total.toFixed(2)}</td>
                        <td>$${v.pago.toFixed(2)}</td>
                        <td>$${v.cambio.toFixed(2)}</td>
                        <td>${v.vendedor}</td>
                        <td>
                        <a href="/eliminar_venta/${v.id}"
                        class="btn btn-danger btn-sm"
                        onclick=" return confirm(
                            '¿Eliminar venta?')">
                         Eliminar </a>

                        </td>
                    </tr>
                `).join('');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('tbodyVentas').innerHTML = '<tr><td colspan="8" class="text-center text-danger"> Error al cargar ventas</td></tr>';
        });
}
function filtrarVentasPorFecha() {
    const fecha = document.getElementById('filtroFecha').value;
    const filas = document.querySelectorAll('#tablaVentas tbody tr');

    filas.forEach(fila => {
        if (fila.cells && fecha) {
            const fechaFila = fila.cells[1]?.textContent;
            fila.style.display = fechaFila === fecha ? '' : 'none';
        } else if (!fecha) {
            fila.style.display = '';
        }
    });
}
function exportarExcelVentas() {
    window.location.href = '/exportar_ventas_excel';
}


document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('anioActual').textContent =
        new Date().getFullYear();

});

