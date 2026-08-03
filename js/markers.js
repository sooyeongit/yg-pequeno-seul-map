// ==========================================
// MÓDULO MARKERS: MARCADORES Y DES-ENCIMADO
// ==========================================
//
// El marcador solo muestra el número; la foto del negocio ya no vive
// en el pin (ver photos.js) — se muestra en una burbuja (Leaflet Popup)
// cuando el negocio está seleccionado.

import { mapa } from './map.js?v=49';
import { nombreTraducido } from './panel.js?v=49';

// Metros por grado de latitud (aprox. constante en toda la Tierra)
const METROS_POR_GRADO_LAT = 111320;

// Radio máximo (en metros) que un marcador puede alejarse de su coordenada
// real antes de "pegarse" de vuelta. Evita que el des-encimado empuje un
// negocio fuera de su cuadra/manzana original hacia la calle vecina.
const RADIO_MAXIMO_METROS = 30;

function deltaEnMetros(dLat, dLng, latRefGrados) {
    const metrosPorGradoLng = METROS_POR_GRADO_LAT * Math.cos(latRefGrados * Math.PI / 180);
    return {
        dLatM: dLat * METROS_POR_GRADO_LAT,
        dLngM: dLng * metrosPorGradoLng,
        metrosPorGradoLng
    };
}

function clampDentroDeLaManzana(negocio) {
    const [latO, lngO] = negocio.coordenadasOriginales;
    const [latT, lngT] = negocio.coordenadasTrabajo;

    const { dLatM, dLngM, metrosPorGradoLng } = deltaEnMetros(latT - latO, lngT - lngO, latO);
    const distM = Math.sqrt(dLatM * dLatM + dLngM * dLngM);

    if (distM > RADIO_MAXIMO_METROS) {
        const factor = RADIO_MAXIMO_METROS / distM;
        negocio.coordenadasTrabajo[0] = latO + (dLatM * factor) / METROS_POR_GRADO_LAT;
        negocio.coordenadasTrabajo[1] = lngO + (dLngM * factor) / metrosPorGradoLng;
    }
}

// Optimización del algoritmo de des-encimado (Decluttering)
export function recalcularPosicionesMarcadores(arrayMarcadoresGlobal) {
    const zoom = mapa.getZoom();
    const distanciaMinima = 0.00045 * Math.pow(2, 16 - zoom);
    const minDistSq = distanciaMinima * distanciaMinima;

    arrayMarcadoresGlobal.forEach(negocio => {
        negocio.coordenadasTrabajo = [...negocio.coordenadasOriginales];
    });

    const visibles = arrayMarcadoresGlobal.filter(n => n._marcador && mapa.hasLayer(n._marcador));
    const count = visibles.length;

    for (let k = 0; k < 5; k++) {
        for (let i = 0; i < count; i++) {
            const n1 = visibles[i];
            for (let j = i + 1; j < count; j++) {
                const n2 = visibles[j];

                const dx = n1.coordenadasTrabajo[0] - n2.coordenadasTrabajo[0];
                const dy = n1.coordenadasTrabajo[1] - n2.coordenadasTrabajo[1];
                const distSq = dx * dx + dy * dy;

                if (distSq < minDistSq && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const overlap = (distanciaMinima - dist) / 2;
                    const pushX = (dx / dist) * overlap;
                    const pushY = (dy / dist) * overlap;

                    n1.coordenadasTrabajo[0] += pushX;
                    n1.coordenadasTrabajo[1] += pushY;
                    n2.coordenadasTrabajo[0] -= pushX;
                    n2.coordenadasTrabajo[1] -= pushY;
                }
            }
        }

        for (let i = 0; i < count; i++) {
            clampDentroDeLaManzana(visibles[i]);
        }
    }

    visibles.forEach(negocio => {
        negocio._marcador.setLatLng(negocio.coordenadasTrabajo);
    });
}

export function actualizarIconoMarcador(negocio, negocioActivo, categoriaActiva) {
    const esSeleccionado = (negocioActivo === negocio);

    if (!negocio._marcador) return;

    negocio._marcador.unbindTooltip();
    negocio._marcador.bindTooltip(nombreTraducido(negocio), {
        permanent: false,
        direction: 'top',
        className: 'tooltip-negocio',
        offset: [0, -14]
    });

    let claseBorde = '';
    if (categoriaActiva !== 'todos') {
        claseBorde = ` con-borde-${negocio._categoriaLimpia}`;
    }
    const claseCirculo = (esSeleccionado ? `marcador-numero-circulo activo activo-${negocio._categoriaLimpia}` : 'marcador-numero-circulo') + claseBorde;

    const icono = L.divIcon({
        html: `<div class="${claseCirculo}">${negocio.indice || ''}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: 'marcador-numero-contenedor'
    });
    negocio._marcador.setIcon(icono);
}

export function actualizarTodosLosMarcadores(arrayMarcadoresGlobal, negocioActivo, categoriaActiva) {
    recalcularPosicionesMarcadores(arrayMarcadoresGlobal);
    arrayMarcadoresGlobal.forEach(negocio => {
        actualizarIconoMarcador(negocio, negocioActivo, categoriaActiva);
    });
}
