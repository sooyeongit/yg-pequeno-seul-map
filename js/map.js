// ==========================================
// MÓDULO MAP: CONFIGURACIÓN Y LÍMITES DEL MAPA LEAFLET
// ==========================================

export const esquinaSurOeste = L.latLng(19.4175, -99.1820);
export const esquinaNorEste = L.latLng(19.4380, -99.1460);
export const limitesZonaRosa = L.latLngBounds(esquinaSurOeste, esquinaNorEste);

export const vistaInicial = {
    centro: L.latLng(19.4265, -99.1620),
    zoom: 16
};

export const mapa = L.map('mapa', {
    maxBounds: limitesZonaRosa,
    maxBoundsViscosity: 0.5,
    minZoom: vistaInicial.zoom,
    maxZoom: 18,
    zoomSnap: 2,
    zoomDelta: 2,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    pitch: 35
}).setView(vistaInicial.centro, vistaInicial.zoom);

export const capaBase = L.tileLayer('https://api.mapbox.com/styles/v1/sooyeon04/cmr8jc4fg000s01s1fowufsp0/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic29veWVvbjA0IiwiYSI6ImNtcjhpa3E2djFqMjEyeW9uaWhwcjRwZGEifQ.Dt8ujTX-2CexkqDEnVYeEQ', {
    maxZoom: 20,
    attribution: 'Map data &copy; Mapbox, OpenStreetMap'
}).addTo(mapa);
