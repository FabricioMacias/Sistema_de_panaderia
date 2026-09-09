
// Control de navegación entre secciones
let seccionActual = '{{ seccion if seccion else "dashboard" }}';

// Obtener el rol desde el servidor
let rol = '{{ rol }}';

// Lógica en JavaScript puro
if (rol === 'operativo' && seccionActual === 'dashboard') {
    seccionActual = 'productos';
}

function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(sec => {
        sec.classList.remove('active');
    });
    // Mostrar la sección seleccionada
    const activeSec = document.getElementById(seccion);
    if (activeSec) {
        activeSec.classList.add('active');
    }
}

// Mostrar la sección inicial
mostrarSeccion(seccionActual);
