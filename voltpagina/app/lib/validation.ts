// Tipos de validação e qualificação de leads

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  shouldBlock?: boolean;
}

// Validação de email corporativo
export function validateCorporateEmail(email: string): ValidationResult {
  const freeEmailProviders = [
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'yahoo.com.br',
    'bol.com.br',
    'uol.com.br',
    'ig.com.br',
    'live.com',
    'msn.com',
    'protonmail.com',
    'icloud.com',
    'me.com',
    'aol.com'
  ];

  const emailDomain = email.toLowerCase().split('@')[1];

  if (!emailDomain) {
    return {
      isValid: false,
      message: 'Por favor, insira um e-mail válido.'
    };
  }

  if (freeEmailProviders.includes(emailDomain)) {
    return {
      isValid: false,
      message: 'Por favor, use seu e-mail corporativo da empresa. E-mails pessoais (Gmail, Hotmail, etc) não são aceitos.'
    };
  }

  return { isValid: true };
}

// Validação de telefone brasileiro
export function validatePhone(phone: string): ValidationResult {
  // Remove tudo que não é número
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Valida quantidade de dígitos (10 ou 11 dígitos)
  // 10 dígitos: XX XXXX-XXXX (fixo)
  // 11 dígitos: XX 9XXXX-XXXX (celular)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return {
      isValid: false,
      message: 'Por favor, insira um telefone válido com DDD. Exemplo: (11) 99999-9999 ou 11999999999'
    };
  }

  // Valida se tem DDD válido (códigos de área de 11 a 99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return {
      isValid: false,
      message: 'Por favor, insira um DDD válido. Exemplo: (11) 99999-9999'
    };
  }

  // Se tem 11 dígitos, valida se começa com 9 (celular)
  if (cleanPhone.length === 11) {
    const terceiroDígito = cleanPhone.charAt(2);
    if (terceiroDígito !== '9') {
      return {
        isValid: false,
        message: 'Número de celular deve começar com 9 após o DDD. Exemplo: (11) 99999-9999'
      };
    }
  }

  return { isValid: true };
}

// Validação de faturamento - Qualificação ICP
export function validateFaturamento(faturamento: string): ValidationResult {
  const faturamentoBaixo = [
    'até r$500 mil/ano',
    'ate r$500 mil/ano',
    'menos de 500 mil',
    'abaixo de 500 mil',
    'r$ 500 mil',
    '500 mil'
  ];

  const faturamentoNormalizado = faturamento.toLowerCase().trim();

  // Se o faturamento é muito baixo, não qualifica
  const isFaturamentoBaixo = faturamentoBaixo.some(pattern => 
    faturamentoNormalizado.includes(pattern)
  );

  if (isFaturamentoBaixo) {
    return {
      isValid: false,
      shouldBlock: true,
      message: 'Entendo! No momento, nossos serviços são mais adequados para empresas com faturamento acima de R$ 500 mil/ano. Quando sua empresa atingir esse patamar, ficaremos felizes em conversar sobre como podemos ajudar com soluções de IA! 🚀'
    };
  }

  return { isValid: true };
}

// Validação de número de colaboradores - Qualificação ICP
export function validateColaboradores(colaboradores: string): ValidationResult {
  const numerosBaixos = ['1', '2', '3', '4', '5', 'até 5', 'menos de 5'];
  
  const colaboradoresNormalizado = colaboradores.toLowerCase().trim();

  const isEquipePequena = numerosBaixos.some(pattern =>
    colaboradoresNormalizado === pattern || colaboradoresNormalizado.includes(pattern)
  );

  if (isEquipePequena) {
    return {
      isValid: false,
      shouldBlock: true,
      message: 'Entendo! No momento, nossas soluções são focadas em empresas com estrutura um pouco maior (a partir de 6 colaboradores). Quando sua equipe crescer, teremos prazer em apresentar como a IA pode impulsionar seus resultados! 💪'
    };
  }

  return { isValid: true };
}

// Validação de nome completo
export function validateNomeCompleto(nome: string): ValidationResult {
  const palavras = nome.trim().split(' ').filter(p => p.length > 0);

  if (palavras.length < 2) {
    return {
      isValid: false,
      message: 'Por favor, digite seu nome completo (nome e sobrenome).'
    };
  }

  return { isValid: true };
}

// Validação de empresa
export function validateEmpresa(empresa: string): ValidationResult {
  if (empresa.trim().length < 2) {
    return {
      isValid: false,
      message: 'Por favor, digite o nome da sua empresa.'
    };
  }

  return { isValid: true };
}

// Validação de segmento
export function validateSegmento(segmento: string): ValidationResult {
  if (segmento.trim().length < 3) {
    return {
      isValid: false,
      message: 'Por favor, nos conte qual o segmento/área de atuação da sua empresa.'
    };
  }

  return { isValid: true };
}
