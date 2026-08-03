// ==========================================
// MÓDULO I18N: INTERNACIONALIZACIÓN BILINGÜE (KO / ES)
// ==========================================

export const translations = {
    ko: {
        // Título y header
        siteTitle: '작은 서울',
        searchPlaceholder: '검색...',
        infoTooltip: '이 지도는 2026년 7월 19일 기준 등록된 기존 업체를 바탕으로 작성되었습니다.',

        // Filtros de categoría
        filterAll: '전체 보기',
        filterYg: 'YG 컨설팅',
        filterRestaurant: '음식점',
        filterStore: '식품점',
        filterOther: '기타',

        // Etiquetas del panel de detalle
        labelCategory: '업종:',
        labelRating: '평점:',
        labelDetails: '주요업무:',
        labelContact1: '연락처 1:',
        labelContact2: '연락처 2:',
        labelAddress: '주소:',
        labelGmaps: '구글 지도에서 보기',

        // Categorías traducidas (valores para mostrar)
        catRestaurante: '음식점',
        catTienda: '식품점',
        catOtros: '기타',
        catYg: 'YG 컨설팅',

        // Fotos
        noPhotos: '등록된 사진이 없습니다',
        photoError: '사진을 불러올 수 없습니다'
    },
    es: {
        // Título y header
        siteTitle: 'Pequeño Seúl',
        searchPlaceholder: 'Buscar...',
        infoTooltip: 'Este mapa muestra los negocios registrados al 19 de julio de 2026.',

        // Filtros de categoría
        filterAll: 'Ver todos',
        filterYg: 'YG Consulting',
        filterRestaurant: 'Restaurantes',
        filterStore: 'Tiendas',
        filterOther: 'Otros',

        // Etiquetas del panel de detalle
        labelCategory: 'Categoría:',
        labelRating: 'Calificación:',
        labelDetails: 'Actividad:',
        labelContact1: 'Contacto 1:',
        labelContact2: 'Contacto 2:',
        labelAddress: 'Dirección:',
        labelGmaps: 'Ver en Google Maps',

        // Categorías traducidas (valores para mostrar)
        catRestaurante: 'Restaurante',
        catTienda: 'Tienda',
        catOtros: 'Otros',
        catYg: 'YG Consulting',

        // Fotos
        noPhotos: 'No hay fotos registradas',
        photoError: 'No se pudo cargar la foto'
    }
};

// Mapa de categoría interna → clave de traducción
const categoriaTradKey = {
    'restaurante': 'catRestaurante',
    'tienda': 'catTienda',
    'otros': 'catOtros',
    'otro': 'catOtros',
    'yg': 'catYg'
};

export let currentLang = localStorage.getItem('lang') || 'ko';

/**
 * Obtiene la traducción de una clave en el idioma activo.
 * Si no existe, devuelve la clave como fallback.
 */
export function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
}

/**
 * Traduce una categoría interna al texto de display en el idioma activo.
 */
export function traducirCategoria(categoria) {
    const key = categoriaTradKey[(categoria || '').toLowerCase()];
    return key ? t(key) : (categoria || t('catOtros'));
}

/**
 * Obtiene el campo bilingüe de un negocio (ej: detalles / detalles_es).
 * Si el campo tiene versión _es y el idioma activo es español, la usa.
 */
export function campoTraducido(negocio, campo) {
    if (currentLang === 'es' && negocio[campo + '_es']) {
        return negocio[campo + '_es'];
    }
    return negocio[campo] || '';
}

/**
 * Aplica traducciones a elementos HTML estáticos que tienen data-i18n.
 * - data-i18n="key" → actualiza textContent
 * - data-i18n-placeholder="key" → actualiza placeholder
 */
export function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated !== key) {
            el.textContent = translated;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated !== key) {
            el.setAttribute('placeholder', translated);
        }
    });

    // Actualizar el lang del HTML
    document.documentElement.lang = currentLang;

    // Actualizar estado visual de los botones de idioma
    document.querySelectorAll('.lang-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

/**
 * Cambia el idioma activo, persiste en localStorage, y re-renderiza.
 * Recibe un callback opcional para re-renderizar el filtrado/panel.
 */
let _onLanguageChange = null;

export function setOnLanguageChange(fn) {
    _onLanguageChange = fn;
}

export function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyStaticTranslations();

    if (typeof _onLanguageChange === 'function') {
        _onLanguageChange();
    }
}
