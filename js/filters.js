// ==========================================
// MÓDULO FILTERS: SISTEMA GLOBAL DE FILTRADO Y BÚSQUEDA
// ==========================================

import { mapa } from './map.js?v=49';
import { hidePanel, seleccionarNegocio } from './panel.js?v=49';

export const indicesPlatos = {
    '짜장면': ['harimgak', 'bongnaesung', 'songrim', 'goguinara', 'biwon'],
    'jjajangmyeon': ['harimgak', 'bongnaesung', 'songrim', 'goguinara', 'biwon'],
    'jajangmyeon': ['harimgak', 'bongnaesung', 'songrim', 'goguinara', 'biwon'],
    '짬뽕': ['harimgak', 'bongnaesung', 'songrim'],
    'jjampong': ['harimgak', 'bongnaesung', 'songrim'],
    '커피': ['o-mart', 'a-mart', 'k-mart', 'han mart', 'cafe', 'baking story'],
    'coffee': ['o-mart', 'a-mart', 'k-mart', 'han mart', 'cafe'],
    'cafe': ['o-mart', 'a-mart', 'k-mart', 'han mart', 'cafe'],
    '치킨': ['goguinara', 'harimgak', 'min sok chon', 'bbq chicken', 'chicken'],
    'chicken': ['goguinara', 'harimgak', 'min sok chon', 'bbq chicken', 'chicken'],
    '삼겹살': ['goguinara', 'goguryeo', 'nadefo', 'mapo galbi', 'bbq', 'sabor a korea'],
    'bbq': ['goguinara', 'goguryeo', 'nadefo', 'mapo galbi', 'bbq', 'sabor a korea'],
    '김치찌개': ['kimchihouse', 'sabor a korea', 'biwon', 'min sok chon', 'goguryeo', 'seoul restaurante'],
    'kimchi': ['kimchihouse', 'sabor a korea', 'biwon', 'min sok chon', 'goguryeo', 'seoul restaurante']
};

export function filtrarCategoria(categoriaSeleccionada, state, actualizarTodosLosMarcadoresFn) {
    const panel = document.getElementById('panelNegocios');
    if (panel && panel.classList.contains('visible')) {
        hidePanel(panel);
    }
    state.categoriaActiva = categoriaSeleccionada;

    const itemsFiltro = document.querySelectorAll('.lista-filtros li');
    itemsFiltro.forEach(item => item.classList.remove('activo'));
    const itemActivo = document.querySelector(`.filtro-${categoriaSeleccionada}`);
    if (itemActivo) {
        itemActivo.classList.add('activo');
    }

    actualizarFiltrado(state, actualizarTodosLosMarcadoresFn);
}

export function filtrarPorBusqueda(valor, state, actualizarTodosLosMarcadoresFn) {
    state.textoBusqueda = valor;
    actualizarFiltrado(state, actualizarTodosLosMarcadoresFn);
}

export function actualizarFiltrado(state, actualizarTodosLosMarcadoresFn) {
    const panel = document.getElementById('panelNegocios');
    if (panel && panel.classList.contains('visible')) {
        hidePanel(panel);
    }
    const listaContenedor = document.getElementById('listaNegocios');
    if (listaContenedor) {
        listaContenedor.innerHTML = '';

        const ul = document.createElement('div');
        ul.className = 'lista-negocios-items';
        listaContenedor.appendChild(ul);

        const queryLimpia = state.textoBusqueda.trim().toLowerCase();
        let negociosPorPlato = [];
        if (indicesPlatos[queryLimpia]) {
            negociosPorPlato = indicesPlatos[queryLimpia];
        }

        let contadorVisibles = 0;
        state.arrayMarcadoresGlobal.forEach(negocio => {
            let categoriaNegocio = negocio.categoria ? negocio.categoria.toLowerCase() : '';
            if (categoriaNegocio === 'otro') categoriaNegocio = 'otros';

            let sel = state.categoriaActiva ? state.categoriaActiva.toLowerCase() : '';
            if (sel === 'otro') sel = 'otros';

            const coincideCategoria = (sel === 'todos' || categoriaNegocio === sel);

            const nombreLimpio = negocio.nombre.toLowerCase();
            let coincideTexto = nombreLimpio.includes(queryLimpia);
            if (!coincideTexto && negociosPorPlato.length > 0) {
                coincideTexto = negociosPorPlato.some(target => nombreLimpio.includes(target));
            }

            if (coincideCategoria && (queryLimpia === '' || coincideTexto)) {
                contadorVisibles++;
                negocio.indice = contadorVisibles;

                if (!mapa.hasLayer(negocio._marcador)) {
                    mapa.addLayer(negocio._marcador);
                }

                const item = document.createElement('div');
                item.className = `negocio-item negocio-${categoriaNegocio}`;

                const califHtml = negocio.calificacion ? `<span class="negocio-calificacion">⭐ ${negocio.calificacion}</span>` : '';
                const dirHtml = negocio.direccion ? `<div class="negocio-direccion">${negocio.direccion}</div>` : '';

                item.innerHTML = `
                    <div class="negocio-header">
                        <span class="negocio-nombre">${negocio.indice}. ${negocio.nombre}</span>
                        ${califHtml}
                    </div>
                    ${dirHtml}
                `;

                item.addEventListener('click', () => {
                    seleccionarNegocio(negocio, state, actualizarTodosLosMarcadoresFn);
                });

                ul.appendChild(item);
            } else {
                if (mapa.hasLayer(negocio._marcador)) {
                    mapa.removeLayer(negocio._marcador);
                }
            }
        });
    }

    actualizarTodosLosMarcadoresFn();
}
