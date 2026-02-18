import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Play, BarChart3, Clock, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

interface SwingAnalysis {
    id: string;
    video_url: string;
    feedback: any;
    swing_score: number | null;
    analyzed_at: string;
}

const SwingAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [analyses, setAnalyses] = useState<SwingAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        if (session) {
            fetchAnalyses();
        }
    }, [session]);

    const fetchAnalyses = async () => {
        try {
            if (!session) return;
            const { data, error } = await supabase
                .from('swing_analyses')
                .select('*')
                .eq('user_id', session.user.id)
                .order('analyzed_at', { ascending: false });

            if (error) throw error;
            setAnalyses((data as any) || []);
        } catch (err) {
            console.error('Error fetching analyses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;
            const filePath = `swings/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            // Simular análisis (En el futuro esto llamaría a una Edge Function de IA)
            const mockFeedback = {
                posture: "Excelente alineación de hombros",
                speed: "92 mph",
                angle: "8.5 grados",
                tips: "Mantén el peso un poco más en los talones durante el backswing."
            };

            const { error: dbError } = await supabase
                .from('swing_analyses')
                .insert([{
                    user_id: session.user.id,
                    video_url: publicUrl,
                    feedback: mockFeedback,
                    swing_score: Math.floor(Math.random() * 20) + 75, // Score entre 75 y 95
                    analyzed_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            setShowUploadModal(false);
            fetchAnalyses();
        } catch (err) {
            console.error('Error uploading swing:', err);
            alert('Error al subir el video. Por favor intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            overflow: 'hidden'
        }}>
            <NavigationOffset />
            <PageHero />

            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                zIndex: 900,
                background: 'transparent',
                paddingBottom: '5px'
            }}>
                <div style={{ padding: '0 20px' }}>
                    <PageHeader
                        noMargin
                        onBack={() => navigate('/community')}
                        title="Swing IA"
                        subtitle="Análisis profesional con Inteligencia Artificial"
                    />
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 80px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 10px)',
                overflowY: 'auto',
                padding: '20px 20px 100px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                zIndex: 10
            }}>
                {/* Banner de Bienvenida */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2) 0%, rgba(20, 45, 30, 0.4) 100%)',
                    borderRadius: '24px',
                    padding: '25px',
                    border: '1px solid rgba(163, 230, 53, 0.3)',
                    textAlign: 'center'
                }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                        <BarChart3 size={32} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', margin: '0 0 8px' }}>Mejora tu Swing</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', marginBottom: '20px' }}>
                        Sube un video de tu swing y nuestra IA analizará tu postura, velocidad y trayectoria para darte consejos personalizados.
                    </p>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowUploadModal(true)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '16px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            border: 'none',
                            fontWeight: '900',
                            fontSize: '14px',
                            boxShadow: '0 10px 20px rgba(163, 230, 53, 0.2)'
                        }}
                    >
                        SUBIR NUEVO VIDEO
                    </motion.button>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: '10px 0 0' }}>Mis Análisis Recientes</h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Procesando datos...</div>
                ) : analyses.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '24px',
                        border: '1px dashed rgba(255,255,255,0.1)'
                    }}>
                        <Video size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: '15px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Aún no tienes análisis. ¡Sube tu primer swing hoy!</p>
                    </div>
                ) : (
                    analyses.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{ position: 'relative', height: '180px', background: '#000' }}>
                                <video
                                    src={item.video_url}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                                    onClick={(e) => (e.target as HTMLVideoElement).paused ? (e.target as HTMLVideoElement).play() : (e.target as HTMLVideoElement).pause()}
                                />
                                <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--secondary)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '12px', fontWeight: '900', fontSize: '16px' }}>
                                    {item.swing_score || '--'}
                                </div>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                    <Play size={40} color="white" style={{ opacity: 0.8 }} />
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)' }}>
                                        <Clock size={14} />
                                        <span style={{ fontSize: '12px' }}>{new Date(item.analyzed_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <BarChart3 size={14} color="var(--secondary)" />
                                        <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: '700' }}>Velocidad: {item.feedback?.speed}</span>
                                    </div>
                                </div>
                                <div style={{ padding: '15px', background: 'rgba(163, 230, 53, 0.05)', borderRadius: '16px', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'white', fontStyle: 'italic', lineHeight: '1.4' }}>
                                        "{item.feedback?.tips}"
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal de Carga */}
            <AnimatePresence>
                {showUploadModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                width: '100%',
                                maxWidth: '350px',
                                background: 'rgba(20, 45, 30, 0.95)',
                                borderRadius: '30px',
                                padding: '30px',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white' }}><X /></button>

                            <div style={{ marginBottom: '25px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                    <Upload size={40} color="var(--secondary)" />
                                </div>
                                <h3 style={{ color: 'white', margin: '0 0 10px' }}>Subir Swing</h3>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
                                    Asegúrate de que el video sea de cuerpo completo y desde una perspectiva lateral o frontal clara.
                                </p>
                            </div>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                background: 'white',
                                color: 'var(--primary)',
                                padding: '16px',
                                borderRadius: '16px',
                                fontWeight: '900',
                                cursor: 'pointer'
                            }}>
                                <Download size={20} />
                                {uploading ? 'PROCESANDO...' : 'SELECCIONAR VIDEO'}
                                <input type="file" accept="video/*" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
                            </label>

                            {uploading && (
                                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <div className="loader-small" />
                                    <span style={{ fontSize: '12px', color: 'var(--secondary)' }}>Nuestra IA está analizando tu swing...</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NavigationOffset = () => (<style>{`
    .loader-small {
        width: 15px;
        height: 15px;
        border: 2px solid rgba(163, 230, 53, 0.2);
        border-top: 2px solid var(--secondary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`}</style>);

export default SwingAnalysis;
