import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface RoundData {
    course_name: string;
    date_played: string;
    total_score: number;
    first_nine_score?: number;
    second_nine_score?: number;
    total_putts?: number;
    fairways_hit?: number;
    greens_in_regulation?: number;
    handicap?: number;
    holes?: Array<{
        hole_number: number;
        par: number;
        score: number;
        putts?: number;
        fairway_hit?: boolean;
        gir?: boolean;
    }>;
}

export interface AIAnalysis {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    scoreAnalysis: string;
}

export const analyzeRound = async (roundData: RoundData): Promise<AIAnalysis> => {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your-gemini-api-key') {
            throw new Error('API Key de Gemini no configurada en .env');
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });

        const prompt = `
Analiza esta ronda de golf y proporciona un análisis detallado en español:

**Información de la Ronda:**
- Campo: ${roundData.course_name}
- Fecha: ${new Date(roundData.date_played).toLocaleDateString('es-ES')}
- Score Total: ${roundData.total_score}
${roundData.first_nine_score ? `- Primera Vuelta (Front 9): ${roundData.first_nine_score}` : ''}
${roundData.second_nine_score ? `- Segunda Vuelta (Back 9): ${roundData.second_nine_score}` : ''}
${roundData.total_putts ? `- Total Putts: ${roundData.total_putts}` : ''}
${roundData.fairways_hit ? `- Fairways Acertados: ${roundData.fairways_hit}/14` : ''}
${roundData.greens_in_regulation ? `- Greens en Regulación: ${roundData.greens_in_regulation}/18` : ''}
${roundData.handicap !== undefined ? `- Hándicap del Jugador: ${roundData.handicap}` : ''}

${roundData.holes && roundData.holes.length > 0 ? `
**Detalles por Hoyo:**
${roundData.holes.map(h => `Hoyo ${h.hole_number}: Par ${h.par}, Score ${h.score}${h.putts ? `, ${h.putts} putts` : ''}${h.fairway_hit !== undefined ? `, Fairway: ${h.fairway_hit ? 'Sí' : 'No'}` : ''}${h.gir !== undefined ? `, GIR: ${h.gir ? 'Sí' : 'No'}` : ''}`).join('\n')}
` : ''}

Por favor proporciona un análisis en formato JSON con la siguiente estructura:
{
  "summary": "Resumen general del desempeño en 2-3 oraciones",
  "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "weaknesses": ["Debilidad 1", "Debilidad 2"],
  "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
  "scoreAnalysis": "Análisis detallado del score comparado con el par y el handicap"
}

Sé específico, constructivo y enfócate en aspectos prácticos que el jugador pueda mejorar.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini raw response:', text);

        // Try to parse JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return analysis;
        }

        // Fallback if JSON parsing fails
        return {
            summary: text.substring(0, 200),
            strengths: ['Análisis generado'],
            weaknesses: ['Requiere más datos'],
            recommendations: ['Continúa jugando y registrando tus rondas'],
            scoreAnalysis: text
        };
    } catch (error: any) {
        console.error('Error detail updating Gemini:', error);

        // Fallback to local heuristic analysis if API fails
        return generateLocalAnalysis(roundData);
    }
};

const generateLocalAnalysis = (data: RoundData): AIAnalysis => {
    const totalScore = data.total_score;
    const holes = data.holes || [];

    // Heuristics
    const parTotal = holes.reduce((sum, h) => sum + h.par, 0) || 72; // Default to 72 if no holes
    const diff = totalScore - parTotal;

    const birdies = holes.filter(h => h.score < h.par).length;
    const pars = holes.filter(h => h.score === h.par).length;
    const bogeys = holes.filter(h => h.score > h.par).length;

    let summary = `Completaste tu ronda en ${data.course_name} con un total de ${totalScore} golpes. `;
    if (diff <= 0) {
        summary += '¡Un desempeño excepcional! Estuviste muy sólido bajo presión.';
    } else if (diff < 10) {
        summary += 'Muy buen juego, te mantuviste cerca del par durante la mayor parte del recorrido.';
    } else {
        summary += 'Una jornada de aprendizaje. Lo importante es mantener el ritmo y disfrutar del campo.';
    }

    const strengths = [];
    if (birdies > 0) strengths.push(`Gran capacidad de ataque: lograste ${birdies} hoyos bajo par.`);
    if (pars > 5) strengths.push('Consistencia sólida en los hoyos de par.');
    if (totalScore < 80) strengths.push('Excelente manejo de los nervios en el green.');
    if (strengths.length === 0) strengths.push('Persistencia y dedicación en el campo.');

    const weaknesses = [];
    if (bogeys > 5) weaknesses.push('Algunos problemas de precisión en los tiros de aproximación.');
    if (diff > 15) weaknesses.push('Dificultad para recuperar tras un golpe fallido.');
    if (data.total_putts && data.total_putts > 36) weaknesses.push('Demasiados golpes en el green.');
    if (weaknesses.length === 0) weaknesses.push('Margen de mejora en la consistencia de los drives.');

    return {
        summary,
        strengths,
        weaknesses,
        recommendations: [
            'Practica tu juego corto para reducir esos bogeys innecesarios.',
            'Mantén la calma tras un hoyo difícil, el golf es un juego mental.',
            'Considera una sesión de práctica enfocada en el driver.'
        ],
        scoreAnalysis: `Terminaste ${diff > 0 ? '+' : ''}${diff} sobre el par del campo (${parTotal}). Lograste ${birdies} birdies y ${pars} pares.`
    };
};

export const analyzeMultipleRounds = async (rounds: RoundData[]): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Analiza el progreso de este jugador de golf basándote en sus últimas ${rounds.length} rondas:

${rounds.map((r, i) => `
**Ronda ${i + 1}:**
- Campo: ${r.course_name}
- Fecha: ${new Date(r.date_played).toLocaleDateString('es-ES')}
- Score: ${r.total_score}
${r.total_putts ? `- Putts: ${r.total_putts}` : ''}
${r.fairways_hit ? `- Fairways: ${r.fairways_hit}/14` : ''}
`).join('\n')}

Proporciona un análisis de tendencias, progreso y recomendaciones generales en 3-4 párrafos concisos.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating multi-round analysis:', error);
        return 'No se pudo generar el análisis de múltiples rondas.';
    }
};
