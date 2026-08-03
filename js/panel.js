// ==========================================
// MÓDULO PANEL: TARJETA DE DETALLE Y ANIMACIÓN DE CÁMARA
// ==========================================

import { mapa, vistaInicial, limitesZonaRosa } from './map.js?v=49';
import { mostrarBurbujaFotos, ocultarBurbujaFotos } from './photos.js?v=49';
import { t, traducirCategoria, campoTraducido, currentLang } from './i18n.js?v=49';

/**
 * Obtiene el nombre del negocio en el idioma activo.
 * Si existe nombre_es y el idioma es español, lo usa.
 */
export function nombreTraducido(negocio) {
    if (currentLang === 'es' && negocio.nombre_es) {
        return negocio.nombre_es;
    }
    return negocio.nombre;
}

export function centrarVistaNegocio(negocio) {
    const zoom = 18;
    const ancho = mapa.getSize().x;
    const alto = mapa.getSize().y;

    const puntoNegocio = mapa.project(negocio.coordenadas, zoom);

    const anchoVentana = window.innerWidth || ancho;

    let desplazamientoX = 0;
    let desplazamientoY = 0;

    if (anchoVentana < 646) {
        // En anchos menores a 646px (panel abajo):
        desplazamientoX = 0;
        desplazamientoY = -Math.max(20, alto * 0.03);
    } else {
        // En anchos >= 646px (panel a la derecha):
        desplazamientoX = Math.max(180, ancho * 0.20);
        desplazamientoY = Math.max(130, alto * 0.16);
    }

    const puntoCentro = L.point(puntoNegocio.x + desplazamientoX, puntoNegocio.y - desplazamientoY);
    const nuevoCentro = mapa.unproject(puntoCentro, zoom);

    mapa.setMaxBounds(null);
    mapa.flyTo(nuevoCentro, zoom, {
        duration: 0.8,
        easeLinearity: 0.25
    });
}

export function hidePanel(panel) {
    if (!panel) return;
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('visible');
    const panelFiltros = document.getElementById('panelFiltros');
    if (panelFiltros) {
        panelFiltros.classList.remove('detalle-abierto');
    }
    const langSwitcher = document.querySelector('.lang-switcher');
    if (langSwitcher) {
        langSwitcher.classList.remove('detalle-abierto');
    }
}

export function seleccionarNegocio(negocio, state, actualizarTodosLosMarcadoresFn) {
    if (state.negocioActivo && state.negocioActivo !== negocio) {
        ocultarBurbujaFotos(state.negocioActivo);
    }
    state.negocioActivo = negocio;
    const panel = document.getElementById('panelNegocios');
    const panelFiltros = document.getElementById('panelFiltros');
    const langSwitcher = document.querySelector('.lang-switcher');

    if (panelFiltros) {
        panelFiltros.classList.add('detalle-abierto');
    }
    if (langSwitcher) {
        langSwitcher.classList.add('detalle-abierto');
    }

    actualizarTodosLosMarcadoresFn();
    centrarVistaNegocio(negocio);
    mostrarBurbujaFotos(negocio);

    if (!panel) return;
    panel.classList.add('visible');
    panel.removeAttribute('aria-hidden');

    const nombre = nombreTraducido(negocio);
    const htmlCalificacion = negocio.calificacion ? `<b>${t('labelRating')}</b> ⭐ ${negocio.calificacion}` : '';
    const detallesTexto = campoTraducido(negocio, 'detalles');
    const htmlDetalles = detallesTexto ? `<b>${t('labelDetails')}</b> ${detallesTexto}` : '';

    let htmlTelefonos = '';
    if (negocio.detalles_tel_1 || negocio.detalles_tel_2) {
        const tel1Texto = campoTraducido(negocio, 'detalles_tel_1');
        const tel2Texto = campoTraducido(negocio, 'detalles_tel_2');
        const t1 = tel1Texto ? `<div><b>${t('labelContact1')}</b> ${tel1Texto}</div>` : '';
        const t2 = tel2Texto ? `<div><b>${t('labelContact2')}</b> ${tel2Texto}</div>` : '';
        htmlTelefonos = `${t1}${t2}`;
    }

    const gmapsUrl = negocio.id_google
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.nombre)}&query_place_id=${negocio.id_google}`
        : `https://www.google.com/maps/search/?api=1&query=${negocio.coordenadas[0]},${negocio.coordenadas[1]}`;

    const categoriaTraducida = traducirCategoria(negocio.categoria);

    const catLimpia = negocio.categoria ? negocio.categoria.toLowerCase() : 'otros';
    const catClase = catLimpia === 'otro' ? 'otros' : catLimpia;

    panel.innerHTML = `
        <div id="detalleNegocio" class="detalle-negocio detalle-${catClase}" aria-live="polite">
            <div class="detalle-header-banner">
                <span class="detalle-nombre">${negocio.indice}. ${nombre}</span>
                <button class="close-btn" aria-label="Cerrar panel">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="detalle-body">
                <p><b>${t('labelCategory')}</b> ${categoriaTraducida}</p>
                ${htmlCalificacion ? `<p>${htmlCalificacion}</p>` : ''}
                ${htmlDetalles ? `<p>${htmlDetalles}</p>` : ''}
                ${htmlTelefonos ? `<p>${htmlTelefonos}</p>` : ''}
                <p><small><b>${t('labelAddress')}</b> ${negocio.direccion}</small></p>
                <a href="${gmapsUrl}" target="_blank" class="gmaps-btn">
                    <img src="icons/google-maps.svg" alt="Google Maps" class="gmaps-icon" style="width: 16px; height: 16px; margin-right: 8px;">
                    <span>${t('labelGmaps')}</span>
                </a>
            </div>
        </div>
    `;

    const btn = panel.querySelector('.close-btn');
    if (btn) {
        btn.addEventListener('click', () => cerrarPanelYRegresar(state, actualizarTodosLosMarcadoresFn));
    }
}

// Cierra el panel lateral y la burbuja de fotos, sin mover la cámara.
// Se usa tanto al hacer clic en "cerrar" como al deseleccionar
// automáticamente cuando el usuario hace zoom out (ver main.js).
export function deseleccionarNegocio(state, actualizarTodosLosMarcadoresFn) {
    const panel = document.getElementById('panelNegocios');
    if (state.negocioActivo) {
        ocultarBurbujaFotos(state.negocioActivo);
    }
    state.negocioActivo = null;
    hidePanel(panel);
    actualizarTodosLosMarcadoresFn();
}

export function cerrarPanelYRegresar(state, actualizarTodosLosMarcadoresFn) {
    deseleccionarNegocio(state, actualizarTodosLosMarcadoresFn);

    if (!state.regresandoAVista) {
        state.regresandoAVista = true;
        mapa.flyTo(vistaInicial.centro, vistaInicial.zoom, {
            duration: 1.2,
            easeLinearity: 0.25
        });

        setTimeout(() => {
            state.regresandoAVista = false;
            mapa.setMaxBounds(limitesZonaRosa);
        }, 1300);
    }
}
