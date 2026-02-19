import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

// interface BetConfig removed

const LiveBetting: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [activeBet, setActiveBet] = useState<any>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [groupData, setGroupData] = useState<any>(null);
    const [groupScores, setGroupScores] = useState<any[]>([]);

    useEffect(() => {
        if (session) {
            checkActiveGroup();
        }
    }, [session]);

    const checkActiveGroup = async () => {
        try {
            if (!session?.user?.id) return;
            // Check if user is in an active game group
            const { data: memberData } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (memberData?.group_id) {
                const { data: group } = await supabase
                    .from('game_groups')
                    .select('*, courses(*)')
                    .eq('id', memberData.group_id as string)
                    .eq('status', 'in_progress')
                    .maybeSingle();

                if (group) {
                    setGroupData(group);
                    fetchBetData(group.id);
                    fetchScores(group.id);
                }
            }
        } catch (err) {
            console.error('Error checking active group:', err);
        }
    };

    const fetchBetData = async (groupId: string) => {
        const { data } = await supabase
            .from('round_bets')
            .select('*')
            .eq('round_group_id', groupId)
            .maybeSingle();
        setActiveBet(data);
    };

    const fetchScores = async (groupId: string) => {
        const { data: rounds } = await supabase
            .from('rounds')
            .select('id, user_id, profiles(full_name, id_photo_url), round_holes(hole_number, score, par)')
            .eq('group_id', groupId);

        if (rounds) {
            setGroupScores(rounds);
        }
    };

    const startBet = async (type: string, amount: number) => {
        if (!groupData || !session) return;

        const { data, error } = await supabase
            .from('round_bets')
            .insert([{
                round_group_id: groupData.id,
                creator_id: session.user.id,
                bet_type: type,
                amount_per_point: amount,
                status: 'active'
            }])
            .select()
            .single();

        if (error) {
            alert('Error al crear la apuesta');
        } else {
            setActiveBet(data);
            setShowConfigModal(false);
        }
    };

    // Nassau Logic: Front 9, Back 9, Total
    const calculateNassau = () => {
        if (!groupScores || groupScores.length < 2) return null;

        const player1 = groupScores[0];
        const player2 = groupScores[1];

        const getNetScore = (holes: any[]) => {
            return holes.reduce((acc, h) => acc + (h.score - h.par), 0);
        };

        const f9_1 = getNetScore(player1.round_holes.filter((h: any) => h.hole_number <= 9));
        const f9_2 = getNetScore(player2.round_holes.filter((h: any) => h.hole_number <= 9));

        const b9_1 = getNetScore(player1.round_holes.filter((h: any) => h.hole_number > 9));
        const b9_2 = getNetScore(player2.round_holes.filter((h: any) => h.hole_number > 9));

        const t_1 = f9_1 + b9_1;
        const t_2 = f9_2 + b9_2;

        return {
            front: f9_1 < f9_2 ? player1.profiles.full_name : (f9_2 < f9_1 ? player2.profiles.full_name : 'Empate'),
            back: b9_1 < b9_2 ? player1.profiles.full_name : (b9_2 < b9_1 ? player2.profiles.full_name : 'Empate'),
            total: t_1 < t_2 ? player1.profiles.full_name : (t_2 < t_1 ? player2.profiles.full_name : 'Empate')
        };
    };

    return (
        <div className="animate-fade" style={{ position: 'fixed', inset: 0, background: 'var(--primary)', zIndex: 900 }}>
            <PageHero />
            <div style={{ padding: '0 20px', paddingTop: 'var(--header-offset-top)' }}>
                <PageHeader
                    noMargin
                    title="Apuestas en Vivo"
                    subtitle="Gestión de apuestas en tiempo real"
                    onBack={() => navigate('/play-mode')}
                />
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100% - 150px)' }}>
                {!groupData ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Info size={40} color="var(--text-dim)" style={{ marginBottom: '15px' }} />
                        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '800' }}>No hay partida activa</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Debes iniciar una partida en grupo para activar las apuestas en vivo.</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/play-mode')}
                            style={{ marginTop: '20px', padding: '12px 25px', borderRadius: '12px', background: 'var(--secondary)', color: 'var(--primary)', border: 'none', fontWeight: '900' }}
                        >
                            IR A MODOS DE JUEGO
                        </motion.button>
                    </div>
                ) : !activeBet ? (
                    <div style={{ background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2) 0%, rgba(20, 45, 30, 0.4) 100%)', borderRadius: '24px', padding: '25px', border: '1px solid rgba(163, 230, 53, 0.3)', textAlign: 'center' }}>
                        <Target size={40} color="var(--secondary)" style={{ marginBottom: '15px' }} />
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', margin: '0 0 8px' }}>Configurar Apuesta</h2>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', marginBottom: '20px' }}>
                            Añade emoción a tu partida de {groupData.courses?.name}. Configura un Nassau o Skins con tus amigos.
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowConfigModal(true)}
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--secondary)', color: 'var(--primary)', border: 'none', fontWeight: '900', fontSize: '14px' }}
                        >
                            NUEVA APUESTA REAL
                        </motion.button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', border: '1px solid var(--secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div>
                                    <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: '900', textTransform: 'uppercase' }}>Apuesta Activa</span>
                                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>{activeBet.bet_type.toUpperCase()}</h3>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>VALOR PUNTO</span>
                                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--secondary)', margin: 0 }}>${activeBet.amount_per_point}</h3>
                                </div>
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <BetStatusRow label="Front 9" value={calculateNassau()?.front || '--'} />
                                <BetStatusRow label="Back 9" value={calculateNassau()?.back || '--'} />
                                <BetStatusRow label="Total" value={calculateNassau()?.total || '--'} />
                            </div>
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginTop: '10px' }}>Participantes</h3>
                        {groupScores.map((round) => (
                            <div key={round.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', background: 'var(--secondary)' }}>
                                    {round.profiles.id_photo_url ? <img src={round.profiles.id_photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: '900' }}>{round.profiles.full_name[0]}</div>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'white', margin: 0 }}>{round.profiles.full_name}</h4>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{round.round_holes.length} hoyos jugados</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--secondary)' }}>
                                        {round.round_holes.reduce((acc: number, h: any) => acc + (h.score - h.par), 0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showConfigModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '100%', maxWidth: '380px', background: 'rgba(20, 45, 30, 0.98)', borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                            <button onClick={() => setShowConfigModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white' }}><X /></button>
                            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '20px', textAlign: 'center' }}>Nueva Apuesta</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '700' }}>TIPO DE APUESTA</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {['nassau', 'skins'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => startBet(t, 10000)}
                                                style={{ padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '800', textTransform: 'uppercase', fontSize: '12px' }}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '700' }}>VALOR POR PUNTO (COP)</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 10000"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '15px', color: 'white', fontWeight: '800', fontSize: '16px' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BetStatusRow = ({ label, value }: { label: string, value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600' }}>{label}</span>
        <span style={{ color: 'white', fontSize: '13px', fontWeight: '800' }}>{value}</span>
    </div>
);

export default LiveBetting;
