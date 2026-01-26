// Dados do usuário
let userData = {
    nome: '',
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

// Perguntas do bot
const conversationFlow = [
    {
        key: 'nome',
        question: (data) => "Bom dia! Sou o assistente da Chatvolt. Vou te ajudar a criar um Plano 100% Personalizado de IA para sua empresa - focado em aumentar receita, reduzir custos e multiplicar sua margem.<br><br>Então bora começar! Qual seu nome?"
    },
    {
        key: 'telefone',
        question: (data) => `Prazer, ${data.nome}! Qual seu telefone?`
    },
    {
        key: 'email',
        question: (data) => `Perfeito, ${data.nome}! Confirmado seu número de contato. Para darmos o próximo passo, qual seria o seu melhor e-mail, por favor. Qual seu e-mail?`
    },
    {
        key: 'empresa',
        question: (data) => "Ótimo! Qual o nome da sua empresa?"
    },
    {
        key: 'segmento',
        question: (data) => `Legal, ${data.empresa}! Qual o segmento da sua empresa?`
    },
    {
        key: 'cargo',
        question: (data) => `Ótimo! E qual é o seu cargo na ${data.empresa}?`
    },
    {
        key: 'faturamento',
        question: (data) => "Excelente! Alguém com sua visão estratégica consegue impulsionar a inovação e ver o impacto rápido no negócio. Estamos preparando algo especial para você! Hoje, qual é o seu faturamento anual?"
    },
    {
        key: 'colaboradores',
        question: (data) => "Excelente! Com essas informações, já temos dados para seu diagnóstico. Quantos colaboradores a empresa possui?"
    },
    {
        key: 'final',
        question: (data) => `${data.nome}, com sua visão de ${data.cargo}, sua empresa tem um potencial incrível para otimização com IA. Identificamos uma economia estimada de R$ 8.000 a R$ 15.000 mensais com automações estratégicas! Temos poucas vagas restantes para diagnósticos de alto nível esta semana, então garanta já sua sessão estratégica com nosso time.<br><br>Após agendar, você receberá por e-mail e WhatsApp um Plano Personalizado de IA para a ${data.empresa} - com diagnóstico exclusivo e oportunidades de automação.<br><br>Escolha o melhor horário abaixo:`
    }
];

// Elementos DOM
const messagesContainer = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

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

// Função para adicionar o Calendly
function addCalendly() {
    removeTypingIndicator();
    
    // Formata o telefone com +55
    const telefoneFormatado = userData.telefone.startsWith('+55') 
        ? userData.telefone 
        : `+55${userData.telefone.replace(/\D/g, '')}`;
    
    // Monta as informações adicionais para o campo de notas/observações
    const informacoesAdicionais = `
📊 INFORMAÇÕES DA EMPRESA:
• Empresa: ${userData.empresa}
• Segmento: ${userData.segmento}
• Cargo do contato: ${userData.cargo}
• Faturamento anual: ${userData.faturamento}
• Número de colaboradores: ${userData.colaboradores}

🎯 Tipo de uso: Para minha empresa
    `.trim();
    
    // Prepara os parâmetros para preencher o formulário do Calendly
    const baseUrl = 'https://calendly.com/d/ctgw-sm7-283/chatvolt-reuniao-comercial';
    const params = new URLSearchParams({
        hide_gdpr_banner: '1',
        primary_color: 'A556F7',
        name: userData.nome || '',
        email: userData.email || '',
        a1: telefoneFormatado, // Telefone com +55
        a2: userData.empresa || '', // Nome da empresa
        a3: informacoesAdicionais // Todas as informações adicionais
    });
    
    const calendlyUrl = `${baseUrl}?${params.toString()}`;
    
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
    console.log('Informações adicionais:', informacoesAdicionais);
    
    // Você pode fazer uma chamada API aqui para salvar os dados
    // saveUserData(userData);
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

// Função para processar a resposta do usuário
function processUserInput() {
    const message = userInput.value.trim();
    
    if (message === '') return;
    
    // Adiciona mensagem do usuário
    addUserMessage(message);
    
    // Salva a resposta
    if (currentStep < conversationFlow.length - 1) {
        const currentKey = conversationFlow[currentStep].key;
        userData[currentKey] = message;
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
});