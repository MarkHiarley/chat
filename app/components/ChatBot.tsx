'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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

  // Função para normalizar email
  const normalizarEmail = (email: string): string => {
    return email.toLowerCase().trim();
  };

  // Função para normalizar nome de empresa
  const normalizarEmpresa = (empresa: string): string => {
    return empresa
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Função para normalizar segmento
  const normalizarSegmento = (segmento: string): string => {
    return segmento.charAt(0).toUpperCase() + segmento.slice(1).toLowerCase();
  };

  // Função para normalizar faturamento
  const normalizarFaturamento = (faturamento: string): string => {
    const input = faturamento.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Extrai números
    const numero = parseFloat(input.replace(/[^\d,.]/g, '').replace(',', '.'));
    
    if (isNaN(numero)) return faturamento;
    
    // Detecta escala (k, mil, milhão, m, etc)
    let valor = numero;
    
    if (input.includes('milhão') || input.includes('milhões') || input.includes('m') && !input.includes('mil')) {
      valor = numero * 1000000;
    } else if (input.includes('mil') || input.includes('k')) {
      valor = numero * 1000;
    }
    
    // Formata para R$
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Função para normalizar colaboradores
  const normalizarColaboradores = (colaboradores: string): string => {
    const cleanInput = colaboradores.replace(/\D/g, '');
    const numero = parseInt(cleanInput);
    
    if (isNaN(numero) || numero < 1) return colaboradores;
    
    return numero.toString();
  };

  // Nova função: Interpreta e valida a resposta do usuário SEM IA
  const interpretUserResponse = async (step: string, userInput: string, data: UserData): Promise<{ 
    isValid: boolean; 
    normalizedValue: string; 
    feedback?: string;
    shouldBlock?: boolean;
  }> => {
    
    switch(step) {
      case 'telefone': {
        const cleanPhone = userInput.replace(/\D/g, '');
        
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          return {
            isValid: false,
            normalizedValue: userInput,
            feedback: 'Por favor, insira um telefone válido com DDD. Exemplo: (11) 99999-9999 ou 11999999999'
          };
        }
        
        return { 
          isValid: true, 
          normalizedValue: normalizarTelefone(userInput)
        };
      }

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(userInput)) {
          return {
            isValid: false,
            normalizedValue: userInput,
            feedback: 'Por favor, insira um e-mail válido. Exemplo: seu@email.com'
          };
        }
        
        // Lista de emails pessoais
        const emailsPessoais = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'live.com', 'icloud.com', 'me.com'];
        const domain = userInput.split('@')[1]?.toLowerCase();
        
        if (emailsPessoais.includes(domain)) {
          return {
            isValid: false,
            normalizedValue: userInput,
            feedback: 'Por favor, use seu e-mail corporativo da empresa. E-mails pessoais (Gmail, Hotmail, etc) não são aceitos.'
          };
        }
        
        return { 
          isValid: true, 
          normalizedValue: normalizarEmail(userInput)
        };
      }

      case 'empresa': {
        if (userInput.trim().length < 2) {
          return {
            isValid: false,
            normalizedValue: userInput,
            feedback: 'Por favor, informe o nome da sua empresa (mínimo 2 caracteres).'
          };
        }
        
        return { 
          isValid: true, 
          normalizedValue: normalizarEmpresa(userInput)
        };
      }

      case 'segmento': {
        if (userInput.trim().length < 3) {
          return {
            isValid: false,
            normalizedValue: userInput,
            feedback: 'Por favor, informe o segmento da empresa (mínimo 3 caracteres). Exemplo: Tecnologia, Varejo, Saúde'
          };
        }
        
        return { 
          isValid: true, 
          normalizedValue: normalizarSegmento(userInput)
        };
      }

      case 'faturamento': {
        const contemNumero = /\d/.test(userInput);
        
        if (!contemNumero) {
          return {
            isValid: false,
            normalizedValue: userInput,
            feedback: 'Por favor, informe o faturamento anual. Exemplo: R$ 500.000, 500k, 1 milhão'
          };
        }
        
        return { 
          isValid: true, 
          normalizedValue: normalizarFaturamento(userInput)
        };
      }

      case 'colaboradores': {
        const cleanInput = userInput.replace(/\D/g, '');
        const numero = parseInt(cleanInput);
        
        if (isNaN(numero) || numero < 1 || cleanInput.length === 0) {
          return {
            isValid: false,
            normalizedValue: userInput,
            feedback: 'Por favor, informe um número válido de colaboradores. Exemplo: 50, 100, etc.'
          };
        }
        
        // Validação ICP: bloqueia se tiver menos de 6 colaboradores
        if (numero < 6) {
          return {
            isValid: false,
            normalizedValue: numero.toString(),
            shouldBlock: true,
            feedback: 'Entendo! No momento, nossas soluções são focadas em empresas com estrutura um pouco maior (a partir de 6 colaboradores). Quando sua equipe crescer, teremos prazer em apresentar como a IA pode impulsionar seus resultados! 💪'
          };
        }
        
        return { 
          isValid: true, 
          normalizedValue: numero.toString()
        };
      }

      default:
        return { isValid: true, normalizedValue: userInput };
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

    // Se detectou problema, mostra feedback
    if (!interpretation.isValid && interpretation.feedback) {
      setMessages(prev => [...prev, { role: 'bot', content: interpretation.feedback || 'Por favor, tente novamente.' }]);
      setIsTyping(false);
      
      // Se deve bloquear o lead (fora do ICP)
      if (interpretation.shouldBlock) {
        setLeadBlocked(true);
      }
      
      return;
    }

    // Usa o valor normalizado
    const normalizedValue = interpretation.normalizedValue;

    // Validação do campo atual com valor normalizado
    // Nota: Colaboradores já foi validado completamente no interpretUserResponse
    const validation = currentKey === 'colaboradores' 
      ? { isValid: true } 
      : validateField(currentKey, normalizedValue);
    
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

    // Aguarda tempo variável baseado no campo (colaboradores é mais rápido)
    const delayTime = currentKey === 'colaboradores' ? 800 : 2000;
    await new Promise(resolve => setTimeout(resolve, delayTime));

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
                <div className="bg-[#1e293b] text-white rounded-[20px] p-5 shadow-lg max-w-full whitespace-pre-wrap">
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
            <div className="bg-[#1e293b] text-white rounded-[20px] p-5 shadow-lg">
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
          <div className="flex items-start gap-4 max-w-full w-full">
            <Image
              src="/logo.png"
              alt="Chatvolt"
              width={50}
              height={50}
              className="rounded-full flex-shrink-0"
            />
            <div 
              className="calendly-inline-widget bg-[#1e293b] rounded-[20px] shadow-lg overflow-hidden flex-1" 
              data-url={`https://calendly.com/d/ctgw-sm7-283/chatvolt-reuniao-comercial?hide_gdpr_banner=1&primary_color=A556F7&text_color=1e293b&first_name=${encodeURIComponent(userData.nome)}&last_name=${encodeURIComponent(userData.sobrenome)}&email=${encodeURIComponent(userData.email)}&a1=${encodeURIComponent(userData.telefone)}&a2=${encodeURIComponent(`Empresa: ${userData.empresa} | Segmento: ${userData.segmento} | Faturamento: ${userData.faturamento} | Colaboradores: ${userData.colaboradores}`)}`}
              style={{ minWidth: '320px', height: '750px', width: '100%' }}
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
