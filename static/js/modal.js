document.getElementById('anioActual').textContent = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', function () {


    const modalPrivacidad =
        document.getElementById('modalPrivacidad');

    const modalTerminos =
        document.getElementById('modalTerminos');

    const btnAbrirPrivacidad =
        document.getElementById('abrirPrivacidad');

    const btnAbrirTerminos =
        document.getElementById('abrirTerminos');

    const cerrarPrivacidadBtn1 =
        document.getElementById('cerrarModalPrivacidadBtn');

    const cerrarPrivacidadBtn2 =
        document.getElementById('cerrarPrivacidadBtnFooter');

    const cerrarTerminosBtn1 =
        document.getElementById('cerrarModalTerminosBtn');

    const cerrarTerminosBtn2 =
        document.getElementById('cerrarTerminosBtnFooter');


    function abrirModal(modal) {

        if (modal) {

            modal.style.display = 'flex';

            document.body.style.overflow = 'hidden';
        }
    }

    function cerrarModal(modal) {

        if (modal) {

            modal.style.display = 'none';

            document.body.style.overflow = 'auto';
        }
    }


    if (btnAbrirPrivacidad) {

        btnAbrirPrivacidad.addEventListener('click', function (e) {

            e.preventDefault();

            abrirModal(modalPrivacidad);

        });
    }

    if (btnAbrirTerminos) {

        btnAbrirTerminos.addEventListener('click', function (e) {

            e.preventDefault();

            abrirModal(modalTerminos);

        });
    }

    if (cerrarPrivacidadBtn1) {

        cerrarPrivacidadBtn1.addEventListener('click', function () {

            cerrarModal(modalPrivacidad);

        });
    }

    if (cerrarPrivacidadBtn2) {

        cerrarPrivacidadBtn2.addEventListener('click', function () {

            cerrarModal(modalPrivacidad);

        });
    }

    if (cerrarTerminosBtn1) {

        cerrarTerminosBtn1.addEventListener('click', function () {

            cerrarModal(modalTerminos);

        });
    }

    if (cerrarTerminosBtn2) {

        cerrarTerminosBtn2.addEventListener('click', function () {

            cerrarModal(modalTerminos);

        });
    }

    window.addEventListener('click', function (event) {

        if (event.target === modalPrivacidad) {

            cerrarModal(modalPrivacidad);
        }

        if (event.target === modalTerminos) {

            cerrarModal(modalTerminos);
        }

    });



    document.addEventListener('keydown', function (e) {

        if (e.key === 'Escape') {

            if (modalPrivacidad &&
                modalPrivacidad.style.display === 'flex') {

                cerrarModal(modalPrivacidad);
            }

            if (modalTerminos &&
                modalTerminos.style.display === 'flex') {

                cerrarModal(modalTerminos);
            }
        }

    });

});