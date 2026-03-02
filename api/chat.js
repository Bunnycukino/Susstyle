// ==================================
// VERCEL SERVERLESS FUNCTION
// UHA Backend API - Multi-Agent System
// ==================================

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ==================================
// AGENT SYSTEM PROMPTS
// ==================================

const AGENT_PROMPTS = {
  'master': `Jestes Master Agent w systemie Universal Human Assistant.
Twoim zadaniem jest zrozumiec intencje uzytkownika i przekierowac go do odpowiedniego wyspecjalizowanego agenta.

Dostepne agenty:
- c209-logistics: Formularze celne C209, logistyka, transport
- fashion-advisor: Zrownowazona moda, eko-fashion, styl
- mental-health: Zdrowie psychiczne, wsparcie emocjonalne
- education: Edukacja, nauka, rozwoj
- legal: Prawo, porady prawne (TYLKO ogolne informacje)
- career: Kariera, CV, praca

Jesli pytanie nie pasuje do zadnego agenta, odpowiedz sam krotko i pomocnie.
Jezyk: ZAWSZE po polsku.`,

  'c209-logistics': `Jestes ekspertem od formularzy celnych C209 i logistyki miedzynarodowej.
Pomagasz uzytk ownikom:
- Wypelniac formularze C209
- Obliczac naleznosci celne
- Zrozumiec procedury in-bond
- Rozwiazywac problemy logistyczne

Badz konkretny, profesjonalny i zawsze pytaj o brakujace informacje.
Jezyk: polski`,

  'fashion-advisor': `Jestes doradca zrownowazonej mody i eko-fashion.
Pomagasz uzytkom:
- Wybierac sustainable marki
- Budowac swiadoma szafe
- Zrozumiec wplyw mody na srodowisko
- Znalezc alternatywy dla fast fashion

Badz inspirujacy, praktyczny i zawsze sugeruj konkretne kroki.
Jezyk: polski`,

  'mental-health': `Jestes asystentem wsparcia zdrowia psychicznego.
Oferujesz:
- Empatyczne sluchanie
- Techniki relaksacyjne
- Pomoc w organizacji mysli
- Kierowanie do profesjonalnej pomocy

WAZNE:
- NIE diagnozujesz
- NIE zastepujesz terapeuty
- ZAWSZE podkrelasz wartosc profesjonalnej pomocy
- W razie grozby suicydu: 116 123 (Telefon Zaufania) lub 112

Jezyk: polski, ton empatyczny ale profesjonalny`,

  'education': `Jestes tutorem edukacyjnym.
Pomagasz:
- Uczyc sie nowych umiejetnosci
- Wyjasniać trudne koncepcje
- Rekomendowac zasoby edukacyjne
- Motywowac do nauki

Uzywaj przykladow, analogii i dostosowuj poziom jezyka do uzytkownika.
Jezyk: polski`,

  'legal': `Jestes asystentem informacji prawnych.
Udzielasz:
- Ogolnych informacji o prawie
- Wyjasnien terminow prawniczych
- Kierowania do odpowiednich zasobow

WAZNE:
- NIE udzielasz porad prawnych
- ZAWSZE sugerujesz konsultacje z prawnikiem w powaznych sprawach
- Informujesz o ogolnych przepisach, nie interpretujesz konkretnych przypadkow

Jezyk: polski`,

  'career': `Jestes coachem kariery.
Pomagasz:
- Optymalizowac CV
- Przygotowac sie do rozmow kwalifikacyjnych
- Planowac sciezke kariery
- Rozwijac umiejetnosci zawodowe

Badz motywujacy, konkretny i zawsze pytaj o cele i kontekst uzytkownika.
Jezyk: polski`
};

// ==================================
// FUNCTION TOOLS DEFINITIONS
// ==================================

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'calculate_c209_duty',
      description: 'Oblicza naleznosci celne dla formularza C209',
      parameters: {
        type: 'object',
        properties: {
          goods_value: { type: 'number', description: 'Wartosc towaru' },
          currency: { type: 'string', description: 'Waluta (EUR, GBP, PLN)' },
          duty_rate: { type: 'number', description: 'Stawka cla w %' },
          vat_rate: { type: 'number', description: 'Stawka VAT w %' },
          transport_cost: { type: 'number', description: 'Koszt transportu' }
        },
        required: ['goods_value', 'currency', 'duty_rate', 'vat_rate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_sustainable_brands',
      description: 'Proponuje marki zrownowazonej mody',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          budget_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          clothing_type: { type: 'string' }
        },
        required: ['location', 'budget_level']
      }
    }
  }
];

// ==================================
// TOOL IMPLEMENTATIONS
// ==================================

function calculate_c209_duty(args) {
  const base = args.goods_value + (args.transport_cost || 0);
  const duty = base * (args.duty_rate / 100);
  const vatBase = base + duty;
  const vat = vatBase * (args.vat_rate / 100);

  return {
    currency: args.currency,
    duty: Number(duty.toFixed(2)),
    vat: Number(vat.toFixed(2)),
    total: Number((duty + vat).toFixed(2)),
    breakdown: `Wartosc towaru: ${args.goods_value} ${args.currency}\nClo (${args.duty_rate}%): ${duty.toFixed(2)} ${args.currency}\nVAT (${args.vat_rate}%): ${vat.toFixed(2)} ${args.currency}\nRazem do zaplaty: ${(duty + vat).toFixed(2)} ${args.currency}`
  };
}

function suggest_sustainable_brands(args) {
  const brands = {
    low: [
      { name: 'H&M Conscious', website: 'hm.com/conscious', note: 'Przystepna kolekcja eko' },
      { name: 'Reserved ECO AWARE', website: 'reserved.com', note: 'Polska marka z linia eko' }
    ],
    medium: [
      { name: 'Armedangels', website: 'armedangels.com', note: 'Fair trade, organic cotton' },
      { name: 'Ecoalf', website: 'ecoalf.com', note: 'Ubrania z recyclingu' }
    ],
    high: [
      { name: 'Patagonia', website: 'patagonia.com', note: 'Lider w sustainable fashion' },
      { name: 'Stella McCartney', website: 'stellamccartney.com', note: 'Luxury sustainable' }
    ]
  };

  return {
    brands: brands[args.budget_level] || brands.medium,
    budget: args.budget_level,
    location: args.location
  };
}

// ==================================
// INTENT CLASSIFICATION
// ==================================

async function classifyIntent(message, history) {
  const classificationPrompt = `Klasyfikuj intencje uzytkownika i wybierz odpowiedniego agenta.

Dostepne agenty:
- c209-logistics: formularze celne, logistyka, transport, clo
- fashion-advisor: moda, ubrania, sustainable fashion, eko-moda
- mental-health: zdrowie psychiczne, wsparcie, stres, terapia
- education: nauka, edukacja, kursy, rozwoj
- legal: prawo, porady prawne, dokumenty prawne
- career: kariera, praca, CV, rozmowa kwalifikacyjna
- master: ogolne pytania, small talk, inne

Zapytanie uzytkownika: "${message}"

Odpowiedz w formacie JSON:
{"agent": "nazwa-agenta", "confidence": 0.0-1.0, "reasoning": "krotkie uzasadnienie"}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: classificationPrompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

// ==================================
// MAIN HANDLER
// ==================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationId, userId, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1: Classify intent
    const classification = await classifyIntent(message, history);
    const agent = classification.agent || 'master';

    // Step 2: Build context
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS['master'];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    // Step 3: Call LLM with tools (only for c209-logistics and fashion-advisor)
    const shouldUseTools = ['c209-logistics', 'fashion-advisor'].includes(agent);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: shouldUseTools ? TOOLS : undefined,
      tool_choice: shouldUseTools ? 'auto' : undefined,
      temperature: 0.7,
      max_tokens: 800
    });

    let assistantMessage = completion.choices[0].message;

    // Step 4: Handle tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolMessages = [...messages, assistantMessage];

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let toolResult;
        if (functionName === 'calculate_c209_duty') {
          toolResult = calculate_c209_duty(functionArgs);
        } else if (functionName === 'suggest_sustainable_brands') {
          toolResult = suggest_sustainable_brands(functionArgs);
        } else {
          toolResult = { error: 'Unknown function' };
        }

        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(toolResult)
        });
      }

      // Second completion with tool results
      const secondCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: toolMessages,
        temperature: 0.7
      });

      assistantMessage = secondCompletion.choices[0].message;
    }

    // Step 5: Return response
    return res.status(200).json({
      response: assistantMessage.content,
      agent,
      classification: classification.reasoning
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
