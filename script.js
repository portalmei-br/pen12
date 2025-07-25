/**
 * PeneirasBR - Sistema de Busca de Peneiras de Futebol
 * Versão Otimizada com Melhores Práticas
 * @version 2.0.0
 */

// ==================== CONFIGURAÇÕES E CONSTANTES ====================

const CONFIG = {
    API: {
        VIACEP_BASE_URL: 'https://viacep.com.br/ws',
        REQUEST_TIMEOUT: 10000,
        CACHE_EXPIRATION: 30 * 60 * 1000, // 30 minutos
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    UI: {
        LOADING_MIN_TIME: 1000,
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500,
        SCROLL_THRESHOLD: 100,
        BACK_TO_TOP_THRESHOLD: 500
    },
    GEO: {
        HIGH_ACCURACY: true,
        TIMEOUT: 10000,
        MAX_AGE: 5 * 60 * 1000, // 5 minutos
        EARTH_RADIUS_KM: 6371
    },
    VALIDATION: {
        CEP_LENGTH: 8,
        CEP_REGEX: /^\d{8}$/
    }
};

// ==================== DADOS DAS PENEIRAS ====================

const PENEIRAS_DATA = [
    {
        id: 1,
        titulo: "Peneira Sub-15 e Sub-17",
        clube: "Santos FC",
        endereco: "Vila Belmiro, Santos - SP",
        data: "2024-08-15",
        horario: "14:00",
        categoria: "Sub-15, Sub-17",
        requisitos: "Idade entre 13-17 anos",
        contato: "(13) 3257-4000",
        coordenadas: { lat: -23.9618, lng: -46.3322 },
        status: "aberta",
        vagasDisponiveis: 8,
        totalVagas: 50,
        prazoInscricao: "2024-08-10",
        taxa: "R$ 50,00",
        linkInscricao: "formulario-modificado.html?peneira=1"
    },
    {
        id: 2,
        titulo: "Peneira Categoria de Base",
        clube: "São Paulo FC",
        endereco: "CT Barra Funda, São Paulo - SP",
        data: "2024-08-20",
        horario: "09:00",
        categoria: "Sub-13, Sub-15",
        requisitos: "Idade entre 11-15 anos",
        contato: "(11) 3670-8100",
        coordenadas: { lat: -23.5505, lng: -46.6333 },
        status: "encerrada",
        vagasDisponiveis: 0,
        totalVagas: 40,
        prazoInscricao: "2024-08-15",
        taxa: "R$ 45,00",
        linkInscricao: "formulario-modificado.html?peneira=2"
    },
    {
        id: 3,
        titulo: "Peneira Feminina",
        clube: "Corinthians",
        endereco: "CT Joaquim Grava, São Paulo - SP",
        data: "2024-08-25",
        horario: "15:30",
        categoria: "Sub-16, Sub-18",
        requisitos: "Idade entre 14-18 anos (feminino)",
        contato: "(11) 2095-3000",
        coordenadas: { lat: -23.5629, lng: -46.6544 },
        status: "aberta",
        vagasDisponiveis: 3,
        totalVagas: 30,
        prazoInscricao: "2024-08-20",
        taxa: "R$ 40,00",
        linkInscricao: "formulario-modificado.html?peneira=3"
    },
    {
        id: 4,
        titulo: "Peneira Juvenil",
        clube: "Palmeiras",
        endereco: "Academia de Futebol, São Paulo - SP",
        data: "2024-09-01",
        horario: "10:00",
        categoria: "Sub-17, Sub-20",
        requisitos: "Idade entre 15-20 anos",
        contato: "(11) 3873-2400",
        coordenadas: { lat: -23.5629, lng: -46.6544 },
        status: "aberta",
        vagasDisponiveis: 15,
        totalVagas: 60,
        prazoInscricao: "2024-08-28",
        taxa: "R$ 60,00",
        linkInscricao: "formulario-modificado.html?peneira=4"
    },
    {
        id: 5,
        titulo: "Peneira Regional",
        clube: "Red Bull Bragantino",
        endereco: "CT Red Bull, Bragança Paulista - SP",
        data: "2024-09-05",
        horario: "13:00",
        categoria: "Sub-14, Sub-16",
        requisitos: "Idade entre 12-16 anos",
        contato: "(11) 4034-1900",
        coordenadas: { lat: -22.9519, lng: -46.5428 },
        status: "encerrada",
        vagasDisponiveis: 0,
        totalVagas: 25,
        prazoInscricao: "2024-09-01",
        taxa: "R$ 35,00",
        linkInscricao: "formulario-modificado.html?peneira=5"
    },
    {
        id: 6,
        titulo: "Peneira Escolar",
        clube: "Ponte Preta",
        endereco: "Estádio Moisés Lucarelli, Campinas - SP",
        data: "2024-09-10",
        horario: "14:30",
        categoria: "Sub-13, Sub-15",
        requisitos: "Idade entre 11-15 anos",
        contato: "(19) 3231-3444",
        coordenadas: { lat: -22.9056, lng: -47.0608 },
        status: "aberta",
        vagasDisponiveis: 22,
        totalVagas: 35,
        prazoInscricao: "2024-09-07",
        taxa: "R$ 30,00",
        linkInscricao: "formulario-modificado.html?peneira=6"
    }
];

// ==================== CLASSES E MÓDULOS ====================

/**
 * Classe para gerenciar cache com expiração
 */
class CacheManager {
    constructor(expirationTime = CONFIG.API.CACHE_EXPIRATION) {
        this.cache = new Map();
        this.expirationTime = expirationTime;
    }

    set(key, value) {
        const expirationDate = Date.now() + this.expirationTime;
        this.cache.set(key, { value, expirationDate });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expirationDate) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

/**
 * Classe para gerenciar requisições HTTP com retry
 */
class HttpClient {
    static async fetchWithRetry(url, options = {}, retries = CONFIG.API.RETRY_ATTEMPTS) {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.REQUEST_TIMEOUT);

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await this.delay(CONFIG.API.RETRY_DELAY * (i + 1));
            }
        }
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Classe para utilitários de validação
 */
class Validator {
    static isValidCEP(cep) {
        const cleanCEP = this.cleanCEP(cep);
        return CONFIG.VALIDATION.CEP_REGEX.test(cleanCEP);
    }

    static cleanCEP(cep) {
        return cep.replace(/\D/g, '');
    }

    static isValidCoordinates(lat, lng) {
        return (
            typeof lat === 'number' && 
            typeof lng === 'number' &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180
        );
    }
}

/**
 * Classe para cálculos geográficos
 */
class GeoUtils {
    static calculateDistance(lat1, lng1, lat2, lng2) {
        if (!Validator.isValidCoordinates(lat1, lng1) || !Validator.isValidCoordinates(lat2, lng2)) {
            throw new Error('Coordenadas inválidas');
        }

        const R = CONFIG.GEO.EARTH_RADIUS_KM;
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    static formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        }
        return `${distance.toFixed(1)}km`;
    }
}

/**
 * Classe para gerenciar notificações
 */
class NotificationManager {
    static show(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    }

    static getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }
}

/**
 * Classe para utilitários de debounce e throttle
 */
class PerformanceUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// ==================== SERVIÇOS ====================

/**
 * Serviço para busca de CEP
 */
class CEPService {
    constructor() {
        this.cache = new CacheManager();
    }

    async buscarEndereco(cep) {
        const cleanCEP = Validator.cleanCEP(cep);
        
        if (!Validator.isValidCEP(cleanCEP)) {
            throw new Error('CEP inválido');
        }

        // Verificar cache
        const cached = this.cache.get(cleanCEP);
        if (cached) {
            return cached;
        }

        try {
            const response = await HttpClient.fetchWithRetry(
                `${CONFIG.API.VIACEP_BASE_URL}/${cleanCEP}/json/`
            );
            
            const data = await response.json();
            
            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            if (!data.localidade || !data.uf) {
                throw new Error('Dados incompletos');
            }

            const endereco = {
                cep: cleanCEP,
                cidade: data.localidade,
                estado: data.uf,
                bairro: data.bairro || '',
                logradouro: data.logradouro || '',
                formatted: `${data.localidade}, ${data.uf}`
            };

            // Armazenar no cache
            this.cache.set(cleanCEP, endereco);
            
            return endereco;
        } catch (error) {
            throw new Error(`Erro ao buscar CEP: ${error.message}`);
        }
    }
}

/**
 * Serviço de geolocalização
 */
class GeolocationService {
    static getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não suportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                }),
                error => {
                    const messages = {
                        [error.PERMISSION_DENIED]: 'Permissão de localização negada',
                        [error.POSITION_UNAVAILABLE]: 'Localização indisponível',
                        [error.TIMEOUT]: 'Tempo limite excedido'
                    };
                    reject(new Error(messages[error.code] || 'Erro desconhecido'));
                },
                {
                    enableHighAccuracy: CONFIG.GEO.HIGH_ACCURACY,
                    timeout: CONFIG.GEO.TIMEOUT,
                    maximumAge: CONFIG.GEO.MAX_AGE
                }
            );
        });
    }

    static async reverseGeocode(lat, lng) {
        // Simulação de geocodificação reversa
        // Em produção, usar serviço real como Google Maps ou OpenStreetMap
        const cities = [
            { name: "São Paulo, SP", lat: -23.5505, lng: -46.6333 },
            { name: "Rio de Janeiro, RJ", lat: -22.9068, lng: -43.1729 },
            { name: "Belo Horizonte, MG", lat: -19.9167, lng: -43.9345 },
            { name: "Porto Alegre, RS", lat: -30.0346, lng: -51.2177 },
            { name: "Salvador, BA", lat: -12.9714, lng: -38.5014 },
            { name: "Brasília, DF", lat: -15.8267, lng: -47.9218 }
        ];

        let closestCity = cities[0];
        let minDistance = GeoUtils.calculateDistance(lat, lng, cities[0].lat, cities[0].lng);

        cities.forEach(city => {
            const distance = GeoUtils.calculateDistance(lat, lng, city.lat, city.lng);
            if (distance < minDistance) {
                minDistance = distance;
                closestCity = city;
            }
        });

        return closestCity.name;
    }
}

/**
 * Serviço de busca de peneiras
 */
class PeneiraService {
    static buscarPeneiras(userCoords, filters = {}) {
        let results = [...PENEIRAS_DATA];

        // Calcular distâncias se coordenadas fornecidas
        if (userCoords && Validator.isValidCoordinates(userCoords.lat, userCoords.lng)) {
            results = results.map(peneira => ({
                ...peneira,
                distancia: GeoUtils.calculateDistance(
                    userCoords.lat,
                    userCoords.lng,
                    peneira.coordenadas.lat,
                    peneira.coordenadas.lng
                )
            }));
        }

        // Aplicar filtros
        if (filters.status) {
            results = results.filter(peneira => peneira.status === filters.status);
        }

        if (filters.categoria) {
            results = results.filter(peneira => 
                peneira.categoria.toLowerCase().includes(filters.categoria.toLowerCase())
            );
        }

        if (filters.maxDistance && userCoords) {
            results = results.filter(peneira => peneira.distancia <= filters.maxDistance);
        }

        // Ordenar por distância se disponível
        if (userCoords) {
            results.sort((a, b) => a.distancia - b.distancia);
        }

        return results;
    }

    static getPeneiraById(id) {
        return PENEIRAS_DATA.find(peneira => peneira.id === parseInt(id));
    }
}

// ==================== GERENCIADOR PRINCIPAL ====================

/**
 * Classe principal da aplicação
 */
class PeneirasBRApp {
    constructor() {
        this.cepService = new CEPService();
        this.state = {
            userLocation: null,
            currentResults: [],
            currentFilter: 'all',
            isLoading: false
        };
        this.elements = {};
        
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.setupAnimations();
    }

    bindElements() {
        const elementIds = [
            'cep-input', 'get-location-btn', 'search-btn', 'results',
            'results-container', 'no-results', 'loading-overlay',
            'loading-address', 'loading-neighborhood', 'back-to-top',
            'nav-toggle', 'header'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        this.elements.navMenu = document.querySelector('.nav-menu');
        this.elements.suggestionBtns = document.querySelectorAll('.suggestion-btn');
        this.elements.filterBtns = document.querySelectorAll('.filter-btn');
    }

    bindEvents() {
        // Busca
        this.elements.searchBtn?.addEventListener('click', () => this.handleSearch());
        this.elements.cepInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Localização
        this.elements.getLocationBtn?.addEventListener('click', () => this.getCurrentLocation());

        // Sugestões
        this.elements.suggestionBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                const location = btn.getAttribute('data-location');
                this.elements.cepInput.value = location;
                this.handleSearch();
            });
        });

        // Filtros
        this.elements.filterBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                this.setActiveFilter(filter);
                this.applyFilter(filter);
            });
        });

        // Menu mobile
        this.elements.navToggle?.addEventListener('click', () => this.toggleMobileMenu());

        // Scroll
        window.addEventListener('scroll', PerformanceUtils.throttle(() => this.handleScroll(), 100));

        // Back to top
        this.elements.backToTop?.addEventListener('click', () => this.scrollToTop());
    }

    setupAnimations() {
        this.animateStats();
        this.setupScrollAnimations();
        this.setupScrollIndicator();
    }

    // ==================== MÉTODOS DE BUSCA ====================

    async handleSearch() {
        const cep = this.elements.cepInput?.value?.trim();
        
        if (!cep) {
            NotificationManager.show('Por favor, digite um CEP', 'warning');
            this.elements.cepInput?.focus();
            return;
        }

        if (!Validator.isValidCEP(cep)) {
            NotificationManager.show('Por favor, digite um CEP válido com 8 dígitos', 'warning');
            this.elements.cepInput?.focus();
            return;
        }

        this.showLoading();

        try {
            const endereco = await this.cepService.buscarEndereco(cep);
            
            this.updateLoadingText(`Buscando peneiras próximas a ${endereco.formatted}`);
            
            // Simular delay para melhor UX
            await HttpClient.delay(CONFIG.UI.LOADING_MIN_TIME);
            
            this.searchPeneiras(endereco);
            
        } catch (error) {
            NotificationManager.show(error.message, 'error');
            this.hideLoading();
        }
    }

    searchPeneiras(endereco) {
        try {
            // Simular coordenadas do usuário baseado no endereço
            const userCoords = this.geocodeLocation(endereco.formatted);
            
            const results = PeneiraService.buscarPeneiras(userCoords);
            
            this.state.currentResults = results;
            this.state.userLocation = userCoords;
            
            this.displayResults(results);
            this.hideLoading();
            
        } catch (error) {
            NotificationManager.show('Erro ao buscar peneiras', 'error');
            this.hideLoading();
        }
    }

    geocodeLocation(location) {
        // Simulação simples - em produção usar API real
        const coordinates = {
            "São Paulo, SP": { lat: -23.5505, lng: -46.6333 },
            "Rio de Janeiro, RJ": { lat: -22.9068, lng: -43.1729 },
            "Belo Horizonte, MG": { lat: -19.9167, lng: -43.9345 },
            "Porto Alegre, RS": { lat: -30.0346, lng: -51.2177 }
        };
        
        return coordinates[location] || { lat: -23.5505, lng: -46.6333 };
    }

    // ==================== MÉTODOS DE GEOLOCALIZAÇÃO ====================

    async getCurrentLocation() {
        this.showLocationLoading();

        try {
            const position = await GeolocationService.getCurrentPosition();
            const address = await GeolocationService.reverseGeocode(position.lat, position.lng);
            
            this.elements.cepInput.value = address;
            this.hideLocationLoading();
            this.handleSearch();
            
        } catch (error) {
            NotificationManager.show(error.message, 'error');
            this.hideLocationLoading();
        }
    }

    // ==================== MÉTODOS DE UI ====================

    displayResults(results) {
        if (!this.elements.resultsContainer) return;

        if (results.length === 0) {
            this.showNoResults();
            return;
        }

        this.elements.resultsContainer.innerHTML = results.map(peneira => 
            this.createPeneiraCard(peneira)
        ).join('');

        this.showResults();
        this.bindResultEvents();
    }

    createPeneiraCard(peneira) {
        const statusClass = peneira.status === 'aberta' ? 'status-open' : 'status-closed';
        const statusText = peneira.status === 'aberta' ? 'Inscrições Abertas' : 'Inscrições Encerradas';
        const distanceText = peneira.distancia ? GeoUtils.formatDistance(peneira.distancia) : '';
        const availabilityPercent = ((peneira.totalVagas - peneira.vagasDisponiveis) / peneira.totalVagas) * 100;

        return `
            <div class="peneira-card" data-peneira-id="${peneira.id}">
                <div class="peneira-header">
                    <div class="peneira-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        <span>${statusText}</span>
                    </div>
                    ${distanceText ? `<div class="peneira-distance">${distanceText}</div>` : ''}
                </div>
                
                <div class="peneira-content">
                    <h3 class="peneira-title">${peneira.titulo}</h3>
                    <div class="peneira-club">
                        <i class="fas fa-shield-alt"></i>
                        <span>${peneira.clube}</span>
                    </div>
                    
                    <div class="peneira-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${this.formatDate(peneira.data)} às ${peneira.horario}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${peneira.endereco}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <span>${peneira.categoria}</span>
                        </div>
                    </div>
                    
                    <div class="peneira-availability">
                        <div class="availability-text">
                            <span>${peneira.vagasDisponiveis} de ${peneira.totalVagas} vagas disponíveis</span>
                        </div>
                        <div class="availability-bar">
                            <div class="availability-progress" style="width: ${availabilityPercent}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="peneira-actions">
                    <button class="btn-secondary peneira-info-btn" onclick="app.openPeneiraModal(${peneira.id})">
                        <i class="fas fa-info-circle"></i>
                        Ver Detalhes
                    </button>
                    ${peneira.status === 'aberta' ? `
                        <button class="btn-primary peneira-apply-btn" onclick="app.redirectToApplication(${peneira.id})">
                            <i class="fas fa-user-plus"></i>
                            Me Inscrever
                        </button>
                    ` : `
                        <button class="btn-disabled" disabled>
                            <i class="fas fa-times-circle"></i>
                            Encerrada
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    bindResultEvents() {
        // Eventos já são tratados via onclick nos botões
        // Aqui podemos adicionar eventos adicionais se necessário
    }

    openPeneiraModal(peneiraId) {
        const peneira = PeneiraService.getPeneiraById(peneiraId);
        if (!peneira) return;

        // Implementar modal - código do modal seria adicionado aqui
        console.log('Abrir modal para peneira:', peneira);
    }

    redirectToApplication(peneiraId) {
        const peneira = PeneiraService.getPeneiraById(peneiraId);
        if (!peneira) return;

        if (peneira.status !== 'aberta') {
            NotificationManager.show('Esta peneira não está mais disponível para inscrição', 'warning');
            return;
        }

        window.location.href = peneira.linkInscricao;
    }

    // ==================== MÉTODOS DE FILTRO ====================

    setActiveFilter(filter) {
        this.elements.filterBtns?.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
        });
        this.state.currentFilter = filter;
    }

    applyFilter(filter) {
        let filteredResults = [...this.state.currentResults];

        switch (filter) {
            case 'distance':
                filteredResults.sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
                break;
            case 'date':
                filteredResults.sort((a, b) => new Date(a.data) - new Date(b.data));
                break;
            case 'all':
            default:
                // Manter ordem original
                break;
        }

        this.displayResults(filteredResults);
    }

    // ==================== MÉTODOS DE LOADING ====================

    showLoading() {
        this.state.isLoading = true;
        this.elements.loadingOverlay?.style.setProperty('display', 'flex');
        this.elements.searchBtn?.classList.add('loading');
    }

    hideLoading() {
        this.state.isLoading = false;
        this.elements.loadingOverlay?.style.setProperty('display', 'none');
        this.elements.searchBtn?.classList.remove('loading');
    }

    updateLoadingText(text) {
        if (this.elements.loadingAddress) {
            this.elements.loadingAddress.textContent = text;
        }
    }

    showLocationLoading() {
        if (this.elements.getLocationBtn) {
            this.elements.getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
    }

    hideLocationLoading() {
        if (this.elements.getLocationBtn) {
            this.elements.getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
        }
    }

    showResults() {
        this.elements.results?.style.setProperty('display', 'block');
        this.elements.noResults?.style.setProperty('display', 'none');
    }

    showNoResults() {
        this.elements.results?.style.setProperty('display', 'block');
        this.elements.resultsContainer?.style.setProperty('display', 'none');
        this.elements.noResults?.style.setProperty('display', 'block');
    }

    // ==================== MÉTODOS DE NAVEGAÇÃO ====================

    toggleMobileMenu() {
        this.elements.navMenu?.classList.toggle('active');
        this.elements.navToggle?.classList.toggle('active');
    }

    handleScroll() {
        const scrollY = window.scrollY;

        // Header effect
        if (scrollY > CONFIG.UI.SCROLL_THRESHOLD) {
            this.elements.header?.classList.add('scrolled');
        } else {
            this.elements.header?.classList.remove('scrolled');
        }

        // Back to top button
        if (scrollY > CONFIG.UI.BACK_TO_TOP_THRESHOLD) {
            this.elements.backToTop?.style.setProperty('display', 'flex');
        } else {
            this.elements.backToTop?.style.setProperty('display', 'none');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // ==================== MÉTODOS DE ANIMAÇÃO ====================

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-target'));
                    this.animateNumber(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(stat => observer.observe(stat));
    }

    animateNumber(element, target) {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (target >= 1000) {
                element.textContent = (current / 1000).toFixed(0) + 'k+';
            } else {
                element.textContent = Math.floor(current) + '+';
            }
        }, 20);
    }

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.1 });
        
        animatedElements.forEach(el => observer.observe(el));
    }

    setupScrollIndicator() {
        const scrollArrow = document.querySelector('.scroll-arrow');
        if (scrollArrow) {
            scrollArrow.addEventListener('click', () => {
                document.getElementById('como-funciona')?.scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }
    }

    // ==================== MÉTODOS UTILITÁRIOS ====================

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// ==================== INICIALIZAÇÃO ====================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new PeneirasBRApp();
});

// Expor globalmente para compatibilidade
window.app = app;

