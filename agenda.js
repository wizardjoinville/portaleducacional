const sheetID = "1MTXqZrdby-0F133fiNKmLFrj-5ObekGAl0RrBlJ3iq0"
const sheetName = "março 2026"
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`

// Estado global
let filtroAtual = "hoje"
let professorFiltro = "todos"
let allAgendamentos = []
let ultimoTotal = 0

// -------------------- UTILITÁRIOS --------------------
function notificar(msg) {
    const toast = document.getElementById("toast")
    toast.innerText = msg
    toast.classList.add("show")
    setTimeout(() => {
        toast.classList.remove("show")
    }, 3000)
}

function mudarFiltro(f, botao) {
    filtroAtual = f
    document.querySelectorAll(".btnFiltro").forEach(b => b.classList.remove("ativo"))
    botao.classList.add("ativo")
    renderAgenda()
}

// -------------------- CONVERSÃO DE DATAS --------------------
function converterDataGoogleSheets(valor) {
    if (!valor) return null
    const match = String(valor).match(/Date\((\d+),(\d+),(\d+)\)/)
    if (match) {
        const ano = parseInt(match[1])
        const mes = parseInt(match[2])
        const dia = parseInt(match[3])
        return new Date(ano, mes, dia)
    }
    return null
}

function converterHoraGoogleSheets(valor) {
    if (!valor) return "00:00"
    const horaStr = String(valor).trim()

    const matchDate = horaStr.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+)/)
    if (matchDate) {
        const hora = parseInt(matchDate[4]).toString().padStart(2, '0')
        const minuto = parseInt(matchDate[5]).toString().padStart(2, '0')
        return `${hora}:${minuto}`
    }

    let match = horaStr.match(/(\d{1,2}):(\d{2})\s*às/i)
    if (match) return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`

    match = horaStr.match(/(\d{1,2})h(\d{2})\s*às/i)
    if (match) return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`

    match = horaStr.match(/(\d{1,2})h\s*às/i)
    if (match) return `${match[1].padStart(2, '0')}:00`

    match = horaStr.match(/(\d{1,2}):(\d{2})/)
    if (match) return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`

    match = horaStr.match(/(\d{1,2})h(\d{2})/)
    if (match) return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`

    match = horaStr.match(/(\d{1,2})h/)
    if (match) return `${match[1].padStart(2, '0')}:00`

    match = horaStr.match(/^(\d{1,2})/)
    if (match) return `${match[1].padStart(2, '0')}:00`

    return "00:00"
}

// -------------------- FILTRO DE DATA --------------------
function aplicarFiltroData(agendamento, filtro) {
    const dataBase = agendamento.dataBase
    if (!dataBase) return false

    const agora = new Date()

    if (filtro === "hoje") {
        return dataBase.toDateString() === agora.toDateString()
    } else if (filtro === "amanha") {
        let amanha = new Date()
        amanha.setDate(amanha.getDate() + 1)
        return dataBase.toDateString() === amanha.toDateString()
    } else if (filtro === "semana") {
        let limite = new Date()
        limite.setDate(limite.getDate() + 7)
        return dataBase >= new Date().setHours(0, 0, 0, 0) && dataBase <= limite
    }
    return true
}

// -------------------- ATUALIZAR DROPDOWN DE PROFESSORES --------------------
function atualizarDropdownProfessores() {
    const select = document.getElementById("filtroProfessor")
    if (!select) return

    const professores = new Set()
    allAgendamentos.forEach(ag => {
        const prof = ag.aulaZero
        if (prof && prof !== "-" && prof !== "null" && prof !== null) {
            professores.add(prof)
        }
    })

    const profArray = Array.from(professores).sort()
    const valorAtual = professorFiltro

    select.innerHTML = '<option value="todos">Todos</option>'
    profArray.forEach(prof => {
        const option = document.createElement("option")
        option.value = prof
        option.textContent = prof
        select.appendChild(option)
    })

    if (profArray.includes(valorAtual)) {
        select.value = valorAtual
    } else {
        select.value = "todos"
        professorFiltro = "todos"
    }
}

// -------------------- RENDERIZAÇÃO PRINCIPAL --------------------
function renderAgenda() {
    const agora = new Date()
    const agenda = document.getElementById("agenda")
    agenda.innerHTML = ""

    // Filtrar por data primeiro (para contadores)
    const agendamentosDoFiltroData = allAgendamentos.filter(ag => 
        aplicarFiltroData(ag, filtroAtual)
    )

    // Aplicar filtro de professor (sobre os já filtrados por data)
    const filtered = agendamentosDoFiltroData.filter(ag => {
        if (professorFiltro !== "todos") {
            return ag.aulaZero === professorFiltro
        }
        return true
    })

    // Contadores para o dashboard
    let contadorProximos = 0
    let contadorAndamento = 0
    let contadorFinalizados = 0

    // Gerar cards
    filtered.forEach(ag => {
        const dataComHora = new Date(ag.dataBase)
        const [h, m] = ag.horaExibicao.split(':')
        dataComHora.setHours(parseInt(h) || 0, parseInt(m) || 0)

        const diffMin = (dataComHora - agora) / 60000
        const minutosAteFim = diffMin + 60

        // Determinar status
        let status = "", statusClass = "", statusIcon = ""
        if (minutosAteFim < 0) {
            status = "finalizado"
            statusClass = "status-finalizado"
            statusIcon = "✅"
            contadorFinalizados++
        } else if (diffMin <= 0 && minutosAteFim >= 0) {
            status = "andamento"
            statusClass = "status-andamento"
            statusIcon = "🟢"
            contadorAndamento++
        } else if (diffMin > 0 && diffMin <= 30) {
            status = "próximo"
            statusClass = "status-proximo"
            statusIcon = "⚠️"
            contadorProximos++
        } else if (diffMin > 30 && diffMin <= 60) {
            status = "em-breve"
            statusClass = "status-em-breve"
            statusIcon = "🕐"
        } else {
            status = "agendado"
            statusClass = "status-agendado"
            statusIcon = "📅"
        }

        // Informações de tempo
        let tempoInfo = ""
        if (minutosAteFim < 0) {
            const minutosPassados = Math.abs(Math.round(minutosAteFim))
            if (minutosPassados < 60) {
                tempoInfo = `<div class="tempo-passado">✅ Finalizado há ${minutosPassados} minutos</div>`
            } else {
                const horas = Math.floor(minutosPassados / 60)
                tempoInfo = `<div class="tempo-passado">✅ Finalizado há ${horas} hora${horas > 1 ? 's' : ''}</div>`
            }
        } else if (diffMin <= 0 && minutosAteFim >= 0) {
            const minutosRestantes = Math.round(minutosAteFim)
            tempoInfo = `<div class="tempo-andamento">🟢 Em andamento - termina em ${minutosRestantes} min</div>`
        } else if (diffMin > 0) {
            if (diffMin < 60) {
                tempoInfo = `<div class="tempo-restante">⏰ Começa em ${Math.round(diffMin)} min</div>`
            } else {
                const horas = Math.floor(diffMin / 60)
                const minutos = Math.round(diffMin % 60)
                tempoInfo = `<div class="tempo-restante">⏰ Começa em ${horas}h${minutos > 0 ? minutos : ''}</div>`
            }
        }

        // Montar card
        const contatoInfo = ag.telefone ? `📞 ${ag.telefone}` : ''
        const idadeInfo = ag.idade ? `📊 Idade: ${ag.idade}` : ''
        const descricaoInfo = ag.descricao ? `<div class="info descricao">📝 ${ag.descricao}</div>` : ''
        const atendimentoInfo = ag.atendimento && ag.atendimento !== "-"
            ? `<div class="info atendimento">👥 Atendido por: ${ag.atendimento}</div>`
            : '<div class="info atendimento">👥 Aguardando atendimento</div>'

        agenda.innerHTML += `
            <div class="card ${statusClass}">
                <div class="card-header">
                    <div class="categoria-grande">${ag.categoria}</div>
                    <div class="status-badge ${statusClass}">${statusIcon} ${status}</div>
                </div>
                <div class="lead">${ag.lead}</div>
                ${contatoInfo ? `<div class="info">${contatoInfo}</div>` : ''}
                ${idadeInfo ? `<div class="info">${idadeInfo}</div>` : ''}
                <div class="info">👤 Responsável: ${ag.responsavel}</div>
                <div class="info">📚 Livro: ${ag.livro}</div>
                <div class="info">👨‍🏫 Aula Zero: ${ag.aulaZero}</div>
                ${atendimentoInfo}
                ${descricaoInfo}
                <div class="hora">
                    📅 ${ag.dataBase.toLocaleDateString('pt-BR')} ⏰ ${ag.horaExibicao}
                </div>
                ${tempoInfo}
            </div>
        `
    })

    // Atualizar dashboard
    document.getElementById("contadorTotal").innerText = filtered.length
    document.getElementById("contadorProximos").innerText = contadorProximos
    document.getElementById("contadorAndamento").innerText = contadorAndamento
    document.getElementById("contadorFinalizados").innerText = contadorFinalizados

    // --- CONTAGEM DE PROFESSORES (DINÂMICA POR FILTRO DE DATA) ---
    // Aqui usamos agendamentosDoFiltroData (filtrados APENAS por data, sem filtro de professor)
    const professoresContagem = {}
    agendamentosDoFiltroData.forEach(ag => {
        const prof = ag.aulaZero
        if (prof && prof !== "-" && prof !== "null" && prof !== null) {
            professoresContagem[prof] = (professoresContagem[prof] || 0) + 1
        }
    })

    let profHTML = ""
    if (Object.keys(professoresContagem).length > 0) {
        for (let p in professoresContagem) {
            profHTML += `${p}: ${professoresContagem[p]}<br>`
        }
    } else {
        profHTML = "Nenhum professor com aula zero neste período"
    }
    document.getElementById("contadorProf").innerHTML = profHTML

    // Mensagem de vazio
    const semAgenda = document.getElementById("semAgenda")
    semAgenda.style.display = filtered.length === 0 ? "block" : "none"

    // Notificação
    if (filtered.length > ultimoTotal) {
        notificar("🎉 Novo agendamento detectado!")
    } else {
        notificar("📅 Agenda atualizada")
    }
    ultimoTotal = filtered.length
}

// -------------------- CARREGAR DADOS DA PLANILHA --------------------
async function carregarDados() {
    try {
        console.log("Carregando dados...")
        const res = await fetch(url)
        const text = await res.text()
        const jsonText = text.substring(47).slice(0, -2)
        const json = JSON.parse(jsonText)
        const rows = json.table.rows
        console.log("Total de linhas:", rows.length)

        allAgendamentos = []

        rows.forEach((r) => {
            const c = r.c
            if (!c || c.length === 0) return

            const dataCell = c[6]
            if (!dataCell || !dataCell.v) return

            const dataBase = converterDataGoogleSheets(dataCell.v)
            if (!dataBase) return

            const horaExibicao = (c[7] && c[7].v) ? converterHoraGoogleSheets(c[7].v) : "00:00"

            const categoria = c[0]?.v || "Não especificado"
            const lead = c[1]?.v || "Sem nome"
            const telefone = c[2]?.v || ""
            const responsavel = c[4]?.v || "Não informado"
            const idade = c[5]?.v || ""
            const atendimento = c[8]?.v || "-"
            const aulaZero = c[10]?.v || "-"
            const livro = c[9]?.v || "-"
            const descricao = c[11]?.v || ""

            allAgendamentos.push({
                dataBase,
                horaExibicao,
                categoria,
                lead,
                telefone,
                responsavel,
                idade,
                atendimento,
                aulaZero,
                livro,
                descricao
            })
        })

        atualizarDropdownProfessores()
        renderAgenda()

    } catch (error) {
        console.error("Erro ao carregar dados:", error)
        notificar("Erro ao carregar dados. Verifique o console.")
    }
}

// -------------------- RELÓGIO --------------------
function iniciarRelogio() {
    function atualizarRelogio() {
        const agora = new Date()
        const relogioEl = document.getElementById("relogio")
        const dataEl = document.getElementById("data")
        if (relogioEl) relogioEl.innerText = agora.toLocaleTimeString('pt-BR')
        if (dataEl) dataEl.innerText = agora.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        })
    }
    atualizarRelogio()
    setInterval(atualizarRelogio, 1000)
}

// -------------------- INICIALIZAÇÃO --------------------
document.addEventListener("DOMContentLoaded", () => {
    iniciarRelogio()

    const selectProf = document.getElementById("filtroProfessor")
    if (selectProf) {
        selectProf.addEventListener("change", (e) => {
            professorFiltro = e.target.value
            renderAgenda()
        })
    }

    carregarDados()
    setInterval(carregarDados, 30000)
})