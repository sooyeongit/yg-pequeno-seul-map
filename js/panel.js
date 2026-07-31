// ==========================================
// MÓDULO PANEL: TARJETA DE DETALLE Y ANIMACIÓN DE CÁMARA
// ==========================================

import { mapa, vistaInicial, limitesZonaRosa } from './map.js?v=49';
import { mostrarBurbujaFotos, ocultarBurbujaFotos } from './photos.js?v=49';

export const traduccionesCategorias = {
    'restaurante': '음식점',
    'tienda': '식품점',
    'otros': '기타',
    'yg': 'YG 컨설팅'
};

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
}

export function seleccionarNegocio(negocio, state, actualizarTodosLosMarcadoresFn) {
    if (state.negocioActivo && state.negocioActivo !== negocio) {
        ocultarBurbujaFotos(state.negocioActivo);
    }
    state.negocioActivo = negocio;
    const panel = document.getElementById('panelNegocios');
    const panelFiltros = document.getElementById('panelFiltros');

    if (panelFiltros) {
        panelFiltros.classList.add('detalle-abierto');
    }

    actualizarTodosLosMarcadoresFn();
    centrarVistaNegocio(negocio);
    mostrarBurbujaFotos(negocio);

    if (!panel) return;
    panel.classList.add('visible');
    panel.removeAttribute('aria-hidden');

    const htmlCalificacion = negocio.calificacion ? `<b>평점:</b> ⭐ ${negocio.calificacion}` : '';
    const htmlDetalles = negocio.detalles ? `<b>주요업무:</b> ${negocio.detalles}` : '';

    let htmlTelefonos = '';
    if (negocio.detalles_tel_1 || negocio.detalles_tel_2) {
        const t1 = negocio.detalles_tel_1 ? `<div><b>연락처 1:</b> ${negocio.detalles_tel_1}</div>` : '';
        const t2 = negocio.detalles_tel_2 ? `<div><b>연락처 2:</b> ${negocio.detalles_tel_2}</div>` : '';
        htmlTelefonos = `${t1}${t2}`;
    }

    const gmapsUrl = negocio.id_google
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.nombre)}&query_place_id=${negocio.id_google}`
        : `https://www.google.com/maps/search/?api=1&query=${negocio.coordenadas[0]},${negocio.coordenadas[1]}`;

    const categoriaTraducida = traduccionesCategorias[negocio.categoria ? negocio.categoria.toLowerCase() : ''] || negocio.categoria || '기타';

    const catLimpia = negocio.categoria ? negocio.categoria.toLowerCase() : 'otros';
    const catClase = catLimpia === 'otro' ? 'otros' : catLimpia;

    panel.innerHTML = `
        <div id="detalleNegocio" class="detalle-negocio detalle-${catClase}" aria-live="polite">
            <div class="detalle-header-banner">
                <span class="detalle-nombre">${negocio.indice}. ${negocio.nombre}</span>
                <button class="close-btn" aria-label="Cerrar panel">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="detalle-body">
                <p><b>업종:</b> ${categoriaTraducida}</p>
                ${htmlCalificacion ? `<p>${htmlCalificacion}</p>` : ''}
                ${htmlDetalles ? `<p>${htmlDetalles}</p>` : ''}
                ${htmlTelefonos ? `<p>${htmlTelefonos}</p>` : ''}
                <p><small><b>주소:</b> ${negocio.direccion}</small></p>
                <a href="${gmapsUrl}" target="_blank" class="gmaps-btn">
                    <img src="icons/google-maps.svg" alt="Google Maps" class="gmaps-icon" style="width: 16px; height: 16px; margin-right: 8px;">
                    <span>구글 지도에서 보기</span>
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
