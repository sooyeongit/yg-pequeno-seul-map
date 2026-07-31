// ==========================================
// MÓDULO MAIN: PUNTO DE ENTRADA E INICIALIZACIÓN
// ==========================================

import { mapa } from './map.js?v=49';
import { actualizarTodosLosMarcadores } from './markers.js?v=49';
import { seleccionarNegocio, cerrarPanelYRegresar, deseleccionarNegocio } from './panel.js?v=49';
import { filtrarCategoria, filtrarPorBusqueda } from './filters.js?v=49';

// Estado global encapsulado
export const state = {
    arrayMarcadoresGlobal: [],
    categoriaActiva: 'todos',
    textoBusqueda: '',
    negocioActivo: null,
    regresandoAVista: false
};

export function actualizarTodos() {
    actualizarTodosLosMarcadores(state.arrayMarcadoresGlobal, state.negocioActivo, state.categoriaActiva);
}

async function cargarNegocios() {
    try {
        const respuestaAPI = await fetch('negocios_zona_rosa_inicial.json');
        if (!respuestaAPI.ok) {
            throw new Error(`HTTP error! status: ${respuestaAPI.status}`);
        }
        const todosLosNegocios = await respuestaAPI.json();

        // Aseguramos que YG Consulting sea el primer negocio (índice 1)
        const indiceYG = todosLosNegocios.findIndex(n => n.categoria === 'yg' || n.nombre === 'YG Consulting');
        if (indiceYG > -1) {
            const negocioYG = todosLosNegocios.splice(indiceYG, 1)[0];
            todosLosNegocios.unshift(negocioYG);
        }

        // Filtramos o aseguramos que solo procesemos negocios con coordenadas válidas para el mapa
        const todosLosNegociosValidos = todosLosNegocios.filter(negocio => 
            Array.isArray(negocio.coordenadas) && negocio.coordenadas.length === 2 && 
            !isNaN(negocio.coordenadas[0]) && !isNaN(negocio.coordenadas[1])
        );

        todosLosNegociosValidos.forEach(negocio => {
            negocio.coordenadasOriginales = [...negocio.coordenadas];
            negocio.coordenadasTrabajo = [...negocio.coordenadas];
        });

        console.log(`Cargados: ${todosLosNegociosValidos.length} negocios.`);
        const panel = document.getElementById('panelNegocios');
        if (panel) panel.innerHTML = '';

        todosLosNegociosValidos.forEach((negocio, index) => {
            negocio.indice = index + 1;

            let categoriaClase = negocio.categoria ? negocio.categoria.toLowerCase() : 'otros';
            if (categoriaClase === 'otro') categoriaClase = 'otros';
            negocio._categoriaLimpia = categoriaClase;

            const marcador = L.marker(negocio.coordenadasOriginales).addTo(mapa);
            negocio._marcador = marcador;

            state.arrayMarcadoresGlobal.push(negocio);

            marcador.on('click', (e) => {
                if (e) L.DomEvent.stopPropagation(e);
                seleccionarNegocio(negocio, state, actualizarTodos);
            });
        });

        actualizarTodos();
        filtrarCategoria('todos', state, actualizarTodos);

    } catch (error) {
        console.error("Error cargando las bases de datos:", error);
    }
}

// Eventos de interacción del mapa
mapa.on('click', () => {
    cerrarPanelYRegresar(state, actualizarTodos);
});

// Nivel de zoom a partir del cual se considera "zoom in" (mismo zoom al
// que centrarVistaNegocio lleva la cámara al seleccionar un negocio).
const ZOOM_MINIMO_DETALLE = 18;

mapa.on('zoomend moveend', () => {
    if (mapa.getZoom() < ZOOM_MINIMO_DETALLE && state.negocioActivo) {
        deseleccionarNegocio(state, actualizarTodos);
    }
    actualizarTodos();
});

// Eventos de búsqueda e interfaz
document.addEventListener('DOMContentLoaded', () => {
    cargarNegocios();

    const buscador = document.getElementById('buscadorNegocios');
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            filtrarPorBusqueda(e.target.value, state, actualizarTodos);
        });
    }

    const itemsFiltro = document.querySelectorAll('.lista-filtros li');
    itemsFiltro.forEach(item => {
        item.addEventListener('click', () => {
            const cat = item.dataset.categoria || item.className.replace('filtro-', '').replace(' activo', '');
            if (cat) {
                filtrarCategoria(cat, state, actualizarTodos);
            }
        });
    });
});

// Exposición en objeto global window para eventos HTML directos
window.filtrarCategoria = (cat) => filtrarCategoria(cat, state, actualizarTodos);
window.filtrarPorBusqueda = (val) => filtrarPorBusqueda(val, state, actualizarTodos);
