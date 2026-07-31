// ==========================================
// MÓDULO PHOTOS: BURBUJA DE FOTOS DE GOOGLE MAPS POR NEGOCIO
// ==========================================
//
// Usa el Popup nativo de Leaflet y le mete un carrusel de fotos con
// flechas prev/next y puntos de paginación.
//
// IMPORTANTE — AUTENTICACIÓN POR DOMINIO CON SDK NATIVO (.getUrl()):
// Cuando la API Key tiene restricción por dominio (HTTP Referrer), las URLs
// directas a la API de fotos fallan con HTTP 403 al ser cargadas en <img>.
// Para solucionarlo, usamos la librería nativa de Places (PlacesService)
// y llamamos a .getUrl(), el cual gestiona la autenticación transparente.

export const GOOGLE_MAPS_BROWSER_KEY = 'AIzaSyAI_jIfxHUlHr8ujaFjP4YI6kBsO7g_HIA';

let servicePlaces = null;

function obtenerServicePlaces() {
    if (!servicePlaces && window.google && window.google.maps && window.google.maps.places) {
        servicePlaces = new window.google.maps.places.PlacesService(document.createElement('div'));
    }
    return servicePlaces;
}

export function construirUrlFoto(photoReference, maxWidth = 640) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_BROWSER_KEY}`;
}

export function obtenerFotosAutenticadas(negocio, callback) {
    if (negocio._urlsFotosCargadas) {
        callback(negocio._urlsFotosCargadas);
        return;
    }

    const service = obtenerServicePlaces();
    const placeId = negocio.id_google;

    if (!service || !placeId) {
        const urlsDirectas = (negocio.fotos || []).map(ref => construirUrlFoto(ref));
        negocio._urlsFotosCargadas = urlsDirectas;
        callback(urlsDirectas);
        return;
    }

    service.getDetails({
        placeId: placeId,
        fields: ['photos']
    }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.photos && place.photos.length > 0) {
            negocio._urlsFotosCargadas = place.photos.map(p => p.getUrl({ maxWidth: 640, maxHeight: 440 }));
        } else {
            negocio._urlsFotosCargadas = (negocio.fotos || []).map(ref => construirUrlFoto(ref));
        }
        callback(negocio._urlsFotosCargadas);
    });
}

function construirHtmlCarrusel(negocio) {
    const fotos = Array.isArray(negocio.fotos) ? negocio.fotos : [];
    const tieneKey = Boolean(GOOGLE_MAPS_BROWSER_KEY);

    if (fotos.length === 0 || !tieneKey) {
        return `<div class="popup-fotos-carrusel sin-fotos"><p>등록된 사진이 없습니다</p></div>`;
    }

    if (typeof negocio._fotoIndice !== 'number') {
        negocio._fotoIndice = 0;
    }

    const mostrarFlechas = fotos.length > 1;

    const dotsHtml = fotos.map((_, i) =>
        `<span class="popup-dot${i === negocio._fotoIndice ? ' activo' : ''}" data-indice="${i}"></span>`
    ).join('');

    const srcImagen = (negocio._urlsFotosCargadas && negocio._urlsFotosCargadas[negocio._fotoIndice])
        ? negocio._urlsFotosCargadas[negocio._fotoIndice]
        : construirUrlFoto(fotos[negocio._fotoIndice]);

    return `
        <div class="popup-fotos-carrusel">
            ${mostrarFlechas ? '<button type="button" class="popup-flecha popup-flecha-prev" aria-label="Foto anterior">&#8249;</button>' : ''}
            <img src="${srcImagen}" class="popup-foto-img" alt="${negocio.nombre}"
                 onload="if(this.naturalWidth===100 && this.naturalHeight===100){ this.parentElement.className='popup-fotos-carrusel sin-fotos'; this.parentElement.innerHTML='<p>사진을 불러올 수 없습니다</p>'; }"
                 onerror="this.onerror=null; this.parentElement.className='popup-fotos-carrusel sin-fotos'; this.parentElement.innerHTML='<p>사진을 불러올 수 없습니다</p>';">
            ${mostrarFlechas ? '<button type="button" class="popup-flecha popup-flecha-next" aria-label="Foto siguiente">&#8250;</button>' : ''}
            ${fotos.length > 1 ? `<div class="popup-dots">${dotsHtml}</div>` : ''}
        </div>
    `;
}

function ligarEventosCarrusel(negocio) {
    const popup = negocio._marcador.getPopup();
    const popupEl = popup ? popup.getElement() : null;
    if (!popupEl) return;

    const catClase = `popup-cat-${negocio.categoria || 'otros'}`;
    popupEl.classList.add(catClase);

    const irAFoto = (indice) => {
        const fotos = (negocio._urlsFotosCargadas && negocio._urlsFotosCargadas.length > 0)
            ? negocio._urlsFotosCargadas
            : (negocio.fotos || []);
        if (fotos.length === 0) return;
        negocio._fotoIndice = ((indice % fotos.length) + fotos.length) % fotos.length;
        popup.setContent(construirHtmlCarrusel(negocio));
        ligarEventosCarrusel(negocio);
    };

    const prevBtn = popupEl.querySelector('.popup-flecha-prev');
    const nextBtn = popupEl.querySelector('.popup-flecha-next');
    const dots = popupEl.querySelectorAll('.popup-dot');

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            irAFoto(negocio._fotoIndice - 1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            irAFoto(negocio._fotoIndice + 1);
        });
    }
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            irAFoto(parseInt(dot.dataset.indice, 10));
        });
    });
}

let negocioConPopupAbierto = null;

export function mostrarBurbujaFotos(negocio) {
    if (negocioConPopupAbierto && negocioConPopupAbierto !== negocio) {
        ocultarBurbujaFotos(negocioConPopupAbierto);
    }

    if (!negocio || !negocio._marcador) return;

    negocioConPopupAbierto = negocio;

    const catClase = `popup-cat-${negocio.categoria || 'otros'}`;

    negocio._marcador.bindPopup(construirHtmlCarrusel(negocio), {
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: `popup-fotos ${catClase}`,
        offset: [0, -8]
    });
    negocio._marcador.openPopup();
    ligarEventosCarrusel(negocio);

    if (!negocio._urlsFotosCargadas && negocio.id_google) {
        obtenerFotosAutenticadas(negocio, (urls) => {
            if (negocioConPopupAbierto === negocio) {
                const popup = negocio._marcador.getPopup();
                if (popup) {
                    popup.setContent(construirHtmlCarrusel(negocio));
                    ligarEventosCarrusel(negocio);
                }
            }
        });
    }
}

export function ocultarBurbujaFotos(negocio) {
    if (!negocio || !negocio._marcador) return;
    negocio._marcador.closePopup();
    negocio._marcador.unbindPopup();
    if (negocioConPopupAbierto === negocio) {
        negocioConPopupAbierto = null;
    }
}

export function cerrarBurbujaFotos(negocio) {
    if (negocio) {
        ocultarBurbujaFotos(negocio);
    }
}
