// Dados simulados de peneiras de futebol - VERSÃO SIMPLIFICADA
const peneirasData = [
    {
        id: 1,
        titulo: "Peneira Sub-15 e Sub-17",
        clube: "Santos FC",
        endereco: null, // Será preenchido com o CEP do usuário
        data: "2024-08-15",
        horario: "14:00",
        categoria: "Sub-15, Sub-17",
        requisitos: "Idade entre 13-17 anos",
        contato: "(13) 3257-4000",
        distancia: 2.5,
        lat: -23.9618,
        lng: -46.3322,
        status: "aberta",
        vagasDisponiveis: 8,
        totalVagas: 50,
        prazoInscricao: "2024-08-10",
        inscricaoEncerrada: false
    },
    {
        id: 2,
        titulo: "Peneira Categoria de Base",
        clube: "São Paulo FC",
        endereco: null, // Será preenchido com o CEP do usuário
        data: "2024-08-20",
        horario: "09:00",
        categoria: "Sub-13, Sub-15",
        requisitos: "Idade entre 11-15 anos",
        contato: "(11) 3670-8100",
        distancia: 5.8,
        lat: -23.5505,
        lng: -46.6333,
        status: "encerrada",
        vagasDisponiveis: 0,
        totalVagas: 40,
        prazoInscricao: "2024-08-15",
        inscricaoEncerrada: true
    },
    {
        id: 3,
        titulo: "Peneira Feminina",
        clube: "Corinthians",
        endereco: null, // Será preenchido com o CEP do usuário
        data: "2024-08-25",
        horario: "15:30",
        categoria: "Sub-16, Sub-18",
        requisitos: "Idade entre 14-18 anos (feminino)",
        contato: "(11) 2095-3000",
        distancia: 8.2,
        lat: -23.5629,
        lng: -46.6544,
        status: "aberta",
        vagasDisponiveis: 3,
        totalVagas: 30,
        prazoInscricao: "2024-08-20",
        inscricaoEncerrada: false
    },
    {
        id: 4,
        titulo: "Peneira Juvenil",
        clube: "Palmeiras",
        endereco: null, // Será preenchido com o CEP do usuário
        data: "2024-09-01",
        horario: "10:00",
        categoria: "Sub-17, Sub-20",
        requisitos: "Idade entre 15-20 anos",
        contato: "(11) 3873-2400",
        distancia: 12.1,
        lat: -23.5629,
        lng: -46.6544,
        status: "aberta",
        vagasDisponiveis: 15,
        totalVagas: 60,
        prazoInscricao: "2024-08-28",
        inscricaoEncerrada: false
    },
    {
        id: 5,
        titulo: "Peneira Regional",
        clube: "Red Bull Bragantino",
        endereco: null, // Será preenchido com o CEP do usuário
        data: "2024-09-05",
        horario: "13:00",
        categoria: "Sub-14, Sub-16",
        requisitos: "Idade entre 12-16 anos",
        contato: "(11) 4034-1900",
        distancia: 45.3,
        lat: -22.9519,
        lng: -46.5428,
        status: "encerrada",
        vagasDisponiveis: 0,
        totalVagas: 25,
        prazoInscricao: "2024-09-01",
        inscricaoEncerrada: true
    },
    {
        id: 6,
        titulo: "Peneira Escolar",
        clube: "Ponte Preta",
        endereco: null, // Será preenchido com o CEP do usuário
        data: "2024-09-10",
        horario: "14:30",
        categoria: "Sub-13, Sub-15",
        requisitos: "Idade entre 11-15 anos",
        contato: "(19) 3231-3444",
        distancia: 35.7,
        lat: -22.9056,
        lng: -47.0608,
        status: "aberta",
        vagasDisponiveis: 22,
        totalVagas: 35,
        prazoInscricao: "2024-09-07",
        inscricaoEncerrada: false
    }
];

// Cache para armazenar endereços já consultados
const enderecoCache = new Map();

// Função para buscar endereço por CEP via ViaCEP
async function buscarEnderecoPorCEP(cep) {
    // Limpar CEP (remover hífen e espaços)
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Verificar se já está no cache
    if (enderecoCache.has(cepLimpo)) {
        console.log(`CEP ${cep} encontrado no cache:`, enderecoCache.get(cepLimpo));
        return enderecoCache.get(cepLimpo);
    }
    
    // Validar formato do CEP
    if (cepLimpo.length !== 8) {
        console.error(`CEP inválido: ${cep} (deve ter 8 dígitos)`);
        return 'CEP inválido';
    }
    
    try {
        console.log(`Buscando CEP ${cep} (${cepLimpo}) na API ViaCEP...`);
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Resposta da API para CEP ${cep}:`, data);
        
        if (data.erro) {
            throw new Error('CEP não encontrado na base de dados');
        }
        
        if (!data.localidade || !data.uf) {
            throw new Error('Dados incompletos retornados pela API');
        }
        
        const endereco = `${data.localidade}, ${data.uf}`;
        console.log(`Endereço formatado para CEP ${cep}: ${endereco}`);
        
        // Armazenar no cache
        enderecoCache.set(cepLimpo, endereco);
        
        return endereco;
    } catch (error) {
        console.error(`Erro ao buscar CEP ${cep}:`, error.message);
        // Retornar um endereço padrão em caso de erro
        return 'Localização não disponível';
    }
}

// Variáveis globais
let userLocation = null;
let currentResults = [];
let currentFilter = 'all';

// Elementos DOM
const cepInput = document.getElementById('cep-input');
const getLocationBtn = document.getElementById('get-location-btn');
const searchBtn = document.getElementById('search-btn');
const resultsSection = document.getElementById('results');
const resultsContainer = document.getElementById('results-container');
const noResults = document.getElementById('no-results');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingAddress = document.getElementById('loading-address');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const backToTopBtn = document.getElementById('back-to-top');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const header = document.querySelector('.header');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Inicializando aplicação...');
    
    // Event listeners para busca
    searchBtn.addEventListener('click', handleSearch);
    cepInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Event listener para obter localização atual
    getLocationBtn.addEventListener('click', getCurrentLocation);
    
    // Event listeners para sugestões
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const location = this.getAttribute('data-location');
            cepInput.value = location;
            handleSearch();
        });
    });
    
    // Event listeners para filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setActiveFilter(filter);
            applyFilter(filter);
        });
    });
    
    // Event listener para menu mobile
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', toggleMobileMenu);
        
        // Fechar menu ao clicar em um link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }
    
    // Event listener para botão voltar ao topo
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    // Event listeners para scroll
    window.addEventListener('scroll', handleScroll);
    
    // Animações de scroll
    setupScrollAnimations();
    
    // Animação dos números das estatísticas
    animateStats();
    
    // Configurar indicador de scroll
    setupScrollIndicator();
}

// Função para alternar menu mobile
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

// Função para fechar menu mobile
function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

// Função para lidar com scroll
function handleScroll() {
    const scrollY = window.scrollY;
    
    // Header com efeito de scroll
    if (scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    // Botão voltar ao topo
    if (scrollY > 500) {
        backToTopBtn.style.display = 'flex';
        backToTopBtn.style.opacity = '1';
    } else {
        backToTopBtn.style.opacity = '0';
        setTimeout(() => {
            if (window.scrollY <= 500) {
                backToTopBtn.style.display = 'none';
            }
        }, 300);
    }
}

// Função para voltar ao topo
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Função para configurar indicador de scroll
function setupScrollIndicator() {
    const scrollArrow = document.querySelector('.scroll-arrow');
    if (scrollArrow) {
        scrollArrow.addEventListener('click', () => {
            document.getElementById('como-funciona').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
}

// Função para animar estatísticas
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateNumber(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

// Função para animar números
function animateNumber(element, target) {
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

// Função para obter localização atual do usuário
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocalização não é suportada pelo seu navegador', 'error');
        return;
    }
    
    showLoading();
    getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Simular busca de endereço reverso
            reverseGeocode(userLocation.lat, userLocation.lng)
                .then(address => {
                    cepInput.value = address;
                    hideLoading();
                    getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    handleSearch();
                })
                .catch(error => {
                    hideLoading();
                    getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    showNotification('Erro ao obter endereço', 'error');
                });
        },
        function(error) {
            hideLoading();
            getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            
            let message = 'Erro ao obter localização';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Permissão de localização negada';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Localização indisponível';
                    break;
                case error.TIMEOUT:
                    message = 'Tempo limite excedido';
                    break;
            }
            showNotification(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Função simulada de geocodificação reversa
function reverseGeocode(lat, lng) {
    return new Promise((resolve, reject) => {
        // Simular delay de API
        setTimeout(() => {
            // Coordenadas aproximadas de algumas cidades brasileiras
            const cities = [
                { name: "São Paulo, SP", lat: -23.5505, lng: -46.6333 },
                { name: "Rio de Janeiro, RJ", lat: -22.9068, lng: -43.1729 },
                { name: "Belo Horizonte, MG", lat: -19.9167, lng: -43.9345 },
                { name: "Porto Alegre, RS", lat: -30.0346, lng: -51.2177 },
                { name: "Salvador, BA", lat: -12.9714, lng: -38.5014 },
                { name: "Brasília, DF", lat: -15.8267, lng: -47.9218 }
            ];
            
            // Encontrar cidade mais próxima
            let closestCity = cities[0];
            let minDistance = calculateDistance(lat, lng, cities[0].lat, cities[0].lng);
            
            cities.forEach(city => {
                const distance = calculateDistance(lat, lng, city.lat, city.lng);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCity = city;
                }
            });
            
            resolve(closestCity.name);
        }, 1000);
    });
}

// Função para calcular distância entre duas coordenadas
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Função principal de busca
async function handleSearch() {
    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        showNotification('Por favor, digite um CEP válido com 8 dígitos.', 'warning');
        cepInput.focus();
        return;
    }

    showLoading(true);

    try {
        console.log(`Buscando endereço para CEP do usuário: ${cep}`);
        
        // Buscar endereço do CEP digitado pelo usuário
        const enderecoUsuario = await buscarEnderecoPorCEP(cep);
        
        if (enderecoUsuario === 'CEP inválido' || enderecoUsuario === 'Localização não disponível') {
            showNotification('CEP não encontrado. Verifique o número digitado.', 'error');
            hideLoading();
            return;
        }

        console.log(`Endereço do usuário encontrado: ${enderecoUsuario}`);
        
        // Aplicar o endereço do usuário a TODAS as peneiras
        peneirasData.forEach(peneira => {
            peneira.endereco = enderecoUsuario;
        });
        
        console.log(`Endereço "${enderecoUsuario}" aplicado a todas as ${peneirasData.length} peneiras`);

        loadingAddress.textContent = `Buscando peneiras próximas a ${enderecoUsuario}`;
        document.getElementById('loading-neighborhood').textContent = `Todas as peneiras mostrarão: ${enderecoUsuario}`;

        // Simular delay de busca
        setTimeout(() => {
            searchPeneiras(enderecoUsuario);
        }, 2500);

    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        showNotification('Erro ao buscar CEP. Tente novamente.', 'error');
        hideLoading();
    }
}

// Função para buscar peneiras
function searchPeneiras(location) {
    try {
        // Simular geocodificação da localização digitada
        const userCoords = geocodeLocation(location);
        
        // Calcular distâncias e filtrar resultados
        const results = peneirasData.map(peneira => {
            const distance = calculateDistance(
                userCoords.lat, userCoords.lng,
                peneira.lat, peneira.lng
            );
            
            return {
                ...peneira,
                distancia: Math.round(distance * 10) / 10
            };
        }).sort((a, b) => a.distancia - b.distancia);
        
        // Filtrar apenas peneiras em um raio de 100km
        currentResults = results.filter(peneira => peneira.distancia <= 100);
        
        hideLoading();
        displayResults(currentResults);
        
    } catch (error) {
        hideLoading();
        showNotification('Erro ao buscar peneiras. Tente novamente.', 'error');
    }
}

// Função simulada de geocodificação
function geocodeLocation(location) {
    // Coordenadas simuladas baseadas na localização
    const locationMap = {
        'são paulo': { lat: -23.5505, lng: -46.6333 },
        'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
        'belo horizonte': { lat: -19.9167, lng: -43.9345 },
        'porto alegre': { lat: -30.0346, lng: -51.2177 },
        'salvador': { lat: -12.9714, lng: -38.5014 },
        'brasília': { lat: -15.8267, lng: -47.9218 },
        'santos': { lat: -23.9618, lng: -46.3322 },
        'campinas': { lat: -22.9056, lng: -47.0608 }
    };
    
    const normalizedLocation = location.toLowerCase();
    
    // Procurar por correspondência parcial
    for (const [key, coords] of Object.entries(locationMap)) {
        if (normalizedLocation.includes(key) || key.includes(normalizedLocation.split(',')[0].trim().toLowerCase())) {
            return coords;
        }
    }
    
    // Retornar São Paulo como padrão
    return locationMap['são paulo'];
}

// Função para definir filtro ativo
function setActiveFilter(filter) {
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        }
    });
    currentFilter = filter;
}

// Função para aplicar filtro
function applyFilter(filter) {
    let filteredResults = [...currentResults];
    
    switch (filter) {
        case 'distance':
            filteredResults.sort((a, b) => a.distancia - b.distancia);
            break;
        case 'date':
            filteredResults.sort((a, b) => new Date(a.data) - new Date(b.data));
            break;
        default:
            // 'all' - manter ordem original
            break;
    }
    
    displayResults(filteredResults);
}

// Função para exibir resultados
function displayResults(results) {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    if (results.length === 0) {
        resultsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    resultsContainer.style.display = 'grid';
    resultsContainer.innerHTML = '';
    
    // Criar cards
    results.forEach((peneira, index) => {
        const resultCard = createResultCard(peneira);
        resultsContainer.appendChild(resultCard);
        
        // Animação escalonada
        setTimeout(() => {
            resultCard.classList.add('animate-fade-in-up');
        }, index * 100);
    });
}

// FUNÇÃO MODIFICADA PARA CRIAR CARD DE RESULTADO - COM BOTÃO "QUERO PARTICIPAR"
function createResultCard(peneira) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const dataFormatada = formatDate(peneira.data);
    const prazoFormatado = formatDate(peneira.prazoInscricao);
    const distanciaTexto = peneira.distancia < 1 ? 
        `${Math.round(peneira.distancia * 1000)}m` : 
        `${peneira.distancia}km`;
    
    // Determinar status e informações de vagas de forma mais elegante
    const statusInfo = getStatusInfo(peneira);
    const vagasInfo = getVagasInfo(peneira);
    const prazoInfo = getPrazoInfo(peneira);
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title-section">
                <h3 class="card-title">${peneira.titulo}</h3>
                <p class="card-club">${peneira.clube}</p>
            </div>
            <div class="card-badges">
                <span class="distance-badge">${distanciaTexto}</span>
                ${statusInfo.badge}
            </div>
        </div>
        
        ${statusInfo.banner}
        
        <div class="card-content">
            <div class="event-details">
                <div class="detail-row primary">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${dataFormatada} às ${peneira.horario}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${peneira.endereco || 'Endereço será definido após busca'}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-users"></i>
                    <span>${peneira.categoria}</span>
                </div>
            </div>
            
            ${vagasInfo.html}
            ${prazoInfo.html}
        </div>
        
        <div class="card-actions">
            ${peneira.status === 'aberta' ? `
                <button class="btn-primary" onclick="openPeneiraModal(${peneira.id})">
                    <i class="fas fa-futbol"></i>
                    <span>Quero Participar</span>
                </button>
            ` : `
                <button class="btn-disabled" disabled>
                    <i class="fas fa-lock"></i>
                    <span>Encerrada</span>
                </button>
            `}
        </div>
    `;
    
    // Adicionar classe de status ao card
    card.classList.add(`card-${peneira.status}`);
    
    return card;
}

// Função refinada para obter informações de status
function getStatusInfo(peneira) {
    if (peneira.status === 'encerrada') {
        return {
            badge: '<span class="status-badge status-closed">Encerrada</span>',
            banner: '<div class="status-banner closed"><i class="fas fa-times-circle"></i><span>Inscrições Encerradas</span></div>'
        };
    }
    
    // Para peneiras abertas, mostrar badge de disponibilidade baseado nas vagas
    let availabilityBadge = '';
    if (peneira.vagasDisponiveis <= 5) {
        availabilityBadge = '<span class="status-badge status-urgent">Últimas Vagas</span>';
    } else if (peneira.vagasDisponiveis <= 10) {
        availabilityBadge = '<span class="status-badge status-limited">Vagas Limitadas</span>';
    } else {
        availabilityBadge = '<span class="status-badge status-open">Disponível</span>';
    }
    
    return {
        badge: availabilityBadge,
        banner: ''
    };
}

// Função refinada para obter informações de vagas
function getVagasInfo(peneira) {
    if (peneira.status !== 'aberta') {
        return { html: '' };
    }
    
    const percentualOcupado = ((peneira.totalVagas - peneira.vagasDisponiveis) / peneira.totalVagas) * 100;
    
    return {
        html: `
            <div class="availability-section">
                <div class="availability-header">
                    <span class="availability-label">Disponibilidade</span>
                    <span class="availability-count">${peneira.vagasDisponiveis} de ${peneira.totalVagas} vagas</span>
                </div>
                <div class="availability-bar">
                    <div class="availability-progress" style="width: ${percentualOcupado}%"></div>
                </div>
            </div>
        `
    };
}

// Função refinada para obter informações de prazo
function getPrazoInfo(peneira) {
    if (peneira.status !== 'aberta') {
        return { html: '' };
    }
    
    const diasRestantes = getDiasRestantes(peneira.prazoInscricao);
    const prazoFormatado = formatDate(peneira.prazoInscricao);
    
    return {
        html: `
            <div class="deadline-section">
                <div class="deadline-info">
                    <i class="fas fa-clock"></i>
                    <div class="deadline-text">
                        <span class="deadline-label">Prazo de inscrição</span>
                        <span class="deadline-date">${prazoFormatado}</span>
                        <span class="deadline-remaining">${diasRestantes}</span>
                    </div>
                </div>
            </div>
        `
    };
}

// Função para calcular dias restantes
function getDiasRestantes(prazoInscricao) {
    const hoje = new Date();
    const prazo = new Date(prazoInscricao);
    const diffTime = prazo - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'Prazo expirado';
    } else if (diffDays === 0) {
        return 'Último dia!';
    } else if (diffDays === 1) {
        return 'Termina amanhã';
    } else if (diffDays <= 7) {
        return `${diffDays} dias restantes`;
    } else {
        return `${diffDays} dias restantes`;
    }
}

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('pt-BR', options);
}

// NOVA FUNÇÃO: Abrir modal com informações da peneira
function openPeneiraModal(peneiraId) {
    const peneira = peneirasData.find(p => p.id === peneiraId);
    if (!peneira) return;
    
    // Preencher informações do modal
    document.getElementById('modal-title').textContent = peneira.titulo;
    document.getElementById('modal-clube').textContent = peneira.clube;
    document.getElementById('modal-data-horario').textContent = `${formatDate(peneira.data)} às ${peneira.horario}`;
    document.getElementById('modal-endereco').textContent = peneira.endereco || 'Endereço será definido após busca';
    document.getElementById('modal-categoria').textContent = peneira.categoria;
    document.getElementById('modal-requisitos').textContent = peneira.requisitos;
    document.getElementById('modal-contato').textContent = peneira.contato;
    document.getElementById('modal-prazo').textContent = formatDate(peneira.prazoInscricao);
    
    // Informações de vagas (apenas para peneiras abertas)
    if (peneira.status === 'aberta') {
        const percentualOcupado = ((peneira.totalVagas - peneira.vagasDisponiveis) / peneira.totalVagas) * 100;
        document.getElementById('modal-vagas').textContent = `${peneira.vagasDisponiveis} vagas disponíveis de ${peneira.totalVagas} total`;
        document.getElementById('modal-availability-progress').style.width = `${percentualOcupado}%`;
        document.getElementById('modal-vagas-info').style.display = 'block';
    } else {
        document.getElementById('modal-vagas-info').style.display = 'none';
    }
    
    // Mostrar modal
    const modal = document.getElementById('peneira-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Fechar modal ao clicar fora dele
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePeneiraModal();
        }
    });
}

// NOVA FUNÇÃO: Fechar modal
function closePeneiraModal() {
    const modal = document.getElementById('peneira-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event listener para fechar modal com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePeneiraModal();
    }
});

// Função para mostrar loading
function showLoading(isCepSearch = false) {
    if (!isCepSearch) {
        loadingAddress.textContent = 'Buscando peneiras...';
    }
    loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Função para esconder loading
function hideLoading() {
    loadingOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notification-container');
    container.appendChild(notification);
    
    // Remover notificação após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Função para configurar animações de scroll
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar elementos que devem ser animados
    const animatedElements = document.querySelectorAll('.step-card, .feature-card, .testimonial-card');
    animatedElements.forEach(el => observer.observe(el));
}
