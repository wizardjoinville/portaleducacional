const sheetID = "1MTXqZrdby-0F133fiNKmLFrj-5ObekGAl0RrBlJ3iq0"
const sheetName = "março 2026"

const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`

let filtroAtual = "hoje"
let ultimoTotal = 0

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
    carregarDados()
}

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
    console.log("Convertendo hora:", horaStr)
    
    const matchDate = horaStr.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+)/)
    if (matchDate) {
        const hora = parseInt(matchDate[4]).toString().padStart(2, '0')
        const minuto = parseInt(matchDate[5]).toString().padStart(2, '0')
        return `${hora}:${minuto}`
    }
    
    let match = horaStr.match(/(\d{1,2}):(\d{2})\s*às/i)
    if (match) {
        return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`
    }
    
    match = horaStr.match(/(\d{1,2})h(\d{2})\s*às/i)
    if (match) {
        return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`
    }
    
    match = horaStr.match(/(\d{1,2})h\s*às/i)
    if (match) {
        return `${match[1].padStart(2, '0')}:00`
    }
    
    match = horaStr.match(/(\d{1,2}):(\d{2})/)
    if (match) {
        return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`
    }
    
    match = horaStr.match(/(\d{1,2})h(\d{2})/)
    if (match) {
        return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`
    }
    
    match = horaStr.match(/(\d{1,2})h/)
    if (match) {
        return `${match[1].padStart(2, '0')}:00`
    }
    
    match = horaStr.match(/^(\d{1,2})/)
    if (match) {
        return `${match[1].padStart(2, '0')}:00`
    }
    
    console.log("❌ Formato de hora não reconhecido:", horaStr)
    return "00:00"
}

async function carregarDados() {
    try {
        console.log("Carregando dados...")
        
        const res = await fetch(url)
        const text = await res.text()
        
        const jsonText = text.substring(47).slice(0, -2)
        const json = JSON.parse(jsonText)
        
        const rows = json.table.rows
        console.log("Total de linhas:", rows.length)
        
        const agora = new Date()
        const agenda = document.getElementById("agenda")
        agenda.innerHTML = ""
        
        let contador = 0
        let contadorProximos = 0
        let contadorAndamento = 0
        let contadorFinalizados = 0
        let professores = {}
        
        rows.forEach((r, index) => {
            const c = r.c
            if (!c || c.length === 0) return
            
            const dataCell = c[6]
            if (!dataCell || !dataCell.v) return
            
            const dataBase = converterDataGoogleSheets(dataCell.v)
            if (!dataBase) return
            
            // Converter o horário
            let horaExibicao = "00:00"
            if (c[7] && c[7].v) {
                horaExibicao = converterHoraGoogleSheets(c[7].v)
            }
            
            // Criar data com hora para cálculo
            const dataComHora = new Date(dataBase)
            const [h, m] = horaExibicao.split(':')
            dataComHora.setHours(parseInt(h) || 0, parseInt(m) || 0)
            
            const diffMin = (dataComHora - agora) / 60000
            
            // MODIFICADO: Removido o filtro de -60 minutos para 'hoje'
            // Agora mostra todos os atendimentos do dia, mesmo os que já passaram
            if (filtroAtual === "hoje") {
                if (dataBase.toDateString() !== agora.toDateString()) return
                // REMOVIDO: if (diffMin < -60) return
            }
            
            if (filtroAtual === "amanha") {
                let amanha = new Date()
                amanha.setDate(amanha.getDate() + 1)
                if (dataBase.toDateString() !== amanha.toDateString()) return
            }
            
            if (filtroAtual === "semana") {
                let limite = new Date()
                limite.setDate(limite.getDate() + 7)
                if (dataBase > limite) return
                if (dataBase < new Date().setHours(0, 0, 0, 0)) return
            }
            
            contador++
            
            // Calcular tempos
            const minutosAteInicio = diffMin
            const minutosAteFim = diffMin + 60
            
            // Determinar status
            let status = ""
            let statusClass = ""
            let statusIcon = ""
            
            if (minutosAteFim < 0) {
                status = "finalizado"
                statusClass = "status-finalizado"
                statusIcon = "✅"
                contadorFinalizados++
            } 
            else if (minutosAteInicio <= 0 && minutosAteFim >= 0) {
                status = "andamento"
                statusClass = "status-andamento"
                statusIcon = "🟢"
                contadorAndamento++
            }
            else if (minutosAteInicio > 0 && minutosAteInicio <= 30) {
                status = "próximo"
                statusClass = "status-proximo"
                statusIcon = "⚠️"
                contadorProximos++
            }
            else if (minutosAteInicio > 30 && minutosAteInicio <= 60) {
                status = "em-breve"
                statusClass = "status-em-breve"
                statusIcon = "🕐"
            }
            else {
                status = "agendado"
                statusClass = "status-agendado"
                statusIcon = "📅"
            }
            
            // Extrair dados
            const categoria = c[0]?.v || "Não especificado"
            const lead = c[1]?.v || "Sem nome"
            const telefone = c[2]?.v || ""
            const responsavel = c[4]?.v || "Não informado"
            const idade = c[5]?.v || ""
            
            // QUEM DEVERIA ATENDER - Coluna 8 (Atendimento)
            const atendimento = c[8]?.v || "-"
            
            // Aula Zero - Coluna 10
            let aulaZero = c[10]?.v || "-"
            
            // Livro - Coluna 9
            const livro = c[9]?.v || "-"
            
            // Descrição - Coluna 11
            const descricao = c[11]?.v || ""
            
            // Contar professores de aula zero
            if (aulaZero && aulaZero !== "-" && aulaZero !== "null" && aulaZero !== null) {
                if (!professores[aulaZero]) professores[aulaZero] = 0
                professores[aulaZero]++
            }
            
            // Formatar contato
            const contatoInfo = telefone ? `📞 ${telefone}` : ''
            const idadeInfo = idade ? `📊 Idade: ${idade}` : ''
            const descricaoInfo = descricao ? `<div class="info descricao">📝 ${descricao}</div>` : ''
            
            // Informação de quem atende/deveria atender
            const atendimentoInfo = atendimento !== "-" ? 
                `<div class="info atendimento">👥 Atendido por: ${atendimento}</div>` : 
                '<div class="info atendimento">👥 Aguardando atendimento</div>'
            
            // Tempo info
            let tempoInfo = ""
            if (minutosAteFim < 0) {
                const minutosPassados = Math.abs(Math.round(minutosAteFim))
                if (minutosPassados < 60) {
                    tempoInfo = `<div class="tempo-passado">✅ Finalizado há ${minutosPassados} minutos</div>`
                } else {
                    const horas = Math.floor(minutosPassados / 60)
                    tempoInfo = `<div class="tempo-passado">✅ Finalizado há ${horas} hora${horas > 1 ? 's' : ''}</div>`
                }
            }
            else if (minutosAteInicio <= 0 && minutosAteFim >= 0) {
                const minutosRestantes = Math.round(minutosAteFim)
                tempoInfo = `<div class="tempo-andamento">🟢 Em andamento - termina em ${minutosRestantes} min</div>`
            }
            else if (minutosAteInicio > 0) {
                if (minutosAteInicio < 60) {
                    tempoInfo = `<div class="tempo-restante">⏰ Começa em ${Math.round(minutosAteInicio)} min</div>`
                } else {
                    const horas = Math.floor(minutosAteInicio / 60)
                    const minutos = Math.round(minutosAteInicio % 60)
                    tempoInfo = `<div class="tempo-restante">⏰ Começa em ${horas}h${minutos > 0 ? minutos : ''}</div>`
                }
            }
            
            agenda.innerHTML += `
                <div class="card ${statusClass}">
                    <div class="card-header">
                        <div class="categoria-grande">${categoria}</div>
                        <div class="status-badge ${statusClass}">${statusIcon} ${status}</div>
                    </div>
                    <div class="lead">${lead}</div>
                    ${contatoInfo ? `<div class="info">${contatoInfo}</div>` : ''}
                    ${idadeInfo ? `<div class="info">${idadeInfo}</div>` : ''}
                    <div class="info">👤 Responsável: ${responsavel}</div>
                    <div class="info">📚 Livro: ${livro}</div>
                    <div class="info">👨‍🏫 Aula Zero: ${aulaZero}</div>
                    ${atendimentoInfo}
                    ${descricaoInfo}
                    <div class="hora">
                        📅 ${dataBase.toLocaleDateString('pt-BR')} ⏰ ${horaExibicao}
                    </div>
                    ${tempoInfo}
                </div>
            `
        })
        
        console.log("Total de cards criados:", contador)
        console.log(`Finalizados hoje: ${contadorFinalizados}`)
        
        // Atualizar dashboard
        const dashboard = document.querySelector('.dashboard')
        dashboard.innerHTML = `
            <div class="cardResumo">
                <span>Atendimentos Hoje</span>
                <strong id="contadorTotal">${contador}</strong>
            </div>
            <div class="cardResumo status-proximo">
                <span>⏰ Próximos (30min)</span>
                <strong>${contadorProximos}</strong>
            </div>
            <div class="cardResumo status-andamento">
                <span>🟢 Em Andamento</span>
                <strong>${contadorAndamento}</strong>
            </div>
            <div class="cardResumo status-finalizado">
                <span>✅ Finalizados Hoje</span>
                <strong>${contadorFinalizados}</strong>
            </div>
            <div class="cardResumo">
                <span>Professores Aula Zero</span>
                <div id="contadorProf"></div>
            </div>
        `
        
        // Atualizar professores
        let profHTML = ""
        for (let p in professores) {
            profHTML += `${p}: ${professores[p]}<br>`
        }
        document.getElementById("contadorProf").innerHTML = profHTML || "Nenhum"
        
        const semAgenda = document.getElementById("semAgenda")
        semAgenda.style.display = contador === 0 ? "block" : "none"
        
        if (contador > ultimoTotal) {
            notificar("🎉 Novo agendamento detectado!")
        } else {
            notificar("📅 Agenda atualizada")
        }
        
        ultimoTotal = contador
        
    } catch (error) {
        console.error("Erro ao carregar dados:", error)
        notificar("Erro ao carregar dados. Verifique o console.")
    }
}

// Carregar dados iniciais
carregarDados()

// Atualizar a cada 30 segundos
setInterval(carregarDados, 30000)