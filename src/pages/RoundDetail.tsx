import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { analyzeRound, type RoundData, type AIAnalysis } from '../services/AIService';
import { ArrowLeft, Calendar, MapPin, Loader2, Sparkles, TrendingUp, TrendingDown, Target } from 'lucide-react';
import Card from '../components/Card';

interface Round extends Omit<RoundData, 'course_location' | 'status'> {
    id: string;
    course_location: string | null;
    status: string | null;
    ai_analysis: string | null;
    handicap?: number;
}



const RoundDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [round, setRound] = useState<Round | null>(null);
    const [holes, setHoles] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

    useEffect(() => {
        const fetchRoundDetails = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/auth');
                    return;
                }

                if (!id) return;

                // Fetch round
                const { data: roundData, error: roundError } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('id', id)
                    .eq('user_id', session.user.id)
                    .single();

                if (roundError) throw roundError;
                setRound(roundData as unknown as Round);

                // Fetch holes
                const { data: holesData, error: holesError } = await supabase
                    .from('round_holes')
                    .select('*')
                    .eq('round_id', id)
                    .order('hole_number');

                if (holesError && holesError.code !== 'PGRST116') throw holesError;
                setHoles(holesData || []);

                // Check if AI analysis exists
                if (roundData.ai_analysis) {
                    try {
                        setAnalysis(JSON.parse(roundData.ai_analysis));
                    } catch (e) {
                        console.error('Error parsing cached analysis:', e);
                    }
                }
            } catch (err) {
                console.error('Error fetching round details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoundDetails();
    }, [id, navigate]);

    const handleGenerateAnalysis = async () => {
        if (!round) return;

        setAnalyzing(true);
        try {
            const roundData: RoundData = {
                course_name: round.course_name,
                date_played: round.date_played,
                total_score: round.total_score,
                first_nine_score: round.first_nine_score,
                second_nine_score: round.second_nine_score,
                total_putts: round.total_putts,
                fairways_hit: round.fairways_hit,
                greens_in_regulation: round.greens_in_regulation,
                handicap: round.handicap ?? undefined,
                holes: holes
            };

            const aiAnalysis = await analyzeRound(roundData);
            setAnalysis(aiAnalysis);

            // Save analysis to database
            if (id) {
                await supabase
                    .from('rounds')
                    .update({ ai_analysis: JSON.stringify(aiAnalysis) })
                    .eq('id', id);
            }
        } catch (error) {
            console.error('Error generating analysis:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    if (!round) {
        return <div className="flex-center" style={{ height: '70vh' }}>Ronda no encontrada</div>;
    }

    const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
    const scoreToPar = round.total_score - totalPar;

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/rounds')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '20px', margin: 0 }}>{round.course_name}</h1>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: 'var(--text-dim)', marginTop: '5px' }}>
                        {round.course_location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <MapPin size={14} />
                                {round.course_location}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} />
                            {new Date(round.date_played).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Score Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <Card style={{ marginBottom: 0, padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px' }}>Score Total</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--secondary)' }}>{round.total_score}</div>
                    {totalPar > 0 && (
                        <div style={{ fontSize: '11px', color: scoreToPar > 0 ? '#ef4444' : '#10b981' }}>
                            {scoreToPar > 0 ? '+' : ''}{scoreToPar} vs Par
                        </div>
                    )}
                </Card>
                {round.first_nine_score && (
                    <Card style={{ marginBottom: 0, padding: '15px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px' }}>Front 9</div>
                        <div style={{ fontSize: '24px', fontWeight: '800' }}>{round.first_nine_score}</div>
                    </Card>
                )}
                {round.second_nine_score && (
                    <Card style={{ marginBottom: 0, padding: '15px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px' }}>Back 9</div>
                        <div style={{ fontSize: '24px', fontWeight: '800' }}>{round.second_nine_score}</div>
                    </Card>
                )}
            </div>

            {/* Additional Stats */}
            {(round.total_putts || round.fairways_hit || round.greens_in_regulation) && (
                <Card style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Estadísticas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center' }}>
                        {round.total_putts && (
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: '700' }}>{round.total_putts}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Putts</div>
                            </div>
                        )}
                        {round.fairways_hit !== undefined && (
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: '700' }}>{round.fairways_hit}/14</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Fairways</div>
                            </div>
                        )}
                        {round.greens_in_regulation !== undefined && (
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: '700' }}>{round.greens_in_regulation}/18</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>GIR</div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Scorecard */}
            {holes.length > 0 && (
                <Card style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Scorecard</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Hoyo</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Par</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Score</th>
                                    {holes.some(h => h.putts !== undefined) && <th style={{ padding: '8px', textAlign: 'center' }}>Putts</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {holes.map((hole) => {
                                    const diff = hole.score - hole.par;
                                    return (
                                        <tr key={hole.hole_number} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px', fontWeight: '600' }}>{hole.hole_number}</td>
                                            <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-dim)' }}>{hole.par}</td>
                                            <td style={{
                                                padding: '8px',
                                                textAlign: 'center',
                                                fontWeight: '700',
                                                color: diff === 0 ? 'var(--secondary)' : diff < 0 ? '#10b981' : '#ef4444'
                                            }}>
                                                {hole.score}
                                            </td>
                                            {holes.some(h => h.putts !== undefined) && (
                                                <td style={{ padding: '8px', textAlign: 'center' }}>{hole.putts || '-'}</td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* AI Analysis */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} color="var(--secondary)" />
                        Análisis IA
                    </h3>
                    {!analysis && (
                        <button
                            onClick={handleGenerateAnalysis}
                            disabled={analyzing}
                            className="primary-button"
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                            {analyzing ? <Loader2 className="animate-spin" size={16} /> : 'Generar'}
                        </button>
                    )}
                </div>

                {analysis ? (
                    <div>
                        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>{analysis.summary}</p>

                        <div style={{ display: 'grid', gap: '15px' }}>
                            <div>
                                <h4 style={{ fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={16} color="#10b981" />
                                    Fortalezas
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                    {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingDown size={16} color="#ef4444" />
                                    Áreas de Mejora
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                    {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Target size={16} color="var(--secondary)" />
                                    Recomendaciones
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                    {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateAnalysis}
                            disabled={analyzing}
                            style={{
                                marginTop: '20px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'var(--text-dim)',
                                cursor: 'pointer'
                            }}
                        >
                            {analyzing ? 'Regenerando...' : 'Regenerar Análisis'}
                        </button>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                        Genera un análisis personalizado con IA para obtener insights sobre tu desempeño
                    </p>
                )}
            </Card>
        </div>
    );
};

export default RoundDetail;
