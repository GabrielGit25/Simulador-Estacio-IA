document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const startBtn = document.getElementById('start-btn');
    const historyList = document.getElementById('history-list');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const openConfigBtn = document.getElementById('open-config');
    const apiConfig = document.getElementById('api-config');
    const overlay = document.getElementById('overlay');

    // Dashboard Elements (sidebar, kept for JS compat)
    const examDashboard = document.getElementById('exam-dashboard');
    const examProgress = document.getElementById('exam-progress');
    const examScoreDisp = document.getElementById('exam-score');
    const examStatusDisp = document.getElementById('exam-status');
    const resetExamBtn = document.getElementById('reset-exam');

    // Score Panel Elements (top bar)
    const scorePanel     = document.getElementById('score-panel');
    const spScore        = document.getElementById('sp-score');
    const spStatus       = document.getElementById('sp-status');
    const spProgressFill = document.getElementById('sp-progress-fill');
    const spResetBtn     = document.getElementById('sp-reset-btn');
    // dot refs
    const spDots = Array.from({length: 10}, (_, i) => document.getElementById(`sp-dot-${i+1}`));
    // per-question scores array
    let questionScores = [];

    let currentQuestion = "";
    let currentQuestionType = "objective";
    let apiKey = "";
    let studyMode = "normal"; 
    let selectedSubject = "all";

    // Exam State
    let examActive = false;
    let questionsAnswered = 0;
    let totalScore = 0.0;

    const FUNDAMENTOS_BASE = `
    1. Conceitos Básicos: Rede de Computadores (arranjo topológico para troca de informações), Internet (rede de redes conectadas via ISPs).
    2. 3 Partes: Borda (sistemas finais/hosts), Núcleo (roteadores/switches + enlaces), Rede de Acesso (infraestrutura de transporte entre borda e núcleo). Servidores são definidos pelo software, não hardware.
    3. Redes de Acesso: Guiados (fio, fibra ótica FTTH, par trançado, coaxial) e Não Guiados (wireless, rádio, satélite, sinais eletromagnéticos).
    4. Núcleo: Formado por ISPs. PoP (Ponto de Presença), Multi-homing (redundância conectando a 2+ ISPs), IXP (Ponto de Troca de Internet - peering neutro), Hierarquia (Local -> Regional -> Nível 1).
    5. Atraso Nodal: Processamento (cabeçalho/erros), Fila (espera no buffer, causa Jitter), Transmissão (L/R - tempo para empurrar bits), Propagação (d/s - tempo de viagem no meio).
    6. Encapsulamento: Dados descem as camadas adicionando cabeçalhos (PDUs: Mensagem, Segmento, Datagrama, Quadro, Bits).
    7. Pilares: Serviço (O que?), Protocolo (Como? - Sintaxe/Semântica/Temporização), Interface (Onde? - Local).
    8. Modelos: OSI (7 camadas: Aplicação, Apresentação, Sessão, Transporte, Rede, Enlace, Física) e TCP/IP (4 ou 5 camadas).
    9. Transporte: TCP (Confiável, orientado à conexão, 3-way handshake, full-duplex), UDP (Não confiável, rápido). Portas 0-1023 (well-known).
    10. HTTP: Protocolo de transferência web, usa TCP. Fluxo: 3-way handshake -> Request (GET/POST) -> Response (200/404) -> Fechamento.
    11. E-mail: SMTP (envio/push - portas 25/587), IMAP (acesso/pull - mantém no servidor), POP3 (acesso/pull - baixa e apaga).
    12. Arquiteturas: Cliente-Servidor (centralizado, papel fixo) vs P2P (peers agem como cliente e servidor, escalável).
    13. Multiplexação/Demultiplexação: Multiplexação (origem - agrupa dados); Demultiplexação (destino - entrega ao processo via porta).
    14. DNS (Domain Name System): Traduz nomes em IPs. Hierarquia: Raiz -> TLD -> Autoridade. Consultas Recursiva e Iterativa. Registros: A, AAAA, MX, CNAME, PTR.
    15. DHCP (Dynamic Host Configuration Protocol): Atribui IPs automaticamente. Processo DORA (Discover, Offer, Request, Ack). Porta 67/68.
    16. Camada de Rede: Endereçamento IP e Máscara (define rede/host). Classes A, B, C, D, E. CIDR (notação /X). IPs Privados (RFC 1918).
    17. Repasse vs Roteamento: Repasse (Forwarding - ação local, consulta tabela) vs Roteamento (Routing - processo global, calcula caminhos).
    18. Circuitos Virtuais vs Datagramas: CV (conexão, rota fixa, ordem) vs Datagrama (sem conexão, rotas independentes - Internet/IP).
    19. ARP (Address Resolution Protocol): Traduz IP em MAC na rede local. Usa broadcast request e unicast reply. Cache ARP armazena mapeamentos.
    20. ICMP (Internet Control Message Protocol): Controle/erro. Usado pelo PING (Echo Request/Reply) e TRACEROUTE (TTL Exceeded).
    21. Algoritmos de Roteamento: Vetor de Distância (RIP - vizinhos) vs Estado de Enlace (OSPF - Dijkstra). BGP para roteamento entre AS.
    22. NAT (Network Address Translation): Vários IPs privados compartilham um único IP público. Tabela NAT mapeia portas.
    23. Camada Física: Transmissão de bits. Sinais Analógicos vs Digitais. Banda Passante (Hz ou bps).
    24. Meios Guiados: Par trançado (Cat5/7), Cabo Coaxial (TV), Fibra Óptica (Lei de Snell, luz, alta taxa, imune a ruído).
    25. Meios Não Guiados: Ondas de rádio (longo alcance), Micro-ondas (linha de visada, satélite), Infravermelho (curto alcance).
    26. Degradações: Atenuação (perda de potência), Ruído (sinais indesejados), Distorção (limitação de banda).
    27. Camada de Enlace: Delimitação de quadros, Controle de Erros e Fluxo. Subcamadas LLC (superior) e MAC (inferior - endereço 48 bits).
    28. Controle de Erros: Detecção (Paridade, CRC) e Correção (Hamming/FEC). ARQ (Stop-and-wait, Go-back-N, Selective Repeat).
    29. Protocolos MAC: Contenção (ALOHA, CSMA, CSMA/CD em Ethernet) e Acesso Ordenado (Token Ring).
    30. Enquadramento: Contagem de caractere, Flag de caractere (Stuffing), Flag de bits (Bit Stuffing), Violação de código.
    31. Controle de Fluxo: Evita que transmissor rápido sobrecarregue receptor lento (Janela Deslizante).
    32. Subcamada MAC (LLC vs MAC): LLC (superior, controle de fluxo/erros, independente do meio); MAC (inferior, acesso ao meio, endereço físico 48 bits, CSMA/CD).
    `;

    const SEGURANCA_BASE = `
    33. Administração e Segurança (ISO 27001): Ameaça (causa), Ataque (ação), Ativo (valor), Incidente (dano). Pilares CID (Confidencialidade, Integridade, Disponibilidade).
    34. Propriedades: Autenticidade, Não Repúdio, Confiabilidade, Legalidade.
    35. Classificação de Ataques: Ativos (Interrupção, Modificação, Fabricação, Repetição) vs Passivos (Interceptação).
    36. 7 Etapas do Ataque: Reconhecimento, Armamento, Entrega, Exploração, Instalação (RAT), Comando e Controle, Ações no Objetivo.
    37. Mecanismos de Controle: Físicos (áreas seguras, no-breaks) e Lógicos (criptografia, firewall, IDS/IPS).
    38. Criptografia: Simétrica (AES - chave única) vs Assimétrica (RSA - par pública/privada). Assinatura Digital (Hash + Assimétrica).
    39. Certificado Digital e AC: Autoridade Certificadora assina chaves públicas para evitar MITM.
    40. VPN: Túnel seguro (criptografia, autenticação) sobre a internet (Site-to-Site e Remote Access).
    41. Segurança de Rede: Firewall (regras), IDS (alerta), IPS (ação). Malware: Vírus, Worm, Trojan, Ransomware.
    42. Gerenciamento: Gerente, Agente, SNMP, MIB. Comunicação Polling e Trap.
    43. Modelo FCAPS: Falhas, Configuração, Contabilidade, Desempenho, Segurança.
    `;

    // Selection logic
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            studyMode = btn.dataset.mode;
        });
    });

    const subjectButtons = document.querySelectorAll('.subject-btn');
    subjectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            subjectButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSubject = btn.dataset.subject;
        });
    });

    // Theme Toggle
    const themeToggleTop = document.getElementById('theme-toggle-top');
    try {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('estacio-theme');
            if (themeToggleTop) themeToggleTop.innerHTML = '☀️ Tema';
        } else {
            if (themeToggleTop) themeToggleTop.innerHTML = '🌙 Tema';
        }
    } catch (e) { console.error("Theme load error:", e); }

    if (themeToggleTop) {
        themeToggleTop.addEventListener('click', () => {
            const isDark = !document.body.classList.contains('estacio-theme');
            try {
                if (isDark) {
                    document.body.classList.add('estacio-theme');
                    themeToggleTop.innerHTML = '☀️ Tema';
                    localStorage.setItem('theme', 'light');
                } else {
                    document.body.classList.remove('estacio-theme');
                    themeToggleTop.innerHTML = '🌙 Tema';
                    localStorage.setItem('theme', 'dark');
                }
            } catch (e) { console.error("Theme save error:", e); }
        });
    }

    try {
        apiKey = localStorage.getItem('openrouter_api_key') || "";
    } catch (e) { console.error("LocalStorage error:", e); }

    if (apiKey && apiKeyInput) apiKeyInput.value = apiKey;
    updateHistoryUI();

    // API Config
    if (openConfigBtn && apiConfig && overlay) {
        openConfigBtn.addEventListener('click', () => {
            apiConfig.style.display = 'block';
            overlay.style.display = 'block';
        });
        overlay.addEventListener('click', () => {
            apiConfig.style.display = 'none';
            overlay.style.display = 'none';
        });
    }

    if (saveApiKeyBtn && apiKeyInput) {
        saveApiKeyBtn.addEventListener('click', () => {
            apiKey = apiKeyInput.value.trim();
            try {
                localStorage.setItem('openrouter_api_key', apiKey);
                alert('API Key salva com sucesso!');
            } catch (e) { alert('Erro ao salvar no LocalStorage.'); }
            apiConfig.style.display = 'none';
            overlay.style.display = 'none';
        });
    }

    // ── Botão Testar Chave ──
    const testApiKeyBtn = document.getElementById('test-api-key');
    const apiTestResult = document.getElementById('api-test-result');

    async function testApiKey() {
        const keyToTest = apiKeyInput ? apiKeyInput.value.trim() : apiKey;
        if (!keyToTest) {
            if (apiTestResult) {
                apiTestResult.style.display = 'block';
                apiTestResult.style.color = '#ff4757';
                apiTestResult.textContent = '❌ Cole sua API Key no campo acima antes de testar.';
            }
            return;
        }

        if (apiTestResult) {
            apiTestResult.style.display = 'block';
            apiTestResult.style.color = '#e8eaf2';
            apiTestResult.textContent = '⏳ Testando sua chave e os modelos...\n';
        }

        let log = '';
        const addLog = (line) => {
            log += line + '\n';
            if (apiTestResult) apiTestResult.textContent = log;
        };

        // 1) Verificar a conta via /auth/key
        try {
            const authResp = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: { 'Authorization': `Bearer ${keyToTest}` }
            });
            if (authResp.ok) {
                const authData = await authResp.json();
                const d = authData.data || authData;
                addLog(`✅ Chave válida!`);
                if (d.label)        addLog(`   Nome: ${d.label}`);
                if (d.usage != null) addLog(`   Uso: $${(d.usage / 100).toFixed(4)}`);
                if (d.limit != null) addLog(`   Limite: $${(d.limit / 100).toFixed(2)}`);
                if (d.rate_limit)   addLog(`   Rate limit: ${JSON.stringify(d.rate_limit)}`);
            } else {
                const txt = await authResp.text();
                addLog(`❌ Chave inválida ou erro (${authResp.status}): ${txt}`);
                if (apiTestResult) apiTestResult.style.color = '#ff4757';
                return;
            }
        } catch(e) {
            addLog(`❌ Erro de conexão ao validar chave: ${e.message}`);
            if (apiTestResult) apiTestResult.style.color = '#ff4757';
            return;
        }

        addLog('\n🔎 Testando modelos (requisição mínima)...');

        const modelsToTest = [
            'openrouter/free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'google/gemma-3-27b-it:free',
            'deepseek/deepseek-r1-0528:free',
            'mistralai/mistral-7b-instruct:free',
            'microsoft/phi-4:free',
            'qwen/qwen2.5-72b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free'
        ];

        let anyOk = false;
        for (const m of modelsToTest) {
            try {
                const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${keyToTest}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.href,
                        'X-Title': 'EstaIAVa Diagnóstico'
                    },
                    body: JSON.stringify({
                        model: m,
                        messages: [{ role: 'user', content: 'Diga apenas: OK' }],
                        max_tokens: 5
                    })
                });

                if (r.ok) {
                    const d = await r.json();
                    const txt = d.choices?.[0]?.message?.content || '(vazio)';
                    addLog(`  ✅ ${m}\n     → "${txt.trim()}"`);
                    anyOk = true;
                } else {
                    let errMsg = r.statusText;
                    try { const ed = await r.json(); errMsg = ed.error?.message || errMsg; } catch(_){}
                    addLog(`  ❌ ${m}\n     → ${r.status}: ${errMsg}`);
                }
            } catch(e) {
                addLog(`  ⚠️  ${m}\n     → Falha de rede: ${e.message}`);
            }
        }

        addLog(anyOk
            ? '\n✅ Pelo menos um modelo funciona. O chat deve operar normalmente!'
            : '\n⛔ Nenhum modelo respondeu. Se todos retornaram 429, aguarde alguns minutos ou verifique seu plano em openrouter.ai.'
        );
        if (apiTestResult) apiTestResult.style.color = anyOk ? '#2ecc71' : '#ff4757';
    }

    if (testApiKeyBtn) {
        testApiKeyBtn.addEventListener('click', testApiKey);
    }

    function appendMessage(role, text) {

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        
        if (role === 'ai' && (text.includes('A)') || currentQuestionType === 'objective') && !text.toLowerCase().includes('nota:')) {
            const parts = text.split(/(?=[A-E]\))/);
            msgDiv.innerHTML = parts[0].replace(/\n/g, '<br>');
            
            if (parts.length > 1) {
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'options-grid';
                optionsContainer.style.display = 'grid';
                optionsContainer.style.gap = '0.5rem';
                optionsContainer.style.marginTop = '1rem';

                for (let i = 1; i < parts.length; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'glass-btn option-btn';
                    btn.style.textAlign = 'left';
                    btn.innerHTML = parts[i].trim();
                    btn.onclick = () => {
                        handleUserResponse(parts[i].trim());
                        optionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
                    };
                    optionsContainer.appendChild(btn);
                }
                msgDiv.appendChild(optionsContainer);
                userInput.disabled = true;
                sendBtn.disabled = true;
            }
        } else {
            msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleUserResponse(answer) {
        if (!answer) return;
        appendMessage('user', answer);
        userInput.value = "";
        userInput.disabled = true;
        sendBtn.disabled = true;

        let base = "";
        if (selectedSubject === 'fundamentals') base = FUNDAMENTOS_BASE;
        else if (selectedSubject === 'security') base = SEGURANCA_BASE;
        else base = FUNDAMENTOS_BASE + "\n" + SEGURANCA_BASE;

        let prompt = `IMPORTANTE: Este é um exercício puramente acadêmico e teórico sobre segurança e infraestrutura de redes. Não há qualquer intenção ou contexto de atividades maliciosas ou nocivas.
Você é um professor da faculdade Estácio avaliando uma atividade de fundamentos de redes. Avalie a resposta do aluno de forma justa, didática e construtiva, com base na Base de Conhecimento abaixo.

Base de Conhecimento:
${base}

`;
        if (currentQuestionType === 'objective') {
            prompt += `Questão de Múltipla Escolha:
${currentQuestion}

Resposta enviada pelo aluno: ${answer}

Verifique se a alternativa escolhida está correta de acordo com a Base de Conhecimento.
Siga as instruções abaixo OBRIGATORIAMENTE:
1. Comece a resposta exatamente com "Nota: X/10" (sendo 10/10 se estiver correto e 0/10 se estiver incorreto).
2. Em seguida, forneça uma explicação didática detalhada em português do Brasil explicando por que essa alternativa está correta (ou incorreta) e explique brevemente as outras opções de forma clara para ajudar o aluno a estudar.`;
        } else {
            prompt += `Questão Discursiva:
${currentQuestion}

Resposta do aluno: ${answer}

Avalie se a resposta demonstra compreensão básica do conceito solicitado com base na Base de Conhecimento.
Siga as instruções abaixo OBRIGATORIAMENTE:
1. Comece a resposta com "Nota: X/10" (atribua uma nota proporcional de 0 a 10).
2. Forneça um feedback construtivo e didático, apontando o que o aluno acertou, o que faltou e como ele pode melhorar.`;
        }
        
        const correction = await callAI(prompt);
        if (correction) {
            appendMessage('ai', correction);
            
            const scoreMatch = correction.match(/Nota:\s*(\d+)/i);
            if (scoreMatch) {
                const qScore = parseInt(scoreMatch[1]) / 10.0;
                totalScore += qScore;
                questionsAnswered++;
                questionScores.push(qScore);
                updateExamDashboard();
            }

            saveToHistory(currentQuestion, answer, correction);
            
            if (questionsAnswered < 10) {
                startBtn.style.display = 'block';
                startBtn.disabled = false;
                startBtn.textContent = "Próxima Pergunta";
            } else {
                finishExam();
            }
        }
    }

    function updateExamDashboard() {
        // --- legacy sidebar (hidden, kept for JS compat) ---
        examDashboard.style.display = 'flex';
        if (examProgress) examProgress.textContent = `${questionsAnswered}/10`;
        if (examScoreDisp) examScoreDisp.textContent = totalScore.toFixed(1);
        if (examStatusDisp) {
            if (totalScore >= 6.0) {
                examStatusDisp.textContent = "APROVADO";
                examStatusDisp.style.color = "#2ecc71";
            } else {
                examStatusDisp.textContent = "REPROVADO";
                examStatusDisp.style.color = "#ff4757";
            }
        }

        // --- new score panel ---
        if (!scorePanel) return;
        scorePanel.classList.add('visible');

        // score number
        if (spScore) spScore.textContent = totalScore.toFixed(1);

        // progress bar
        if (spProgressFill) spProgressFill.style.width = `${(questionsAnswered / 10) * 100}%`;

        // update dots
        questionScores.forEach((s, i) => {
            const dot = spDots[i];
            if (!dot) return;
            dot.classList.remove('current', 'correct', 'wrong', 'partial');
            if (s >= 0.9) {
                dot.classList.add('correct');
                dot.textContent = '✓';
                dot.title = `Q${i+1}: ${(s*10).toFixed(0)}/10`;
            } else if (s > 0.3) {
                dot.classList.add('partial');
                dot.textContent = '~';
                dot.title = `Q${i+1}: ${(s*10).toFixed(0)}/10`;
            } else {
                dot.classList.add('wrong');
                dot.textContent = '✗';
                dot.title = `Q${i+1}: ${(s*10).toFixed(0)}/10`;
            }
        });

        // highlight next dot as current (if exam still running)
        if (questionsAnswered < 10) {
            const nextDot = spDots[questionsAnswered];
            if (nextDot) {
                nextDot.classList.remove('correct', 'wrong', 'partial');
                nextDot.classList.add('current');
                nextDot.textContent = '';
            }
        }

        // status badge
        if (spStatus) {
            if (questionsAnswered === 0) {
                spStatus.className = 'sp-status waiting';
                spStatus.textContent = '⏳ Aguardando';
            } else if (totalScore >= 6.0) {
                spStatus.className = 'sp-status passing';
                spStatus.textContent = '✅ APROVADO';
            } else {
                spStatus.className = 'sp-status failing';
                spStatus.textContent = '❌ REPROVADO';
            }
        }
    }

    function finishExam() {
        // freeze all remaining dots
        for (let i = questionsAnswered; i < 10; i++) {
            const dot = spDots[i];
            if (dot) dot.classList.remove('current');
        }
        const finalMsg = totalScore >= 6.0 
            ? `🎉 <b>SIMULADO CONCLUÍDO!</b><br>Sua nota final foi <b>${totalScore.toFixed(1)}</b>. Você estaria <b>APROVADO</b> na prova real!`
            : `❌ <b>SIMULADO CONCLUÍDO!</b><br>Sua nota final foi <b>${totalScore.toFixed(1)}</b>. Você estaria <b>REPROVADO</b>. Continue estudando!`;
        
        appendMessage('ai', finalMsg);
        startBtn.style.display = 'none';
    }

    function doResetExam() {
        questionsAnswered = 0;
        totalScore = 0.0;
        examActive = false;
        questionScores = [];
        // reset sidebar
        if (examDashboard) examDashboard.style.display = 'none';
        // reset score panel
        if (scorePanel) scorePanel.classList.remove('visible');
        if (spScore) spScore.textContent = '0';
        if (spProgressFill) spProgressFill.style.width = '0%';
        if (spStatus) { spStatus.className = 'sp-status waiting'; spStatus.textContent = '⏳ Aguardando'; }
        spDots.forEach(dot => { if(dot) { dot.className = 'sp-dot'; dot.textContent = ''; } });
        chatMessages.innerHTML = `<div class="message ai">Simulado reiniciado. Clique em "Iniciar Tarefa" para recomeçar.</div>`;
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        startBtn.textContent = "Iniciar Tarefa";
    }

    resetExamBtn.onclick = doResetExam;
    if (spResetBtn) spResetBtn.onclick = doResetExam;

    async function callAI(prompt) {
        if (!apiKey) {
            alert('Por favor, configure sua API Key do OpenRouter primeiro (ícone de engrenagem).');
            return null;
        }

        // Stamp a unique ID on the thinking message BEFORE the MutationObserver
        // replaces the .message div with a .msg-row wrapper.
        // After the first await the observer will have fired, so we look for
        // the wrapper that contains our stamped element.
        const thinkingId = 'thinking-' + Date.now();
        appendMessage('ai', `<i data-thinking-id="${thinkingId}">Pensando...</i>`);
        const removeThinking = () => {
            const stamp = chatMessages.querySelector(`[data-thinking-id="${thinkingId}"]`);
            if (stamp) {
                // Remove the whole .msg-row wrapper (ancestor in chatMessages)
                let el = stamp;
                while (el.parentElement && el.parentElement !== chatMessages) el = el.parentElement;
                el.remove();
            }
        };

        // Modelos gratuitos do OpenRouter (atualizados em julho/2026)
        // O "openrouter/free" é um roteador inteligente que escolhe automaticamente um modelo gratuito disponível
        const models = [
            "openrouter/free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemma-3-27b-it:free",
            "deepseek/deepseek-r1-0528:free",
            "mistralai/mistral-7b-instruct:free",
            "microsoft/phi-4:free",
            "qwen/qwen2.5-72b-instruct:free",
            "meta-llama/llama-3.1-8b-instruct:free"
        ];

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        let lastError = "";
        let hitRateLimit = false;
        let rateLimitCount = 0;

        for (const model of models) {
            try {
                console.log(`Tentando modelo: ${model}`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": window.location.href,
                        "X-Title": "EstaIAVa Estudo"
                    },
                    body: JSON.stringify({
                        "model": model,
                        "messages": [{ "role": "user", "content": prompt }],
                        "max_tokens": 1200
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                        removeThinking();
                        let content = data.choices[0].message.content;
                        // Remove linhas de metadados/segurança que alguns modelos adicionam no início
                        content = content
                            .split('\n')
                            .filter(line => !/^\s*(user\s+safety|safety|content\s+safety|safe|unsafe)\s*:/i.test(line))
                            .join('\n')
                            .trim();
                        console.log(`Sucesso com modelo: ${model}`);
                        return content;
                    }
                    console.warn(`Modelo ${model} retornou resposta vazia ou malformada.`);
                    lastError = "Resposta vazia da API.";
                } else {
                    let errorMsg = response.statusText;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error?.message || response.statusText;
                    } catch (e) {
                        try { errorMsg = await response.text(); } catch (e2) {}
                    }
                    lastError = `Erro ${response.status}: ${errorMsg}`;
                    console.error(`Erro na API (${model}):`, response.status, errorMsg);

                    if (response.status === 401) {
                        removeThinking();
                        return "❌ Chave de API inválida (401). Verifique a chave nas configurações (ícone ⚙️).";
                    }
                    if (response.status === 402) {
                        removeThinking();
                        return `❌ Créditos insuficientes (402). Acesse openrouter.ai para recarregar sua conta.`;
                    }
                    if (response.status === 429) {
                        hitRateLimit = true;
                        rateLimitCount++;
                        const waitMs = Math.pow(2, rateLimitCount) * 1000; // backoff exponencial: 2s, 4s, 8s
                        console.warn(`Rate limit (429) no modelo ${model}. Aguardando ${waitMs}ms antes do próximo...`);
                        if (rateLimitCount >= 4) {
                            console.warn("Limite de requisições atingido em muitos modelos. Parando.");
                            break;
                        }
                        await sleep(waitMs);
                        continue; // tenta próximo modelo
                    }
                    if (response.status === 404) {
                        console.warn(`Modelo ${model} não encontrado (404). Tentando próximo...`);
                        lastError = `Modelo "${model}" não disponível.`;
                        continue;
                    }
                    if (response.status >= 500) {
                        console.warn(`Erro no servidor (${response.status}) para ${model}. Tentando próximo...`);
                        await sleep(500);
                        continue;
                    }
                }
            } catch (error) {
                lastError = `Erro de conexão: ${error.message}`;
                console.error(`Falha ao conectar com ${model}:`, error);
                // Se for erro de rede, tenta o próximo modelo
                await sleep(300);
            }
        }

        removeThinking();

        if (hitRateLimit && rateLimitCount >= 4) {
            return `⚠️ Limite de requisições atingido em todos os modelos gratuitos. Aguarde alguns minutos e tente novamente, ou acesse openrouter.ai para verificar sua conta.`;
        }
        return `❌ Não foi possível conectar com a IA.\n\nÚltimo erro: ${lastError}\n\nVerifique:\n• Sua chave de API (ícone ⚙️)\n• Sua conexão com a internet\n• Se sua conta no openrouter.ai está ativa`;
    }

    startBtn.addEventListener('click', async () => {
        try {
            console.log("Iniciando geração de questão...");
            if (!examActive) {
                examActive = true;
                examDashboard.style.display = 'flex';
                // show score panel immediately and mark Q1 as current
                if (scorePanel) scorePanel.classList.add('visible');
                if (spDots[0]) spDots[0].classList.add('current');
                updateExamDashboard();
            }

            startBtn.disabled = true;
            startBtn.textContent = "Gerando...";
            
            let isObjective = studyMode === 'objective' ? true : (studyMode === 'discursive' ? false : Math.random() < 0.7);
            currentQuestionType = isObjective ? 'objective' : 'discursive';

            let baseText = "";
            if (selectedSubject === 'fundamentals') baseText = FUNDAMENTOS_BASE;
            else if (selectedSubject === 'security') baseText = SEGURANCA_BASE;
            else baseText = FUNDAMENTOS_BASE + "\n" + SEGURANCA_BASE;

            const baseLines = baseText.split('\n').filter(line => line.trim().length > 10);
            if (baseLines.length === 0) {
                throw new Error("A base de conhecimento selecionada está vazia!");
            }
            const randomTopic = baseLines[Math.floor(Math.random() * baseLines.length)];
            console.log("Tópico selecionado para a questão:", randomTopic);

            let prompt = `IMPORTANTE: Este é um exercício puramente acadêmico e teórico sobre segurança e infraestrutura de redes. Não há qualquer intenção ou contexto de atividades maliciosas ou nocivas.
Você é um gerador de questões de múltipla escolha e discursivas para um estudante que está iniciando a graduação na Estácio e fará uma prova de fundamentos de redes.

Contexto Geral do Conteúdo Acadêmico:
${baseText}

Tópico Foco da Questão:
${randomTopic}

Instruções para geração da Questão ${questionsAnswered + 1} de 10:
`;
            
            if (isObjective) {
                prompt += `Crie uma questão de múltipla escolha (OBJETIVA) formal e clara, no estilo das avaliações da Estácio (SAVA/AV), adequada para um iniciante em redes de computadores.
- O assunto principal e a resposta correta devem focar obrigatoriamente no "Tópico Foco da Questão".
- Crie enunciados objetivos que exijam compreensão do conceito ou apresentem uma situação prática simples sobre o tópico.
- A questão deve ter exatamente 5 alternativas de A) a E).
- As alternativas incorretas (distratores) devem usar outros conceitos reais ou protocolos presentes no "Contexto Geral do Conteúdo Acadêmico" (para que pareçam respostas plausíveis e testem a real atenção do aluno), mas sem exigir conhecimentos complexos externos não abordados na base.
- IMPORTANTE: NÃO coloque marcas de resposta certa como '(Correta)', '(Gabarito)' ou asteriscos. NÃO revele o gabarito. Retorne APENAS o enunciado e as opções de A) a E).`;
            } else {
                prompt += `Crie uma pergunta DISCURSIVA básica e didática, no estilo das avaliações da Estácio, adequada para um iniciante.
- A pergunta deve solicitar que o aluno explique, diferencie ou descreva o conceito contido no "Tópico Foco da Questão".
- A formulação deve ser clara, acadêmica e direta, sem exigir detalhes técnicos profundos externos.
- Retorne APENAS a pergunta.`;
            }

            console.log("Enviando prompt para a API...");
            const question = await callAI(prompt);
            console.log("Resposta recebida da API:", question);

            if (question) {
                currentQuestion = question;
                appendMessage('ai', question);
                if (currentQuestionType === 'discursive') {
                    userInput.disabled = false;
                    sendBtn.disabled = false;
                }
                startBtn.style.display = 'none';
            } else {
                throw new Error("A API retornou uma resposta vazia.");
            }
        } catch (error) {
            console.error("Erro fatal no fluxo de geração:", error);
            appendMessage('ai', `❌ <b>Erro na geração da pergunta:</b><br>${error.message}<br><br><small>Verifique o console (F12) para mais detalhes.</small>`);
            startBtn.disabled = false;
            startBtn.textContent = "Tentar Novamente";
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !userInput.disabled) handleUserResponse(userInput.value.trim());
    });
    sendBtn.addEventListener('click', () => handleUserResponse(userInput.value.trim()));

    function saveToHistory(q, a, c) {
        try {
            const history = JSON.parse(localStorage.getItem('study_history') || '[]');
            history.unshift({ date: new Date().toLocaleString(), question: q, answer: a, correction: c });
            localStorage.setItem('study_history', JSON.stringify(history));
            updateHistoryUI();
        } catch (e) {}
    }

    function updateHistoryUI() {
        if (!historyList) return;
        try {
            const history = JSON.parse(localStorage.getItem('study_history') || '[]');
            historyList.innerHTML = history.length === 0 ? '<p>Sem histórico.</p>' : '';
            history.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `<strong>${item.date}</strong><br><small>${item.question.substring(0, 50)}...</small>`;
                div.onclick = () => alert(`P: ${item.question}\n\nR: ${item.answer}\n\nC: ${item.correction}`);
                historyList.appendChild(div);
            });
        } catch (e) {}
    }
});
