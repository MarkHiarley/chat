// Dados do usuário
let userData = {
    nomeCompleto: '',
    nome: '',
    sobrenome: '',
    telefone: '',
    email: '',
    empresa: '',
    segmento: '',
    cargo: '',
    faturamento: '',
    colaboradores: ''
};

// Controle do fluxo da conversa
let currentStep = 0;

// Função para separar nome e sobrenome
function separarNome(nomeCompleto) {
    const partes = nomeCompleto.trim().split(' ');
    const nome = partes[0];
    const sobrenome = partes.slice(1).join(' ') || '';
    return { nome, sobrenome };
}

// Perguntas do bot
const conversationFlow = [
    {
        key: 'nomeCompleto',
        question: (data) => "Bom dia! Sou o assistente da Chatvolt. Vou te ajudar a criar um Plano 100% Personalizado de IA para sua empresa - focado em aumentar receita, reduzir custos e multiplicar sua margem.<br><br>Então bora começar! Qual seu nome completo?",
        placeholder: "Digite seu nome completo..."
    },
    {
        key: 'telefone',
        question: (data) => `Prazer, ${data.nome}! Qual seu telefone?`,
        placeholder: "Digite seu telefone com DDD (ex: 85988889242)..."
    },
    {
        key: 'email',
        question: (data) => `Perfeito, ${data.nome}! Confirmado seu número de contato. Para darmos o próximo passo, qual seria o seu melhor e-mail, por favor. Qual seu e-mail?`,
        placeholder: "Digite seu e-mail (ex: seu@email.com)..."
    },
    {
        key: 'empresa',
        question: (data) => "Ótimo! Qual o nome da sua empresa?",
        placeholder: "Digite o nome da sua empresa..."
    },
    {
        key: 'segmento',
        question: (data) => `Legal, ${data.empresa}! Qual o segmento da sua empresa?`,
        placeholder: "Digite o segmento (ex: Tecnologia, Saúde, Educação)..."
    },
    {
        key: 'cargo',
        question: (data) => `Ótimo! E qual é o seu cargo na ${data.empresa}?`,
        placeholder: "Digite seu cargo (ex: CEO, Diretor, Gerente)..."
    },
    {
        key: 'faturamento',
        question: (data) => "Excelente! Alguém com sua visão estratégica consegue impulsionar a inovação e ver o impacto rápido no negócio. Estamos preparando algo especial para você! Hoje, qual é o seu faturamento anual?",
        placeholder: "Digite o faturamento anual (ex: R$ 500k, R$ 1M)..."
    },
    {
        key: 'colaboradores',
        question: (data) => "Excelente! Com essas informações, já temos dados para seu diagnóstico. Quantos colaboradores a empresa possui?",
        placeholder: "Digite a quantidade de colaboradores..."
    },
    {
        key: 'final',
        question: (data) => `${data.nome}, com sua visão de ${data.cargo}, sua empresa tem um potencial incrível para otimização com IA. Identificamos uma economia estimada de R$ 8.000 a R$ 15.000 mensais com automações estratégicas! Temos poucas vagas restantes para diagnósticos de alto nível esta semana, então garanta já sua sessão estratégica com nosso time.<br><br>Após agendar, você receberá por e-mail e WhatsApp um Plano Personalizado de IA para a ${data.empresa} - com diagnóstico exclusivo e oportunidades de automação.<br><br>Escolha o melhor horário abaixo:`,
        placeholder: ""
    }
];

// Elementos DOM
const messagesContainer = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Função para atualizar o placeholder
function atualizarPlaceholder() {
    if (currentStep < conversationFlow.length) {
        userInput.placeholder = conversationFlow[currentStep].placeholder || '';
    }
}

// Função para adicionar mensagem do usuário
function addUserMessage(message) {
    const userMessageContainer = document.createElement('div');
    userMessageContainer.className = 'user-message-container';
    
    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.textContent = message;
    
    userMessageContainer.appendChild(userMessage);
    messagesContainer.appendChild(userMessageContainer);
    
    scrollToBottom();
}

// Função para adicionar indicador de "digitando..."
function addTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'reponse typing-indicator';
    typingIndicator.id = 'typing-indicator';
    
    typingIndicator.innerHTML = `
        <img src="./scr/assets/img/logo.png" alt="">
        <div class="chatvolt-message">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}

// Função para remover indicador de "digitando..."
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Função para esconder o input
function hideInput() {
    const inputContainer = document.querySelector('.input-container');
    inputContainer.style.display = 'none';
}

// Função para mostrar o input
function showInput() {
    const inputContainer = document.querySelector('.input-container');
    inputContainer.style.display = 'flex';
}

// Função para adicionar mensagem do bot
function addBotMessage(message) {
    removeTypingIndicator();
    
    const botMessage = document.createElement('div');
    botMessage.className = 'reponse';
    
    botMessage.innerHTML = `
        <img src="./scr/assets/img/logo.png" alt="">
        <div class="chatvolt-message">
            ${message}
        </div>
    `;
    
    messagesContainer.appendChild(botMessage);
    scrollToBottom();
}

// Função para salvar dados no Google Sheets
async function salvarNoGoogleSheets(dados) {
    // Pega a URL da variável de ambiente
    const GOOGLE_SCRIPT_URL = process.env.PLANILHAURL || window.ENV?.PLANILHAURL || '';
    
    if (!GOOGLE_SCRIPT_URL) {
        console.error('URL da planilha não configurada. Configure a variável PLANILHAURL no arquivo .env');
        return false;
    }
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        console.log('Dados enviados para Google Sheets com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro ao enviar dados para Google Sheets:', error);
        return false;
    }
}

// Função para adicionar o Calendly
function addCalendly() {
    removeTypingIndicator();
    
    // Formata o telefone com +55
    const telefoneFormatado = userData.telefone.startsWith('+55') 
        ? userData.telefone 
        : `+55${userData.telefone.replace(/\D/g, '')}`;
    
    // Monta todas as informações de forma organizada para o campo de nome da empresa
    const empresaDetalhada = `${userData.empresa} - Segmento: ${userData.segmento} - Cargo: ${userData.cargo} - Faturamento: ${userData.faturamento} - Colaboradores: ${userData.colaboradores}`;
    
    // Prepara os dados para enviar ao Google Sheets
    const dadosParaSheets = {
        nome: userData.nome,
        sobrenome: userData.sobrenome,
        email: userData.email,
        telefone: telefoneFormatado,
        empresa: userData.empresa,
        segmento: userData.segmento,
        cargo: userData.cargo,
        faturamento: userData.faturamento,
        colaboradores: userData.colaboradores
    };
    
    // Envia os dados para o Google Sheets
    salvarNoGoogleSheets(dadosParaSheets);
    
    // Prepara os parâmetros para preencher o formulário do Calendly
    const baseUrl = 'https://calendly.com/d/ctgw-sm7-283/chatvolt-reuniao-comercial';
    
    // Monta a URL com os parâmetros
    const calendlyUrl = `${baseUrl}?hide_gdpr_banner=1&primary_color=A556F7&first_name=${encodeURIComponent(userData.nome)}&last_name=${encodeURIComponent(userData.sobrenome)}&email=${encodeURIComponent(userData.email)}&a1=${encodeURIComponent(telefoneFormatado)}&a2=${encodeURIComponent(empresaDetalhada)}`;
    
    // Cria container para o Calendly
    const calendlyContainer = document.createElement('div');
    calendlyContainer.className = 'calendly-container';
    
    calendlyContainer.innerHTML = `
        <div class="calendly-wrapper">
            <div class="calendly-inline-widget" 
                 data-url="${calendlyUrl}" 
                 style="min-width:320px;height:700px;">
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(calendlyContainer);
    
    // Carrega o script do Calendly se ainda não foi carregado
    if (!document.querySelector('script[src*="calendly"]')) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);
    }
    
    scrollToBottom();
    
    // Salva os dados do usuário (aqui você pode enviar para um servidor/API)
    console.log('Dados do usuário coletados:', userData);
    console.log('Telefone formatado:', telefoneFormatado);
    console.log('Empresa com informações:', empresaDetalhada);
    console.log('Dados enviados para Google Sheets:', dadosParaSheets);
}

// Função para rolar para o final
function scrollToBottom() {
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// Função para validar nome
function validarNome(nome) {
    if (nome.length < 3) {
        return { valido: false, mensagem: 'Por favor, digite seu nome completo (mínimo 3 caracteres).' };
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) {
        return { valido: false, mensagem: 'Por favor, digite apenas letras no nome.' };
    }
    return { valido: true };
}

// Função para validar telefone
function validarTelefone(telefone) {
    const apenasNumeros = telefone.replace(/\D/g, '');
    if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
        return { valido: false, mensagem: 'Por favor, digite um telefone válido com DDD (ex: 85988889242).' };
    }
    return { valido: true };
}

// Função para validar email
function validarEmail(email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
        return { valido: false, mensagem: 'Por favor, digite um e-mail válido (ex: seu@email.com).' };
    }
    return { valido: true };
}

// Função para validar empresa
function validarEmpresa(empresa) {
    if (empresa.length < 2) {
        return { valido: false, mensagem: 'Por favor, digite o nome da sua empresa (mínimo 2 caracteres).' };
    }
    return { valido: true };
}

// Função para validar segmento
function validarSegmento(segmento) {
    if (segmento.length < 3) {
        return { valido: false, mensagem: 'Por favor, digite o segmento da sua empresa (mínimo 3 caracteres).' };
    }
    return { valido: true };
}

// Função para validar cargo
function validarCargo(cargo) {
    if (cargo.length < 2) {
        return { valido: false, mensagem: 'Por favor, digite seu cargo (mínimo 2 caracteres).' };
    }
    return { valido: true };
}

// Função para validar faturamento
function validarFaturamento(faturamento) {
    if (faturamento.length < 2) {
        return { valido: false, mensagem: 'Por favor, digite o faturamento anual da empresa.' };
    }
    return { valido: true };
}

// Função para validar colaboradores
function validarColaboradores(colaboradores) {
    if (colaboradores.length < 1) {
        return { valido: false, mensagem: 'Por favor, digite a quantidade de colaboradores.' };
    }
    return { valido: true };
}

// Função geral de validação
function validarCampo(key, valor) {
    switch(key) {
        case 'nomeCompleto':
            return validarNome(valor);
        case 'telefone':
            return validarTelefone(valor);
        case 'email':
            return validarEmail(valor);
        case 'empresa':
            return validarEmpresa(valor);
        case 'segmento':
            return validarSegmento(valor);
        case 'cargo':
            return validarCargo(valor);
        case 'faturamento':
            return validarFaturamento(valor);
        case 'colaboradores':
            return validarColaboradores(valor);
        default:
            return { valido: true };
    }
}

// Função para processar a resposta do usuário
function processUserInput() {
    const message = userInput.value.trim();
    
    if (message === '') return;
    
    // Valida o campo atual antes de prosseguir
    if (currentStep < conversationFlow.length - 1) {
        const currentKey = conversationFlow[currentStep].key;
        const validacao = validarCampo(currentKey, message);
        
        if (!validacao.valido) {
            // Se não for válido, mostra mensagem de erro
            addUserMessage(message);
            userInput.value = '';
            hideInput();
            
            addTypingIndicator();
            setTimeout(() => {
                addBotMessage(validacao.mensagem);
                showInput();
                userInput.focus();
                atualizarPlaceholder();
            }, 1500);
            return;
        }
    }
    
    // Adiciona mensagem do usuário
    addUserMessage(message);
    
    // Salva a resposta
    if (currentStep < conversationFlow.length - 1) {
        const currentKey = conversationFlow[currentStep].key;
        userData[currentKey] = message;
        
        // Se for o nome completo, separa em nome e sobrenome
        if (currentKey === 'nomeCompleto') {
            const { nome, sobrenome } = separarNome(message);
            userData.nome = nome;
            userData.sobrenome = sobrenome;
        }
    }
    
    // Limpa o input
    userInput.value = '';
    
    // Esconde o input
    hideInput();
    
    // Avança para a próxima pergunta
    currentStep++;
    
    // Adiciona indicador de digitando
    if (currentStep < conversationFlow.length) {
        addTypingIndicator();
        
        // Adiciona próxima pergunta do bot com delay (2 segundos)
        setTimeout(() => {
            const nextQuestion = conversationFlow[currentStep].question(userData);
            addBotMessage(nextQuestion);
            
            // Se chegou no final, mostra o Calendly
            if (currentStep === conversationFlow.length - 1) {
                // Aguarda 1 segundo e mostra o Calendly
                setTimeout(() => {
                    addTypingIndicator();
                    setTimeout(() => {
                        addCalendly();
                    }, 1500);
                }, 1000);
            } else {
                // Mostra o input novamente
                showInput();
                userInput.focus();
                atualizarPlaceholder();
            }
        }, 2000);
    }
}

// Event listeners
sendButton.addEventListener('click', processUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        processUserInput();
    }
});

// Foco no input ao carregar
window.addEventListener('load', () => {
    userInput.focus();
    atualizarPlaceholder();
});