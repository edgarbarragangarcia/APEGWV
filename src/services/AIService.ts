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
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    } catch (error) {
        console.error('Error generating AI analysis:', error);
        return {
            summary: 'No se pudo generar el análisis automático.',
            strengths: ['Completaste la ronda'],
            weaknesses: ['Datos insuficientes para análisis detallado'],
            recommendations: ['Registra más detalles en tu próxima ronda'],
            scoreAnalysis: 'Análisis no disponible en este momento.'
        };
    }
};

export const analyzeMultipleRounds = async (rounds: RoundData[]): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
