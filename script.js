// Configurações globais
const CONFIG = {
    SENHA: "2020",
    API_KEY: "AIzaSyBpdK2e9XfRgQdcf-cnx4nV1z6BaDeeYWM",
    FOLDER_IDS: {
        ENGLISH: "1pOe6fvSe6w08taSC3UnoOQnPUQAZcdw8",
        TG: "1Z7rjMo1jbdxfa5TR6aDo4j-8GjdqzuOJ",
        EXTRA: "1MdxVzRvvGXFezEcsPSSoefglIyD_nOM-",
        EXTRAS_ALUNOS: "1Edwnbmic1sK7krY-0sG_NTEpcA3DvpLr" // NOVA PASTA
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
    jogoAtivo: false
};

// Variável global para controlar qual seção tentar abrir
let secaoPendente = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portal Educacional inicializado');
    
    // Sistema de login local
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
        mostrarPortal(usuarioLogado);
    }
    
    inicializarGames();
    
    // Permitir pressionar Enter no input de senha
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verificarSenha();
            }
        });
    }
});

// ===== SISTEMA DE AUTENTICAÇÃO =====
function login() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    const contas = JSON.parse(localStorage.getItem('contas')) || [];
    const conta = contas.find(c => c.user === user && c.pass === pass);

    if (conta) {
        localStorage.setItem('usuarioLogado', user);
        mostrarPortal(user);
    } else {
        alert('Usuário ou senha incorretos!');
    }
}

function registrar() {
    const newUser = document.getElementById('newUsername').value.trim();
    const newPass = document.getElementById('newPassword').value.trim();

    if (!newUser || !newPass) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    const contas = JSON.parse(localStorage.getItem('contas')) || [];
    
    if (contas.some(c => c.user === newUser)) {
        alert('Este usuário já existe!');
        return;
    }

    contas.push({ user: newUser, pass: newPass });
    localStorage.setItem('contas', JSON.stringify(contas));
    alert('Conta criada com sucesso!');
    mostrarLogin();
}

function mostrarPortal(user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.body.insertAdjacentHTML(
        'afterbegin',
        `<div class="user-info">👤 Logado como: <b>${user}</b> <button onclick="logout()">Sair</button></div>`
    );
    document.getElementById('menuPrincipal').classList.remove('hidden');
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}

function mostrarCadastro() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
}

function mostrarLogin() {
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
}

// ===== SISTEMA DE MODAL PARA SENHA DAS SEÇÕES TEACHER/ADMIN =====
function abrirSecao(secao) {
    if (secao === 'teacher' || secao === 'admin') {
        mostrarModalSenha(secao);
        return;
    }
    abrirSecaoDiretamente(secao);
}

function mostrarModalSenha(secao) {
    // Remover modal existente se houver
    const modalExistente = document.getElementById('senhaModal');
    if (modalExistente) modalExistente.remove();

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
    requestAnimationFrame(() => {
        modal.classList.add('active');
        const input = modal.querySelector('.senha-input');
        if (input) input.focus();
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
    console.log('Verificando senha para:', secao);
    
    if (senha === CONFIG.SENHA_PROTEGIDA) {
        console.log('Senha correta!');
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
        console.log('Senha incorreta!');
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
    const userInfo = document.querySelector('.user-info');
    
    if (!modal) {
        // Se o modal não existir, apenas restaura a UI
        if (menuPrincipal) {
            menuPrincipal.style.display = 'flex';
            menuPrincipal.classList.remove('hidden');
        }
        if (userInfo) {
            userInfo.style.display = 'block';
        }
        return;
    }

    // Remove a classe active e adiciona um event listener único
    modal.classList.remove('active');
    
    // Use um único listener que se auto-remove
    const handleTransition = (e) => {
        // Verifica se é a transição de opacidade que terminou
        if (e.propertyName === 'opacity') {
            modal.remove();
            
            // Restaura o menu principal
            if (menuPrincipal) {
                menuPrincipal.style.display = 'flex';
                menuPrincipal.classList.remove('hidden');
            }
            
            // Restaura a barra de usuário
            if (userInfo) {
                userInfo.style.display = 'block';
            }
            
            // Remove o listener
            modal.removeEventListener('transitionend', handleTransition);
        }
    };

    modal.addEventListener('transitionend', handleTransition);
}

function abrirModalSenha() {
    document.getElementById('passwordModal').classList.remove('hidden');
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').classList.add('hidden');
    document.getElementById('passwordInput').focus();
}

function verificarSenha(secao) {
    const modalId = `${secao}PasswordModal`;
    const inputId = `${secao}PasswordInput`;
    const errorId = `${secao}PasswordError`;
    
    const senhaDigitada = document.getElementById(inputId).value;
    const errorElement = document.getElementById(errorId);
    
    console.log('Verificando senha para:', secao);
    
    if (senhaDigitada === CONFIG.SENHA) {
        document.getElementById(modalId).classList.add('hidden');
        if (secaoPendente) {
            abrirSecaoDiretamente(secaoPendente);
            secaoPendente = null;
        }
    } else {
        errorElement.classList.remove('hidden');
        document.getElementById(inputId).value = '';
        document.getElementById(inputId).focus();
        document.getElementById(inputId).classList.add('shake');
        setTimeout(() => {
            document.getElementById(inputId).classList.remove('shake');
        }, 500);
    }
}

function fecharModalSenhaAntigo(secao) {
    const modalId = `${secao}PasswordModal`;
    document.getElementById(modalId).classList.add('hidden');
    secaoPendente = null;
}

function abrirSecaoDiretamente(secao) {
    console.log('Abrindo seção diretamente:', secao);
    
    document.getElementById('menuPrincipal').classList.add('hidden');
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Ocultar a barra de usuário
    const userInfo = document.querySelector('.user-info');
    if (userInfo) userInfo.style.display = 'none';
    
    const secaoElement = document.getElementById(secao);
    if (secaoElement) {
        secaoElement.style.display = 'block';
        if (secao === 'teacher') {
            carregarPastas();
        }
    }
}

// Controle de navegação
function voltar() {
    pararJogo();
    
    // Mostrar a barra de usuário novamente
    const userInfo = document.querySelector('.user-info');
    if (userInfo) userInfo.style.display = 'block';
    
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById('menuPrincipal').style.display = 'flex';
    document.getElementById('iframeContainer').classList.add('hidden');
}

function abrirSubSecao(id) {
    pararJogo();
    
    document.getElementById('games').classList.add('hidden');
    document.getElementById('extrasAlunos').classList.add('hidden');
    document.getElementById('plataformasWizard').classList.add('hidden');
    document.getElementById('iframeContainer').classList.add('hidden');
    document.getElementById(id).classList.remove('hidden');

    if (id === 'extrasAlunos') {
        carregarExtrasAlunos(); // CARREGA AS ATIVIDADES EXTRAS
    }

    if (id === 'plataformasWizard') {
        const plataformasContainer = document.getElementById('plataformasWizard');
        plataformasContainer.innerHTML = `
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

// Controle de seções expansíveis
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

// Utilitários de UI
function handleImageError(imgElement, fallbackEmoji) {
    console.log(`Imagem ${imgElement.src} não encontrada, usando fallback: ${fallbackEmoji}`);
    
    const container = imgElement.parentElement;
    container.innerHTML = `<div class="image-fallback">${fallbackEmoji}</div>`;
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

function abrirJogoExterno(url) {
    window.open(url, '_blank');
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

// FUNÇÕES DO DRIVE
async function listarPastasPrincipais() {
    try {
        console.log('Buscando pastas principais...');
        
        // Carregar todas as pastas em paralelo
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

        // Combinar os resultados de todas as pastas
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

async function carregarConteudoPastaEnglish(englishFolderId) {
    try {
        console.log(`Carregando conteúdo da pasta English (ID: ${englishFolderId})`);
        
        const url = `https://www.googleapis.com/drive/v3/files?q='${englishFolderId}'+in+parents&key=${CONFIG.API_KEY}&fields=files(id,name,mimeType,webViewLink)&orderBy=name`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.files || data.files.length === 0) {
            console.log('Pasta English está vazia');
            return [];
        }
        
        const itensEnglish = data.files.map(item => ({
            id: item.id,
            nome: item.name,
            tipo: item.mimeType,
            link: item.webViewLink,
            conteudo: null,
            origem: 'english'
        }));
        
        console.log(`Encontrados ${itensEnglish.length} itens dentro da pasta English`);
        return itensEnglish;
    } catch (error) {
        console.error('Erro ao carregar pasta English:', error);
        return [];
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

// Função para carregar conteúdo de múltiplas pastas
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

// Classificar os livros
function classificarLivros(livros) {
    const novos = [];
    const antigos = [];
    const extras = [];
    const outrosIdiomas = [];
    const kids = [];

    // Palavras-chave para identificar materiais
    const outrosIdiomasPalavras = [
        'français', 'francês', 'french', 'methode',
        'español', 'espanhol', 'spanish',
        'deutsch', 'alemão', 'german',
        'japonês', 'japanese',
        'chines', 'chinese',
        'Enlgish','Inglês',
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
        
        // 1. Verifica se é material Kids
        if (kidsKeywords.some(keyword => nome.includes(keyword))) {
            console.log(`Classificado como kids: ${livro.nome}`);
            kids.push(livro);
            return;
        }

        // 2. Verifica se é extra
        if (nome.includes('audio') || 
            nome.includes('answer') || 
            nome.includes('checking') ||
            nome.includes('peic') ||
            nome.includes('extra activities') ||
            nome.includes('material')) {
            extras.push(livro);
            return;
        }

        // 3. Verifica se é outro idioma
        if (outrosIdiomasPalavras.some(palavra => nome.includes(palavra))) {
            console.log(`Classificado como outro idioma: ${livro.nome}`);
            outrosIdiomas.push(livro);
            return;
        }

        // 4. Se não for nenhum dos anteriores, verifica se é novo ou antigo
        if (nome.includes('new') || nome.includes('3rd')) {
            novos.push(livro);
        } else {
            antigos.push(livro);
        }
    });

    return { novos, kids, antigos, extras, outrosIdiomas };
}

// Criar HTML dos livros
function criarEstruturaHTML(livros, containerId, categoria) {
    const container = document.getElementById(containerId);
    
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
                <div class="expand-indicator">▼ Clique para expandir ▼</div>
                <div class="book-content" id="conteudo-${livro.id}">
                    <div class="quick-loading">Carregando...</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Funções auxiliares
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
    switch(classificacao) {
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

// Alternar expansão de um livro
async function alternarLivro(elemento, pastaId) {
    elemento.classList.toggle('expanded');
    
    const conteudoDiv = elemento.querySelector('.book-content');
    const loadingDiv = conteudoDiv.querySelector('.quick-loading');
    
    if (elemento.classList.contains('expanded') && loadingDiv) {
        await carregarConteudoLivro(pastaId, conteudoDiv);
    }
}

// Ordenar arquivos numericamente
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

// Carregar conteúdo de um livro específico
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

// Exibir conteúdo na interface
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

// FUNÇÃO PRINCIPAL PARA CARREGAR TODOS OS MATERIAIS
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