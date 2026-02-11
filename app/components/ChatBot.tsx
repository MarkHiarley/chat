'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { sendMessageToGemini } from '../lib/gemini';
import {
  validateNomeCompleto,
  validatePhone,
  validateCorporateEmail,
  validateEmpresa,
  validateSegmento,
  validateFaturamento,
  validateColaboradores,
  type ValidationResult
} from '../lib/validation';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface UserData {
  nomeCompleto: string;
  nome: string;
  sobrenome: string;
  telefone: string;
  email: string;
  empresa: string;
  segmento: string;
  faturamento: string;
  colaboradores: string;
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot' as const,
      content: 'Olá! 👋\n\nQuero entender um pouco do seu contexto para te ajudar a desenhar a melhor estratégia para sua empresa, pensando em crescimento e otimização de custos.\n\nAssumimos toda a complexidade técnica e operacional para você focar no que importa: resultados.\n\nPara começar, qual seu nome completo?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [leadBlocked, setLeadBlocked] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    nomeCompleto: '',
    nome: '',
    sobrenome: '',
    telefone: '',
    email: '',
    empresa: '',
    segmento: '',
    faturamento: '',
    colaboradores: ''
  });
  const [showCalendly, setShowCalendly] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversationSteps = [
    'nomeCompleto',
    'telefone',
    'email',
    'empresa',
    'segmento',
    'faturamento',
    'colaboradores',
    'final'
  ];

  // Função de validação por campo
  const validateField = (field: string, value: string): ValidationResult => {
    switch (field) {
      case 'nomeCompleto':
        return validateNomeCompleto(value);
      case 'telefone':
        return validatePhone(value);
      case 'email':
        return validateCorporateEmail(value);
      case 'empresa':
        return validateEmpresa(value);
      case 'segmento':
        return validateSegmento(value);
      case 'faturamento':
        return validateFaturamento(value);
      case 'colaboradores':
        return validateColaboradores(value);
      default:
        return { isValid: true };
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Carregar script do Calendly
  useEffect(() => {
    if (showCalendly && !document.querySelector('script[src*="calendly"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [showCalendly]);

  const separarNome = (nomeCompleto: string) => {
    const partes = nomeCompleto.trim().split(' ');
    const nome = partes[0];
    const sobrenome = partes.slice(1).join(' ') || '';
    return { nome, sobrenome };
  };

  // Função para normalizar telefone manualmente (fallback)
  const normalizarTelefone = (phone: string): string => {
    // Remove tudo que não é número
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se não tiver números suficientes, retorna original
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return phone;
    }

    // Formata: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (cleanPhone.length === 11) {
      // Celular: (XX) 9XXXX-XXXX
      return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
    } else {
      // Fixo: (XX) XXXX-XXXX
      return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
    }
  };

  const getNextQuestion = (step: string, data: UserData): string => {
    switch (step) {
      case 'telefone':
        return `Ótimo, ${data.nome}! Para continuarmos nossa conversa, qual seria o seu telefone para contato?`;
      
      case 'email':
        return `Perfeito! Agora preciso do seu e-mail corporativo da empresa. Qual seria?`;
      
      case 'empresa':
        return `Legal, ${data.nome}! Para qual empresa você trabalha?`;
      
      case 'segmento':
        return `Entendi! E qual o segmento/área de atuação da ${data.empresa}?`;
      
      case 'faturamento':
        return `Ótimo! Para desenharmos a melhor estratégia, qual é o faturamento anual aproximado da ${data.empresa}?`;
      
      case 'colaboradores':
        return `Perfeito! E quantos colaboradores a ${data.empresa} possui atualmente?`;
      
      case 'final':
        return `Excelente, ${data.nome}! Com base no que você me contou sobre a ${data.empresa}, identificamos um grande potencial de otimização com IA.\n\nVamos agendar uma conversa estratégica para apresentarmos soluções personalizadas que podem impulsionar seus resultados?\n\nEscolha o melhor horário abaixo:`;
      
      default:
        return 'Como posso ajudar?';
    }
  };

  // Nova função: Interpreta e valida a resposta do usuário com IA
  const interpretUserResponse = async (step: string, userInput: string, data: UserData): Promise<{ 
    isValid: boolean; 
    normalizedValue: string; 
    feedback?: string 
  }> => {
    const prompts: Record<string, string> = {
      nomeCompleto: `
Analise esta resposta de nome completo: "${userInput}"

A pessoa respondeu à pergunta sobre NOME COMPLETO (nome e sobrenome).

Tarefa:
1. Verifique se há pelo menos nome e sobrenome (mínimo 2 palavras)
2. Corrija capitalização: cada palavra deve começar com maiúscula
3. Remova números, caracteres especiais ou emojis
4. Se for apenas um nome (sem sobrenome), peça o nome completo
5. Se for texto aleatório sem sentido, peça para digitar o nome novamente

IMPORTANTE: Corrija nomes com capitalização errada automaticamente:
- "joão silva" → "João Silva" ✅
- "MARIA SANTOS" → "Maria Santos" ✅
- "pedro DE oliveira" → "Pedro de Oliveira" ✅
- "ana" → INVÁLIDO (apenas um nome) ❌
- "123 teste" → INVÁLIDO (não é um nome) ❌

Responda APENAS neste formato JSON:
{"isValid": true, "normalizedValue": "Nome Completo Corrigido", "feedback": ""}

Se inválido:
{"isValid": false, "normalizedValue": "", "feedback": "Por favor, digite seu nome completo (nome e sobrenome). Exemplo: João Silva"}
`,
      telefone: `
Analise esta resposta de telefone: "${userInput}"

Tarefa:
1. Extraia APENAS os números do telefone
2. Verifique se tem entre 10-11 dígitos
3. Normalize para formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
4. Se NÃO for um telefone válido, retorne feedback educado

IMPORTANTE: Aceite números com ou sem formatação. Exemplos válidos:
- 88981899242 → (88) 98189-9242 ✅
- 8898189-9242 → (88) 98189-9242 ✅
- (88) 98189-9242 → (88) 98189-9242 ✅
- 88 9 81899242 → (88) 98189-9242 ✅

Responda APENAS neste formato JSON:
{"isValid": true, "normalizedValue": "(88) 98189-9242", "feedback": ""}

Se inválido (menos de 10 dígitos, texto sem sentido):
{"isValid": false, "normalizedValue": "", "feedback": "Por favor, insira um telefone válido com DDD. Exemplo: (11) 99999-9999"}
`,
      email: `
Analise esta resposta de email: "${userInput}"

A pessoa respondeu à pergunta sobre EMAIL CORPORATIVO.

Tarefa:
1. Verifique se é um email válido
2. Se for email pessoal (gmail, hotmail, yahoo, outlook.com), marque como inválido
3. Normalize para lowercase
4. Se inválido, explique o motivo de forma educada

Responda APENAS neste formato JSON:
{"isValid": true/false, "normalizedValue": "email normalizado", "feedback": "mensagem se inválido"}
`,
      empresa: `
Analise esta resposta sobre nome da empresa: "${userInput}"

Tarefa:
1. Identifique se é um nome de empresa válido
2. Normalize o nome (primeira letra maiúscula)
3. Se a resposta for vaga ou irrelevante, peça esclarecimento

Responda APENAS neste formato JSON:
{"isValid": true/false, "normalizedValue": "nome normalizado", "feedback": "mensagem se inválido"}

Exemplos de válidos: "Amazon", "Mercado Livre", "XYZ Tecnologia"
Exemplos de inválidos: "trabalho numa empresa", "não posso falar", "empresa boa"
`,
      segmento: `
Analise esta resposta sobre segmento de atuação: "${userInput}"

Empresa: ${data.empresa}

Tarefa:
1. Identifique se é um segmento/área de negócio válido
2. Normalize para formato claro (ex: "Tecnologia", "Varejo", "Saúde")
3. Se muito vago, peça mais especificidade

Responda APENAS neste formato JSON:
{"isValid": true/false, "normalizedValue": "segmento normalizado", "feedback": "mensagem se inválido"}
`,
      faturamento: `
Analise esta resposta sobre faturamento anual: "${userInput}"

Empresa: ${data.empresa}

Tarefa:
1. Extraia o valor numérico (aceite aproximações como "cerca de 2 milhões")
2. Normalize para formato com R$ (ex: "R$ 2.000.000", "R$ 500.000")
3. Se não for possível extrair valor, peça esclarecimento

Responda APENAS neste formato JSON:
{"isValid": true/false, "normalizedValue": "R$ valor", "feedback": "mensagem se inválido"}

Exemplos válidos: "2 milhões", "500k", "aproximadamente 1.5M", "R$ 800.000"
`,
      colaboradores: `
Analise esta resposta sobre número de colaboradores: "${userInput}"

Empresa: ${data.empresa}

Tarefa:
1. Extraia o número de funcionários (aceite aproximações como "uns 50")
2. Normalize para número (ex: "50", "120")
3. Se não conseguir extrair número, peça esclarecimento

Responda APENAS neste formato JSON:
{"isValid": true/false, "normalizedValue": "número", "feedback": "mensagem se inválido"}

Exemplos válidos: "50 pessoas", "aproximadamente 100", "entre 80 e 90", "120"
`
    };

    try {
      const prompt = prompts[step];
      if (!prompt) {
        return { isValid: true, normalizedValue: userInput };
      }

      const response = await sendMessageToGemini(prompt);
      
      // Tenta fazer parse da resposta JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Se for telefone e a IA não conseguiu normalizar, faz manualmente
        if (step === 'telefone' && parsed.isValid && !parsed.normalizedValue) {
          parsed.normalizedValue = normalizarTelefone(userInput);
        }
        
        return {
          isValid: parsed.isValid,
          normalizedValue: parsed.normalizedValue || userInput,
          feedback: parsed.feedback
        };
      }

      // Fallback: se for telefone, tenta normalizar manualmente
      if (step === 'telefone') {
        return { isValid: true, normalizedValue: normalizarTelefone(userInput) };
      }

      return { isValid: true, normalizedValue: userInput };
    } catch (error) {
      console.error('Erro ao interpretar resposta:', error);
      
      // Fallback: se for telefone, tenta normalizar manualmente
      if (step === 'telefone') {
        return { isValid: true, normalizedValue: normalizarTelefone(userInput) };
      }
      return { isValid: true, normalizedValue: userInput };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || leadBlocked) return;

    const userMessage = inputValue.trim();
    const currentKey = conversationSteps[currentStep] as keyof UserData;

    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsTyping(true);

    // Aguarda um pouco para parecer mais natural
    await new Promise(resolve => setTimeout(resolve, 800));

    // NOVA LÓGICA: Interpreta a resposta com IA primeiro
    const interpretation = await interpretUserResponse(currentKey, userMessage, userData);

    // Se a IA detectou problema, mostra feedback
    if (!interpretation.isValid && interpretation.feedback) {
      setMessages(prev => [...prev, { role: 'bot', content: interpretation.feedback || 'Por favor, tente novamente.' }]);
      setIsTyping(false);
      return;
    }

    // Usa o valor normalizado pela IA
    const normalizedValue = interpretation.normalizedValue;

    // Validação do campo atual com valor normalizado
    const validation = validateField(currentKey, normalizedValue);
    
    if (!validation.isValid) {
      setMessages(prev => [...prev, { role: 'bot', content: validation.message || 'Por favor, tente novamente.' }]);
      setIsTyping(false);

      // Se deve bloquear o lead (fora do ICP)
      if (validation.shouldBlock) {
        setLeadBlocked(true);
      }

      inputRef.current?.focus();
      return;
    }

    // Salva dados com valor normalizado
    const newUserData = { ...userData, [currentKey]: normalizedValue };

    // Se for nome completo, separar
    if (currentKey === 'nomeCompleto') {
      const { nome, sobrenome } = separarNome(normalizedValue);
      newUserData.nome = nome;
      newUserData.sobrenome = sobrenome;
    }

    setUserData(newUserData);

    // Aguarda 2 segundos (simulando digitação)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Próxima pergunta
    const nextStep = currentStep + 1;
    
    if (nextStep < conversationSteps.length) {
      try {
        const botResponse = await getNextQuestion(conversationSteps[nextStep], newUserData);
        setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
        setCurrentStep(nextStep);

        // Se chegou no final, mostrar Calendly
        if (nextStep === conversationSteps.length - 1) {
          setTimeout(() => {
            setShowCalendly(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Erro ao obter resposta:', error);
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' 
        }]);
      }
    }

    setIsTyping(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-5">
      {/* Banner */}
      <div className="w-full max-w-[800px] mb-5">
        <Image
          src="/chatvolt_cover.jpg"
          alt="Chatvolt"
          width={800}
          height={200}
          className="rounded-lg w-full"
          priority
        />
      </div>

      {/* Messages Container */}
      <div className="w-full max-w-[800px] flex flex-col gap-5 mb-24">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
          >
            {message.role === 'bot' ? (
              <div className="flex items-start gap-4 max-w-full">
                <Image
                  src="/logo.png"
                  alt="Chatvolt"
                  width={50}
                  height={50}
                  className="rounded-full flex-shrink-0"
                />
                <div className="bg-[#1e293b] text-white rounded-lg p-5 shadow-lg max-w-full whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : (
              <div className="bg-white text-[#1e293b] rounded-[20px] py-4 px-6 shadow-lg max-w-[80%] break-words">
                {message.content}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-4">
            <Image
              src="/logo.png"
              alt="Chatvolt"
              width={50}
              height={50}
              className="rounded-full"
            />
            <div className="bg-[#1e293b] text-white rounded-lg p-5 shadow-lg">
              <div className="flex gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}

        {/* Calendly */}
        {showCalendly && (
          <div className="w-full max-w-[800px] mt-8 mx-auto">
            <div 
              className="calendly-inline-widget rounded-lg overflow-hidden shadow-2xl" 
              data-url={`https://calendly.com/d/ctgw-sm7-283/chatvolt-reuniao-comercial?hide_gdpr_banner=1&primary_color=A556F7&text_color=1e293b&first_name=${encodeURIComponent(userData.nome)}&last_name=${encodeURIComponent(userData.sobrenome)}&email=${encodeURIComponent(userData.email)}&a1=${encodeURIComponent(userData.telefone)}&a2=${encodeURIComponent(`Empresa: ${userData.empresa} | Segmento: ${userData.segmento} | Faturamento: ${userData.faturamento} | Colaboradores: ${userData.colaboradores}`)}`}
              style={{ minWidth: '320px', height: '700px', width: '100%' }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      {!isTyping && !showCalendly && !leadBlocked && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center p-8 bg-transparent">
          <div className="w-full max-w-[800px] relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentStep === 0 ? "Digite seu nome completo..." :
                currentStep === 1 ? "Digite seu telefone com DDD..." :
                currentStep === 2 ? "Digite seu e-mail corporativo..." :
                "Digite sua resposta..."
              }
              className="w-full py-4 px-6 pr-16 rounded-full border-2 border-[#A556F7] bg-[rgba(30,41,59,0.8)] text-white text-base outline-none shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all focus:border-[#60a5fa] focus:shadow-[0_0_30px_rgba(59,130,246,0.5)] placeholder-[rgba(255,255,255,0.5)]"
            />
            <button
              onClick={handleSendMessage}
              className="absolute right-[5px] top-1/2 -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-[#3b82f6] text-white flex items-center justify-center cursor-pointer transition-all hover:bg-[#2563eb] hover:scale-105 shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
            >
              <span className="text-2xl font-bold">↑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
