// Configurações globais
const CONFIG = {
    SENHA: "2020",
    API_KEY: "AIzaSyBpdK2e9XfRgQdcf-cnx4nV1z6BaDeeYWM",
    FOLDER_IDS: {
        ENGLISH: "1pOe6fvSe6w08taSC3UnoOQnPUQAZcdw8",
        TG: "1Z7rjMo1jbdxfa5TR6aDo4j-8GjdqzuOJ",
        EXTRA: "1MdxVzRvvGXFezEcsPSSoefglIyD_nOM-",
        EXTRAS_ALUNOS: "1Edwnbmic1sK7krY-0sG_NTEpcA3DvpLr"
    },
    ENGLISH_FOLDER_NAME: "English",
    SENHA_PROTEGIDA: "2020"
};

// Cache global
const cacheConteudo = new Map();
const cacheLivros = new Map();

// Estado da aplicação
let estadoApp = {
    secoesExpandidas: {
        novos: false,
        kids: false,
        antigos: false,
        outrosIdiomas: false,
        extras: false
    },
    jogoAtivo: false,
    mesCalendario: new Date().getMonth(),
    anoCalendario: new Date().getFullYear(),
    eventoEditando: null
};

// ===== SISTEMA DE CALENDÁRIO COMPLETO =====
let eventosCalendario = JSON.parse(localStorage.getItem('eventosCalendario')) || [];

function inicializarCalendario() {
    atualizarCalendario();
    exibirEventosProximos();
}

function atualizarCalendario() {
    const mesElement = document.getElementById('mesAtual');
    const gridElement = document.getElementById('calendarioGrid');

    if (!mesElement || !gridElement) return;

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    mesElement.textContent = `${meses[estadoApp.mesCalendario]} de ${estadoApp.anoCalendario}`;

    const primeiroDia = new Date(estadoApp.anoCalendario, estadoApp.mesCalendario, 1);
    const ultimoDia = new Date(estadoApp.anoCalendario, estadoApp.mesCalendario + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaInicio = primeiroDia.getDay();

    let html = '';

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    diasSemana.forEach(dia => html += `<div class="calendario-dia-header">${dia}</div>`);

    for (let i = 0; i < diaInicio; i++) html += `<div class="calendario-dia vazio"></div>`;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataStr = `${estadoApp.anoCalendario}-${String(estadoApp.mesCalendario + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const eventosDia = eventosCalendario.filter(ev => String(ev.data).split('T')[0] === dataStr);

        const dataAtual = new Date(estadoApp.anoCalendario, estadoApp.mesCalendario, dia);
        const isHoje = dataAtual.toDateString() === hoje.toDateString();
        const isFimSemana = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;

        html += `
            <div class="calendario-dia ${isHoje ? 'hoje' : ''} ${isFimSemana ? 'fim-semana' : ''}"
                 onclick="mostrarEventosDia('${dataStr}')">
                <div class="dia-numero">${dia}</div>
                ${eventosDia.length > 0 ? `
                    <div class="evento-indicador">
                        ${eventosDia.length}
                        <div class="evento-tooltip">
                            ${eventosDia.map(e => `<div>• ${e.titulo}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    gridElement.innerHTML = html;
}

function mudarMes(direcao) {
    estadoApp.mesCalendario += direcao;
    if (estadoApp.mesCalendario < 0) {
        estadoApp.mesCalendario = 11;
        estadoApp.anoCalendario--;
    } else if (estadoApp.mesCalendario > 11) {
        estadoApp.mesCalendario = 0;
        estadoApp.anoCalendario++;
    }
    atualizarCalendario();
}

function mostrarModalEvento(dataOpcional) {
    const modal = document.getElementById('modalEvento');
    if (!modal) return;

    modal.classList.remove('hidden');

    document.getElementById('eventoTitulo').value = '';
    document.getElementById('eventoDescricao').value = '';

    const data = dataOpcional || formatarDataInput(new Date());
    document.getElementById('eventoData').value = data;

    estadoApp.eventoEditando = null;
}

function fecharModalEvento() {
    const modal = document.getElementById('modalEvento');
    if (modal) modal.classList.add('hidden');
    estadoApp.eventoEditando = null;
}

function salvarEvento() {
    const titulo = document.getElementById('eventoTitulo').value.trim();
    const data = document.getElementById('eventoData').value;
    const descricao = document.getElementById('eventoDescricao').value.trim();

    if (!titulo || !data) {
        alert('Preencha o título e a data do evento.');
        return;
    }

    if (estadoApp.eventoEditando) {
        const index = eventosCalendario.findIndex(e => e.id === estadoApp.eventoEditando);
        if (index !== -1) {
            eventosCalendario[index] = {
                ...eventosCalendario[index],
                titulo,
                data,
                descricao
            };
            alert('Evento atualizado!');
        }
    } else {
        const novoEvento = {
            id: Date.now(),
            titulo,
            data,
            descricao
        };
        eventosCalendario.push(novoEvento);
        alert('Evento criado!');
    }

    localStorage.setItem('eventosCalendario', JSON.stringify(eventosCalendario));

    // Fechar o modal de evento PRINCIPAL corretamente
    const modalEvento = document.getElementById('modalEvento');
    if (modalEvento) {
        modalEvento.classList.add('hidden');
    }

    // Atualiza o calendário e a lista
    atualizarCalendario();
    exibirEventosProximos();

    // Remove o modal do dia, se ainda estiver aberto
    const modalEventosDia = document.querySelector('.modal-eventos-dia');
    if (modalEventosDia) modalEventosDia.remove();

    estadoApp.eventoEditando = null;
}

function mostrarEventosDia(dataStr) {
    const eventosDia = eventosCalendario.filter(ev => String(ev.data).split('T')[0] === dataStr);

    const modalExistente = document.querySelector('.modal-eventos-dia');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.className = 'modal modal-eventos-dia';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📅 Eventos de ${formatarData(dataStr)}</h2>
                <span class="close-modal" onclick="this.closest('.modal').remove()">×</span>
            </div>
            <div class="modal-body">
                <div class="eventos-dia-lista">
                    ${eventosDia.length === 0 ?
            '<p class="sem-eventos-dia">Nenhum evento para esta data</p>' :
            eventosDia.map(ev => `
                            <div class="evento-dia-item">
                                <div class="evento-dia-titulo">${ev.titulo}</div>
                                ${ev.descricao ? `<div class="evento-dia-descricao">${ev.descricao}</div>` : ''}
                                <div class="evento-dia-actions">
                                    <button onclick="editarEvento(${ev.id}); this.closest('.modal').remove();" class="evento-editar">✏️ Editar</button>
                                    <button onclick="excluirEvento(${ev.id}); this.closest('.modal').remove();" class="evento-excluir">🗑️ Excluir</button>
                                </div>
                            </div>
                        `).join('')}
                </div>
                <div class="modal-buttons">
                    <button class="confirm-btn" onclick="fecharModalEventosDiaEMostrarCriar('${dataStr}')">➕ Adicionar Evento</button>
                    <button class="cancel-btn" onclick="this.closest('.modal').remove()">Fechar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function fecharModalEventosDiaEMostrarCriar(dataStr) {
    // Fecha o modal de eventos do dia
    const modalEventosDia = document.querySelector('.modal-eventos-dia');
    if (modalEventosDia) {
        modalEventosDia.remove();
    }

    // Abre o modal de criar evento
    mostrarModalEvento(dataStr);
}

function editarEvento(eventoId) {
    const evento = eventosCalendario.find(e => e.id === eventoId);
    if (!evento) return;

    const modal = document.getElementById('modalEvento');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.getElementById('eventoTitulo').value = evento.titulo;
    document.getElementById('eventoData').value = evento.data;
    document.getElementById('eventoDescricao').value = evento.descricao || '';

    estadoApp.eventoEditando = eventoId;
}

function excluirEvento(eventoId) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    eventosCalendario = eventosCalendario.filter(e => e.id !== eventoId);
    localStorage.setItem('eventosCalendario', JSON.stringify(eventosCalendario));

    atualizarCalendario();
    exibirEventosProximos();
    alert('Evento excluído!');
}

function exibirEventosProximos() {
    const container = document.getElementById('listaEventosProximos');
    if (!container) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const umaSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

    const eventosProximos = eventosCalendario
        .map(ev => {
            const [ano, mes, dia] = String(ev.data).split('-').map(Number);
            return { ...ev, _dateObj: new Date(ano, mes - 1, dia) };
        })
        .sort((a, b) => a._dateObj - b._dateObj);

    if (eventosProximos.length === 0) {
        container.innerHTML = '<p class="sem-eventos">Nenhum evento para os próximos 7 dias</p>';
        return;
    }

    const html = eventosProximos.map(ev => `
        <div class="evento-proximo">
            <div class="evento-data">${formatarData(ev.data)}</div>
            <div class="evento-titulo">${ev.titulo}</div>
            ${ev.descricao ? `<div class="evento-descricao">${ev.descricao}</div>` : ''}
            <div class="evento-actions">
                <button onclick="editarEvento(${ev.id})" class="evento-editar">✏️ Editar</button>
                <button onclick="excluirEvento(${ev.id})" class="evento-excluir">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function formatarData(dataString) {
    const parts = String(dataString).split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatarDataInput(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// ===== FIM DO SISTEMA DE CALENDÁRIO =====

// ===== SISTEMA DE NAVEGAÇÃO =====
function abrirSecao(secao) {
    console.log('Abrindo seção:', secao);

    if (secao === 'teacher' || secao === 'admin') {
        mostrarModalSenha(secao);
        return;
    }
    abrirSecaoDiretamente(secao);
}

function abrirSecaoDiretamente(secao) {
    console.log('Abrindo seção diretamente:', secao);

    // Esconder menu principal
    const menuPrincipal = document.getElementById('menuPrincipal');
    if (menuPrincipal) {
        menuPrincipal.classList.add('hidden');
        menuPrincipal.style.display = 'none';
    }

    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(s => {
        s.style.display = 'none';
    });

    // Mostrar seção selecionada
    const secaoElement = document.getElementById(secao);
    if (!secaoElement) return;
    secaoElement.style.display = 'block';

    // Inicializar seções específicas
    if (secao === 'teacher') {
        carregarPastas();
    } else if (secao === 'calendario') {
        inicializarCalendario();
    } else if (secao === 'favoritos') {
        exibirFavoritos();
    }
}

// ===== SISTEMA DE ALUNOS ATUALIZADO =====
function abrirSubSecao(id) {
    pararJogo();
    
    // Esconder todas as subseções
    const subsecoes = ['games', 'extrasAlunos', 'plataformasWizard', 'iframeContainer'];
    subsecoes.forEach(secao => {
        const elemento = document.getElementById(secao);
        if (elemento) elemento.classList.add('hidden');
    });
    
    // Mostrar a subseção solicitada
    const secaoAlvo = document.getElementById(id);
    if (secaoAlvo) {
        secaoAlvo.classList.remove('hidden');
    }
    
    // Carregar conteúdo específico se necessário
    if (id === 'extrasAlunos') {
        carregarExtrasAlunos();
    }

    if (id === 'plataformasWizard') {
        const plataformasContainer = document.getElementById('plataformasWizard');
        if (plataformasContainer) {
            plataformasContainer.innerHTML = `
                <button class="back-btn" onclick="voltar()">⬅ Voltar ao Portal</button>
                <h2>🎯 Plataformas Wizard</h2>
                <div class="extras-container">
                    <div class="plataformas-grid">
                        <div class="plataforma-card">
                            <img src="Catchup.png" alt="Catch Up" class="plataforma-img">
                            <button onclick="window.open('https://me.wizard.com.br/catchup/#/catchup/classes/list', '_blank')" 
                                    class="catchup-button">
                                Acessar Catch Up
                            </button>
                        </div>
                        
                        <div class="plataforma-card">
                            <img src="Wizme.png" alt="Wizme" class="plataforma-img">
                            <button onclick="window.open('https://app.newwizme.com.br/onboarding/profile', '_blank')" 
                                    class="catchup-button">
                                Acessar Wizme
                            </button>
                        </div>
                    </div>
                    <p style="text-align:center; color: rgba(255,255,255,0.7); margin-top: 20px;">
                        Acesse as plataformas com seu usuário Wizard
                    </p>
                </div>
            `;
        }
    }
}

// ===== FUNÇÃO PARA CARREGAR EXTRAS DOS ALUNOS =====
async function carregarExtrasAlunos() {
    try {
        console.log('Carregando atividades extras para alunos...');
        
        const url = `https://www.googleapis.com/drive/v3/files?q='${CONFIG.FOLDER_IDS.EXTRAS_ALUNOS}'+in+parents&key=${CONFIG.API_KEY}&fields=files(id,name,mimeType,webViewLink)&orderBy=name`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.files || data.files.length === 0) {
            document.getElementById('listaExtrasAlunos').innerHTML = '<div class="empty-folder">Nenhuma atividade extra encontrada</div>';
            return;
        }
        
        exibirExtrasAlunos(data.files);
        
    } catch (error) {
        console.error('Erro ao carregar atividades extras:', error);
        document.getElementById('listaExtrasAlunos').innerHTML = `<div class="error">Erro ao carregar atividades: ${error.message}</div>`;
    }
}

// Função para exibir as atividades extras
function exibirExtrasAlunos(arquivos) {
    const container = document.getElementById('listaExtrasAlunos');
    
    let html = '<div class="extras-grid">';
    
    arquivos.forEach(arquivo => {
        const icon = getFileIcon(arquivo.mimeType);
        const isFolder = arquivo.mimeType === 'application/vnd.google-apps.folder';
        
        html += `
            <div class="extra-activity-card">
                <div class="extra-activity-icon">${icon.symbol}</div>
                <h3 class="extra-activity-title">${arquivo.name}</h3>
                <a href="${arquivo.webViewLink}" target="_blank" class="extra-activity-link">
                    ${isFolder ? '🔓 Abrir Pasta' : '📄 Abrir Arquivo'}
                </a>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Configuração dos jogos
const JOGOS = [
    {
        id: 'games-to-learn-english',
        nome: 'Games to Learn English',
        descricao: 'Jogos divertidos para praticar inglês de forma interativa',
        url: 'https://www.gamestolearnenglish.com/',
        imagem: './english-games.png',
        emojiFallback: '🌍',
        tipo: 'iframe'
    },
    {
        id: 'foodguessr',
        nome: 'FoodGuessr',
        descricao: 'Adivinhe comidas de diferentes países pelo mundo',
        url: 'https://www.foodguessr.com/game/daily',
        imagem: './foodguessr.jpg',
        emojiFallback: '🍕',
        tipo: 'novaAba'
    },
    {
        id: 'gartic-phone',
        nome: 'Gartic Phone',
        descricao: 'Desenhe e adivinhe com seus amigos online',
        url: 'https://garticphone.com/en',
        imagem: './gartic-phone.jpg',
        emojiFallback: '📱',
        tipo: 'novaAba'
    },
    {
        id: 'ztype',
        nome: 'ZType - Typing Game',
        descricao: 'Melhore sua digitação destruindo palavras com tiros',
        url: 'https://zty.pe/',
        imagem: './ztype.png',
        emojiFallback: '⌨️',
        tipo: 'iframe'
    }
];

// Inicializar lista de jogos
function inicializarGames() {
    const gameList = document.getElementById('gameList');
    
    if (!gameList) return;
    
    let html = '';
    
    JOGOS.forEach(jogo => {
        html += `
            <div class="game-card" onclick="abrirJogo('${jogo.id}')">
                <div class="game-image-container">
                    <img src="${jogo.imagem}" alt="${jogo.nome}" class="game-image" 
                         onerror="handleImageError(this, '${jogo.emojiFallback}')">
                </div>
                <div class="game-content">
                    <h3 class="game-title">${jogo.nome}</h3>
                    <p class="game-description">${jogo.descricao}</p>
                    <button onclick="event.stopPropagation(); toggleFavorito('${jogo.id}', '${jogo.nome}', 'jogo', '${jogo.url}')" 
                            class="favorite-btn">⭐ Favoritar</button>
                </div>
            </div>
        `;
    });
    
    gameList.innerHTML = html;
}

// Controlar abertura de jogos
function abrirJogo(jogoId) {
    const jogo = JOGOS.find(j => j.id === jogoId);
    
    if (!jogo) {
        console.error('Jogo não encontrado:', jogoId);
        return;
    }
    
    if (jogo.tipo === 'iframe') {
        const iframe = document.getElementById('gameIframe');
        iframe.src = jogo.url;
        document.getElementById('iframeContainer').classList.remove('hidden');
        estadoApp.jogoAtivo = true;
    } else if (jogo.tipo === 'novaAba') {
        window.open(jogo.url, '_blank');
    }
}

function voltarParaGames() {
    document.getElementById('iframeContainer').classList.add('hidden');
    estadoApp.jogoAtivo = false;
}

function pararJogo() {
    const iframe = document.getElementById('gameIframe');
    
    // Método 1: Remover o src completamente
    iframe.src = 'about:blank';
    
    // Método 2: Tentar parar qualquer áudio/vídeo
    try {
        iframe.contentWindow.postMessage('stop', '*');
    } catch (e) {
        // Ignora erros de cross-origin
    }
    
    // Método 3: Esconder o iframe
    document.getElementById('iframeContainer').classList.add('hidden');
    estadoApp.jogoAtivo = false;
    
    console.log('Jogo parado completamente');
}

function voltar() {
    console.log('Voltando ao menu principal');

    // Parar jogo se estiver ativo
    pararJogo();

    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(s => {
        s.style.display = 'none';
    });

    // Mostrar menu principal
    const menuPrincipal = document.getElementById('menuPrincipal');
    if (menuPrincipal) {
        menuPrincipal.style.display = 'flex';
        menuPrincipal.classList.remove('hidden');
    }

    // Esconder iframe de jogos
    const iframeContainer = document.getElementById('iframeContainer');
    if (iframeContainer) {
        iframeContainer.classList.add('hidden');
    }

    // Fechar resultados de busca
    const resultados = document.getElementById('searchResults');
    if (resultados) {
        resultados.classList.remove('active');
    }
}

// ===== SISTEMA DE AUTENTICAÇÃO =====
function mostrarModalSenha(secao) {
    const modalExistente = document.getElementById('senhaModal');
    if (modalExistente) {
        modalExistente.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'senhaModal';
    modal.className = 'senha-modal';
    modal.innerHTML = `
        <div class="senha-container">
            <h3 class="senha-titulo">🔒 ${secao === 'teacher' ? 'Área do Professor' : 'Área Administrativa'}</h3>
            <input type="password" 
                   class="senha-input" 
                   id="senhaInput"  
                   placeholder="Digite a senha de acesso"
                   onkeyup="if(event.key === 'Enter') verificarSenhaModal('${secao}')">
            <div class="senha-botoes">
                <button class="senha-confirmar" onclick="verificarSenhaModal('${secao}')">Confirmar</button>
                <button class="senha-cancelar" onclick="fecharModalSenha()">Cancelar</button>
            </div>
            <div class="senha-erro" id="senhaErro">Senha incorreta. Tente novamente.</div>
        </div>
    `;

    document.body.appendChild(modal);

    // Animação de entrada
    requestAnimationFrame(() => {
        modal.classList.add('active');
        const input = modal.querySelector('.senha-input');
        if (input) {
            input.focus();
        }
    });
}

function verificarSenhaModal(secao) {
    const modal = document.getElementById('senhaModal');
    const input = document.getElementById('senhaInput');
    const erro = document.getElementById('senhaErro');

    if (!modal || !input || !erro) {
        console.error('Elementos do modal não encontrados');
        return;
    }

    const senha = input.value;

    if (senha === CONFIG.SENHA_PROTEGIDA) {
        const modalAtual = document.getElementById('senhaModal');
        if (modalAtual) {
            modalAtual.classList.remove('active');
            modalAtual.addEventListener('transitionend', () => {
                modalAtual.remove();
                abrirSecaoDiretamente(secao);
            }, { once: true });
        } else {
            abrirSecaoDiretamente(secao);
        }
    } else {
        erro.style.display = 'block';
        input.value = '';
        input.focus();
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    }
}

function fecharModalSenha() {
    const modal = document.getElementById('senhaModal');
    const menuPrincipal = document.getElementById('menuPrincipal');

    if (!modal) {
        if (menuPrincipal) {
            menuPrincipal.style.display = 'flex';
            menuPrincipal.classList.remove('hidden');
        }
        return;
    }

    modal.classList.remove('active');

    const handleTransition = (e) => {
        if (e.propertyName === 'opacity') {
            modal.remove();

            if (menuPrincipal) {
                menuPrincipal.style.display = 'flex';
                menuPrincipal.classList.remove('hidden');
            }

            modal.removeEventListener('transitionend', handleTransition);
        }
    };

    modal.addEventListener('transitionend', handleTransition);
}

// ===== SISTEMA DE FAVORITOS =====
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

function toggleFavorito(itemId, itemNome, itemTipo, itemLink) {
    const index = favoritos.findIndex(fav => fav.id === itemId);

    if (index === -1) {
        favoritos.push({
            id: itemId,
            nome: itemNome,
            tipo: itemTipo,
            link: itemLink,
            data: new Date().toLocaleDateString('pt-BR')
        });
        mostrarNotificacao('⭐ Adicionado aos favoritos!');
    } else {
        favoritos.splice(index, 1);
        mostrarNotificacao('❌ Removido dos favoritos');
    }

    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    atualizarEstatisticasFavoritos();
}

function removerFavorito(itemId) {
    favoritos = favoritos.filter(fav => fav.id !== itemId);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    exibirFavoritos();
    mostrarNotificacao('🗑️ Favorito removido');
}

function exibirFavoritos() {
    const container = document.getElementById('listaFavoritos');
    if (!container) return;

    if (!favoritos || favoritos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⭐</div>
                <h3>Nenhum favorito ainda</h3>
                <p>Adicione materiais e jogos aos favoritos clicando no ícone ⭐</p>
            </div>
        `;
        return;
    }

    const html = favoritos.map(fav => `
        <div class="favorito-item">
            <span class="favorito-icon">${getIconByTipo(fav.tipo)}</span>
            <div class="favorito-info">
                <h4>${fav.nome}</h4>
                <small>${fav.tipo} • Adicionado em ${fav.data}</small>
            </div>
            <div class="favorito-actions">
                <a href="${fav.link}" target="_blank" class="favorito-link">🔗 Abrir</a>
                <button onclick="removerFavorito('${fav.id}')" class="favorito-remove">🗑️</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
    atualizarEstatisticasFavoritos();
}

function getIconByTipo(tipo) {
    const icons = {
        'livro': '📚',
        'jogo': '🎮',
        'material': '📘',
        'atividade': '📝',
        'link': '🔗'
    };
    return icons[tipo.toLowerCase()] || '⭐';
}

function atualizarEstatisticasFavoritos() {
    const totalElement = document.getElementById('totalFavoritos');
    const materiaisElement = document.getElementById('materiaisFavoritos');
    const jogosElement = document.getElementById('jogosFavoritos');

    if (totalElement) totalElement.textContent = favoritos.length;
    if (materiaisElement) {
        materiaisElement.textContent = favoritos.filter(f =>
            f.tipo.toLowerCase().includes('livro') ||
            f.tipo.toLowerCase().includes('material')
        ).length;
    }
    if (jogosElement) {
        jogosElement.textContent = favoritos.filter(f =>
            f.tipo.toLowerCase().includes('jogo')
        ).length;
    }
}

// ===== SISTEMA DE BUSCA =====
function buscarConteudo(termo) {
    const resultadosContainer = document.getElementById('searchResults');
    if (!resultadosContainer) return;

    if (termo.length < 2) {
        resultadosContainer.innerHTML = '';
        resultadosContainer.classList.remove('active');
        return;
    }

    const termoLower = termo.toLowerCase();
    let resultados = [];

    // Buscar em favoritos
    if (favoritos && favoritos.length > 0) {
        resultados = resultados.concat(
            favoritos.filter(fav =>
                fav.nome.toLowerCase().includes(termoLower) ||
                (fav.tipo && fav.tipo.toLowerCase().includes(termoLower))
            ).map(fav => ({
                ...fav,
                tipo: 'favorito',
                categoria: '⭐ Favoritos'
            }))
        );
    }

    // Buscar em eventos
    if (eventosCalendario && eventosCalendario.length > 0) {
        resultados = resultados.concat(
            eventosCalendario.filter(evento =>
                evento.titulo.toLowerCase().includes(termoLower) ||
                (evento.descricao && evento.descricao.toLowerCase().includes(termoLower))
            ).map(evento => ({
                ...evento,
                tipo: 'evento',
                categoria: '📅 Calendário'
            }))
        );
    }

    // Buscar em jogos
    if (JOGOS && JOGOS.length > 0) {
        resultados = resultados.concat(
            JOGOS.filter(jogo =>
                jogo.nome.toLowerCase().includes(termoLower) ||
                jogo.descricao.toLowerCase().includes(termoLower)
            ).map(jogo => ({
                ...jogo,
                tipo: 'jogo',
                categoria: '🎮 Jogos'
            }))
        );
    }

    exibirResultadosBusca(resultados, termo);
}

function exibirResultadosBusca(resultados, termo) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (resultados.length === 0) {
        container.innerHTML = `
            <div class="search-result-item">
                <div class="search-no-results">
                    🔍 Nenhum resultado encontrado para "${termo}"
                </div>
            </div>
        `;
        container.classList.add('active');
        return;
    }

    const html = resultados.map(item => {
        if (item.tipo === 'favorito') {
            return `
                <div class="search-result-item" onclick="abrirSecao('favoritos')">
                    <span class="search-icon">⭐</span>
                    <div class="search-info">
                        <div class="search-title">${item.nome}</div>
                        <div class="search-details">Favorito • ${item.tipo}</div>
                    </div>
                </div>
            `;
        } else if (item.tipo === 'evento') {
            return `
                <div class="search-result-item" onclick="abrirSecao('calendario')">
                    <span class="search-icon">📅</span>
                    <div class="search-info">
                        <div class="search-title">${item.titulo}</div>
                        <div class="search-details">Evento • ${formatarData(item.data)}</div>
                    </div>
                </div>
            `;
        } else if (item.tipo === 'jogo') {
            return `
                <div class="search-result-item" onclick="abrirJogo('${item.id}')">
                    <span class="search-icon">🎮</span>
                    <div class="search-info">
                        <div class="search-title">${item.nome}</div>
                        <div class="search-details">Jogo • ${item.descricao}</div>
                    </div>
                </div>
            `;
        }
    }).join('');

    container.innerHTML = html;
    container.classList.add('active');
}

// ===== SISTEMA DE LIVROS E MATERIAIS =====
async function carregarPastas() {
    try {
        console.log('Iniciando carregamento de pastas...');

        const pastasPrincipais = await listarPastasPrincipais();

        if (pastasPrincipais.length === 0) {
            const erro = '<div class="error">Nenhuma pasta encontrada no Drive</div>';
            document.getElementById('listaNovos').innerHTML = erro;
            document.getElementById('listaKids').innerHTML = erro;
            document.getElementById('listaAntigos').innerHTML = erro;
            document.getElementById('listaOutrosIdiomas').innerHTML = erro;
            document.getElementById('listaExtras').innerHTML = erro;
            return;
        }

        const { novos, kids, antigos, extras, outrosIdiomas } = classificarLivros(pastasPrincipais);

        criarEstruturaHTML(novos, 'listaNovos', 'Novos');
        criarEstruturaHTML(kids, 'listaKids', 'Kids');
        criarEstruturaHTML(antigos, 'listaAntigos', 'Antigos');
        criarEstruturaHTML(outrosIdiomas, 'listaOutrosIdiomas', 'Outros Idiomas');
        criarEstruturaHTML(extras, 'listaExtras', 'Extras');

        const todasPastasIds = [
            ...novos,
            ...kids,
            ...antigos,
            ...outrosIdiomas,
            ...extras
        ].map(pasta => pasta.id);

        console.log(`Carregando conteúdo de ${todasPastasIds.length} pastas em background...`);

        setTimeout(() => {
            carregarConteudoMultiplasPastas(todasPastasIds)
                .then(() => console.log('Conteúdo carregado em background'))
                .catch(err => console.error('Erro no carregamento em background:', err));
        }, 1000);

    } catch (error) {
        console.error('Erro ao carregar pastas:', error);
        const errorMsg = `<div class="error">Erro ao carregar: ${error.message}</div>`;
        document.getElementById('listaNovos').innerHTML = errorMsg;
        document.getElementById('listaKids').innerHTML = errorMsg;
        document.getElementById('listaAntigos').innerHTML = errorMsg;
        document.getElementById('listaOutrosIdiomas').innerHTML = errorMsg;
        document.getElementById('listaExtras').innerHTML = errorMsg;
    }
}

async function listarPastasPrincipais() {
    try {
        console.log('Buscando pastas principais...');

        const [englishFiles, tgFiles, extraFiles] = await Promise.all([
            fetch(`https://www.googleapis.com/drive/v3/files?q='${CONFIG.FOLDER_IDS.ENGLISH}'+in+parents&key=${CONFIG.API_KEY}&fields=files(id,name,mimeType,webViewLink)&orderBy=name`),
            fetch(`https://www.googleapis.com/drive/v3/files?q='${CONFIG.FOLDER_IDS.TG}'+in+parents&key=${CONFIG.API_KEY}&fields=files(id,name,mimeType,webViewLink)&orderBy=name`),
            fetch(`https://www.googleapis.com/drive/v3/files?q='${CONFIG.FOLDER_IDS.EXTRA}'+in+parents&key=${CONFIG.API_KEY}&fields=files(id,name,mimeType,webViewLink)&orderBy=name`)
        ]);

        const [englishData, tgData, extraData] = await Promise.all([
            englishFiles.json(),
            tgFiles.json(),
            extraFiles.json()
        ]);

        console.log('English files:', englishData.files?.length || 0);
        console.log('TG files:', tgData.files?.length || 0);
        console.log('Extra files:', extraData.files?.length || 0);

        const todasPastas = [
            ...(englishData.files || []).map(item => ({
                id: item.id,
                nome: item.name,
                tipo: item.mimeType,
                link: item.webViewLink,
                origem: 'english'
            })),
            ...(tgData.files || []).map(item => ({
                id: item.id,
                nome: item.name,
                tipo: item.mimeType,
                link: item.webViewLink,
                origem: 'tg'
            })),
            ...(extraData.files || []).map(item => ({
                id: item.id,
                nome: item.name,
                tipo: item.mimeType,
                link: item.webViewLink,
                origem: 'extra'
            }))
        ];

        console.log(`Total de itens combinados: ${todasPastas.length}`);
        return todasPastas;
    } catch (error) {
        console.error('Erro ao buscar pastas:', error);
        throw error;
    }
}

function classificarLivros(livros) {
    const novos = [];
    const antigos = [];
    const extras = [];
    const outrosIdiomas = [];
    const kids = [];

    const outrosIdiomasPalavras = [
        'français', 'francês', 'french', 'methode',
        'español', 'espanhol', 'spanish',
        'deutsch', 'alemão', 'german',
        'japonês', 'japanese',
        'chines', 'chinese',
        'Enlgish', 'Inglês',
        'português', 'portuguese',
        'italiano', 'italian',
        'language', 'idioma', 'lengua'
    ];

    const kidsKeywords = [
        'kids', 'tots', 'little',
        'next generation', 'children',
        'young learners'
    ];

    livros.forEach(livro => {
        const nome = livro.nome.toLowerCase();

        if (kidsKeywords.some(keyword => nome.includes(keyword))) {
            console.log(`Classificado como kids: ${livro.nome}`);
            kids.push(livro);
            return;
        }

        if (nome.includes('audio') ||
            nome.includes('answer') ||
            nome.includes('checking') ||
            nome.includes('peic') ||
            nome.includes('extra activities') ||
            nome.includes('material')) {
            extras.push(livro);
            return;
        }

        if (outrosIdiomasPalavras.some(palavra => nome.includes(palavra))) {
            console.log(`Classificado como outro idioma: ${livro.nome}`);
            outrosIdiomas.push(livro);
            return;
        }

        if (nome.includes('new') || nome.includes('3rd')) {
            novos.push(livro);
        } else {
            antigos.push(livro);
        }
    });

    return { novos, kids, antigos, extras, outrosIdiomas };
}

function criarEstruturaHTML(livros, containerId, categoria) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!livros || livros.length === 0) {
        container.innerHTML = `<div class="empty-folder">Nenhum livro encontrado na categoria "${categoria}"</div>`;
        return;
    }

    let html = '';

    livros.forEach(livro => {
        const classificacao = classificarItem(livro);
        const classeCSS = `book-${classificacao}`;
        const badgeCSS = `badge-${classificacao}`;
        const icon = getBookIcon(livro.nome);

        html += `
            <div class="book-card ${classeCSS}" onclick="alternarLivro(this, '${livro.id}')">
                <div class="book-badge ${badgeCSS}">${getBadgeText(classificacao)}</div>
                <div class="book-icon">${icon}</div>
                <h3 class="book-title">${livro.nome}</h3>
                <button onclick="event.stopPropagation(); toggleFavorito('${livro.id}', '${livro.nome}', 'livro', '${livro.link}')" 
                        class="favorite-btn">⭐</button>
                <div class="expand-indicator">▼ Clique para expandir ▼</div>
                <div class="book-content" id="conteudo-${livro.id}">
                    <div class="quick-loading">Carregando...</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getBookIcon(nomeLivro) {
    const nome = nomeLivro.toLowerCase();
    if (nome.includes('english') || nome.includes('inglês')) return '🌍';
    if (nome.includes('math') || nome.includes('matemática')) return '🔢';
    if (nome.includes('science') || nome.includes('ciência')) return '🔬';
    if (nome.includes('history') || nome.includes('história')) return '📜';
    if (nome.includes('art') || nome.includes('arte')) return '🎨';
    if (nome.includes('music') || nome.includes('música')) return '🎵';
    if (nome.includes('workbook')) return '📝';
    if (nome.includes('audio')) return '🎧';
    if (nome.includes('answer')) return '✅';
    return '📚';
}

function getBadgeText(classificacao) {
    switch (classificacao) {
        case 'new': return 'Novo';
        case 'old': return 'Antigo';
        case 'extra': return 'Extra';
        default: return 'Livro';
    }
}

function classificarItem(item) {
    const nome = item.nome.toLowerCase();

    if (nome.includes('new') || nome.includes('3rd')) return 'new';
    if (nome.includes('audio') ||
        nome.includes('answer') ||
        nome.includes('checking') ||
        nome.includes('peic') ||
        nome.includes('English') ||
        nome.includes('Interactive') ||
        nome.includes('extra activities') ||
        nome.includes('material')) return 'extra';

    return 'old';
}

function alternarSecao(tipo) {
    const secaoId = `secao${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const secao = document.getElementById(secaoId);

    if (!secao) {
        console.warn(`Seção não encontrada: ${secaoId}`);
        return;
    }

    if (!estadoApp.secoesExpandidas[tipo]) {
        estadoApp.secoesExpandidas[tipo] = false;
    }

    estadoApp.secoesExpandidas[tipo] = !estadoApp.secoesExpandidas[tipo];
    secao.classList.toggle('section-collapsed');
}

async function alternarLivro(elemento, pastaId) {
    elemento.classList.toggle('expanded');

    const conteudoDiv = elemento.querySelector('.book-content');
    const loadingDiv = conteudoDiv.querySelector('.quick-loading');

    if (elemento.classList.contains('expanded') && loadingDiv) {
        await carregarConteudoLivro(pastaId, conteudoDiv);
    }
}

async function carregarConteudoLivro(pastaId, containerDiv) {
    try {
        console.log(`Carregando conteúdo da pasta ${pastaId}...`);

        if (cacheConteudo.has(pastaId)) {
            console.log(`Usando cache para pasta ${pastaId}`);
            const arquivosOrdenados = ordenarArquivosNumericamente(cacheConteudo.get(pastaId));
            exibirConteudo(arquivosOrdenados, containerDiv);
            return;
        }

        containerDiv.innerHTML = '<div class="loading-more">Carregando todos os arquivos...</div>';

        let arquivos = await carregarTodosArquivosPasta(pastaId);
        arquivos = ordenarArquivosNumericamente(arquivos);
        cacheConteudo.set(pastaId, arquivos);
        exibirConteudo(arquivos, containerDiv);

    } catch (error) {
        console.error(`Erro ao carregar conteúdo da pasta ${pastaId}:`, error);
        containerDiv.innerHTML = `<div class="error">Erro ao carregar conteúdo: ${error.message}</div>`;
    }
}

async function carregarTodosArquivosPasta(pastaId) {
    let todosArquivos = [];
    let nextPageToken = null;

    try {
        do {
            let url = `https://www.googleapis.com/drive/v3/files?q='${pastaId}'+in+parents&key=${CONFIG.API_KEY}&fields=files(id,name,mimeType,webViewLink,webContentLink),nextPageToken&orderBy=name&pageSize=1000`;

            if (nextPageToken) {
                url += `&pageToken=${nextPageToken}`;
            }

            console.log(`Carregando página da pasta ${pastaId}...`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.files && data.files.length > 0) {
                const arquivosPagina = data.files.map(item => ({
                    id: item.id,
                    nome: item.name,
                    tipo: item.mimeType,
                    link: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`
                }));

                todosArquivos = todosArquivos.concat(arquivosPagina);
                console.log(`Adicionados ${arquivosPagina.length} arquivos. Total: ${todosArquivos.length}`);
            }

            nextPageToken = data.nextPageToken || null;

        } while (nextPageToken);

        console.log(`Total de arquivos carregados da pasta ${pastaId}: ${todosArquivos.length}`);
        return todosArquivos;

    } catch (error) {
        console.error(`Erro ao carregar pasta ${pastaId}:`, error);
        throw error;
    }
}

async function carregarConteudoMultiplasPastas(pastaIds) {
    try {
        console.log(`Carregando conteúdo de ${pastaIds.length} pastas...`);

        const promises = pastaIds.map(async (pastaId) => {
            if (cacheConteudo.has(pastaId)) {
                console.log(`Usando cache para pasta ${pastaId}`);
                return { pastaId, conteudo: cacheConteudo.get(pastaId) };
            }

            try {
                const conteudo = await carregarTodosArquivosPasta(pastaId);
                cacheConteudo.set(pastaId, conteudo);
                return { pastaId, conteudo };
            } catch (error) {
                console.error(`Erro ao carregar pasta ${pastaId}:`, error);
                return { pastaId, conteudo: [], error: error.message };
            }
        });

        const resultados = await Promise.allSettled(promises);

        const conteudos = {};
        resultados.forEach(resultado => {
            if (resultado.status === 'fulfilled') {
                conteudos[resultado.value.pastaId] = resultado.value.conteudo;
            }
        });

        return conteudos;
    } catch (error) {
        console.error('Erro ao carregar múltiplas pastas:', error);
        return {};
    }
}

function ordenarArquivosNumericamente(arquivos) {
    return arquivos.sort((a, b) => {
        const numA = extrairNumero(a.nome);
        const numB = extrairNumero(b.nome);

        if (numA !== null && numB !== null) {
            return numA - numB;
        }

        if (numA !== null && numB === null) return -1;
        if (numA === null && numB !== null) return 1;

        return a.nome.localeCompare(b.nome);
    });
}

function extrairNumero(nome) {
    const match = nome.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

function exibirConteudo(arquivos, containerDiv) {
    if (!arquivos || arquivos.length === 0) {
        containerDiv.innerHTML = '<div class="empty-folder">Nenhum arquivo encontrado</div>';
        return;
    }

    let html = '<div class="content-files">';

    html += `<div style="text-align: center; padding: 10px; color: rgba(255,255,255,0.7); font-size: 0.9em;">
                📚 Total de ${arquivos.length} arquivos
            </div>`;

    arquivos.forEach(arquivo => {
        const icon = getFileIcon(arquivo.tipo);
        html += `
            <div class="file-item">
                <a href="${arquivo.link}" target="_blank" rel="noopener">
                    <span class="file-icon ${icon.class}">${icon.symbol}</span>
                    ${arquivo.nome}
                </a>
            </div>
        `;
    });

    html += '</div>';
    containerDiv.innerHTML = html;
}

function getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return { symbol: '📄', class: 'pdf-icon' };
    if (mimeType.includes('document')) return { symbol: '📝', class: '' };
    if (mimeType.includes('spreadsheet')) return { symbol: '📊', class: '' };
    if (mimeType.includes('presentation')) return { symbol: '📽️', class: '' };
    if (mimeType.includes('image')) return { symbol: '🖼️', class: '' };
    if (mimeType.includes('audio')) return { symbol: '🎵', class: '' };
    if (mimeType.includes('video')) return { symbol: '🎬', class: '' };
    if (mimeType.includes('folder')) return { symbol: '📁', class: '' };
    return { symbol: '📎', class: '' };
}

// ===== FUNÇÕES UTILITÁRIAS =====
function mostrarNotificacao(mensagem) {
    const notifExistente = document.querySelector('.notificacao');
    if (notifExistente) notifExistente.remove();

    const notif = document.createElement('div');
    notif.className = 'notificacao';
    notif.textContent = mensagem;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function handleImageError(imgElement, fallbackEmoji) {
    console.log(`Imagem ${imgElement.src} não encontrada, usando fallback: ${fallbackEmoji}`);

    const container = imgElement.parentElement;
    container.innerHTML = `<div class="image-fallback">${fallbackEmoji}</div>`;
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('Portal Educacional inicializado');

    inicializarGames();
    inicializarCalendario();
    exibirFavoritos();

    // Fechar resultados de busca ao clicar fora
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-global')) {
            const resultados = document.getElementById('searchResults');
            if (resultados) {
                resultados.classList.remove('active');
            }
        }
    });
});
