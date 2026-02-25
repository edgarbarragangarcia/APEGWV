import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Play, X, ChevronRight, Zap, TrendingUp, AlertTriangle, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

interface SwingAnalysisData {
    id: string;
    video_url: string;
    feedback: {
        swing_score: number;
        metrics?: any;
        setup_analysis?: string;
        backswing_analysis?: string;
        grip_analysis?: string;
        downswing_analysis?: string;
        posture?: string;
        strengths?: string[];
        areas_to_improve?: string[];
        tips?: string;
        overall_assessment?: string;
        is_simulated?: boolean;
        visual_data?: {
            points: Record<string, { x: number; y: number }>;
        };
    };
    swing_score: number | null;
    analyzed_at: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Simulated data fallback in case of quota or API errors
const getSimulatedAnalysis = () => {
    const scores = [65, 72, 78, 81, 84, 88, 92];
    const score = scores[Math.floor(Math.random() * scores.length)];
    const tips = [
        "Enfócate en mantener el brazo izquierdo recto durante el backswing para mayor consistencia.",
        "Tu rotación de cadera es excelente, intenta suavizar la transición para ganar precisión.",
        "Asegúrate de que el peso se desplace hacia tu pierna delantera al finalizar el downswing.",
        "Mantén la cabeza fija y evita el movimiento lateral excesivo durante el impacto.",
        "Buen tempo, intenta acortar un poco el backswing para tener más control del palo."
    ];

    return {
        is_simulated: true,
        swing_score: score,
        metrics: {
            club_head_speed: `${Math.floor(88 + Math.random() * 15)} mph`,
            tempo_ratio: `${(2.8 + Math.random() * 0.5).toFixed(1)}:1`,
            backswing_angle: `${Math.floor(85 + Math.random() * 10)}°`,
            attack_angle: `${(Math.random() * 4 - 2).toFixed(1)}°`,
            spine_angle: `${Math.floor(40 + Math.random() * 5)}°`,
            hip_rotation: `${Math.floor(42 + Math.random() * 8)}°`
        },
        setup_analysis: "Excelente postura inicial. Pies alineados correctamente con los hombros y una columna neutra.",
        backswing_analysis: "El palo se mantiene en el plano correcto durante la subida, aunque podrías rotar un poco más los hombros.",
        grip_analysis: "Tu grip parece neutro y bien posicionado, lo que facilita una cara del palo cuadrada en el impacto.",
        downswing_analysis: "Buena transición de peso. Mantén la extensión de los brazos un poco más después del impacto.",
        posture: "Tu postura inicial es sólida, con una buena alineación de hombros y pies.",
        strengths: ["Buen equilibrio", "Transición fluida", "Impacto centrado"],
        areas_to_improve: ["Extensión de brazos", "Transferencia de peso", "Estabilidad en el finish"],
        tips: tips[Math.floor(Math.random() * tips.length)],
        overall_assessment: "Un swing con gran potencial. Trabajando en la estabilidad inferior verás mejoras inmediatas."
    };
};

const SWING_ANALYSIS_PROMPT = `Eres un coach de golf profesional certificado por la PGA. Analiza este video de swing de golf y proporciona un análisis técnico detallado.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin backticks. Solo el JSON puro.

El JSON debe tener exactamente esta estructura:
{
  "swing_score": <número entero del 1 al 100>,
  "metrics": {
    "club_head_speed": "<velocidad estimada en mph>",
    "tempo_ratio": "<ratio de tempo backswing:downswing>",
    "backswing_angle": "<ángulo de backswing en grados>",
    "attack_angle": "<ángulo de ataque en grados>",
    "spine_angle": "<ángulo de columna en grados>",
    "hip_rotation": "<rotación de cadera en grados>"
  },
  "setup_analysis": "<análisis de cómo se para y posición inicial en español>",
  "backswing_analysis": "<análisis técnico de la subida del palo en español>",
  "grip_analysis": "<análisis del agarre/grip en español>",
  "downswing_analysis": "<análisis del descenso e impacto en español>",
  "posture": "<evaluación resumida de la postura en 1 frase>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "areas_to_improve": ["<área 1>", "<área 2>", "<área 3>"],
  "tips": "<consejo personalizado detallado en español, 2-3 oraciones>",
  "overall_assessment": "<evaluación general en español, 1-2 oraciones>",
  "visual_data": {
    "points": {
      "head": {"x": <0-100>, "y": <0-100>},
      "left_shoulder": {"x": <0-100>, "y": <0-100>},
      "right_shoulder": {"x": <0-100>, "y": <0-100>},
      "left_hip": {"x": <0-100>, "y": <0-100>},
      "right_hip": {"x": <0-100>, "y": <0-100>},
      "left_knee": {"x": <0-100>, "y": <0-100>},
      "right_knee": {"x": <0-100>, "y": <0-100>},
      "left_foot": {"x": <0-100>, "y": <0-100>},
      "right_foot": {"x": <0-100>, "y": <0-100>},
      "club_head": {"x": <0-100>, "y": <0-100>}
    }
  }
}

IMPORTANTE: Los puntos (x, y) deben ser porcentajes del 0 al 100 relativos al video. Ubícalos en el punto de impacto o el tope del backswing. Si el video no muestra un swing de golf claramente... (rest of instructions)`;

async function analyzeSwingWithGemini(videoFile: File): Promise<any> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Data = (reader.result as string).split(',')[1];
                const mimeType = videoFile.type || 'video/mp4';

                const requestBody = {
                    contents: [{
                        parts: [
                            { inline_data: { mime_type: mimeType, data: base64Data } },
                            { text: SWING_ANALYSIS_PROMPT }
                        ]
                    }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
                };

                const response = await fetch(GEMINI_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        console.warn('Gemini Quota exceeded');
                        return resolve(getSimulatedAnalysis());
                    }
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!textResponse) throw new Error('Empty response from AI');

                // Clean markdown backticks
                let cleanJson = textResponse.trim();
                if (cleanJson.startsWith('```')) {
                    cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '').trim();
                }

                try {
                    const result = JSON.parse(cleanJson);
                    resolve(result);
                } catch (e) {
                    console.error('JSON Parse error:', e, cleanJson);
                    resolve(getSimulatedAnalysis());
                }
            } catch (err) {
                console.error('General analysis error:', err);
                resolve(getSimulatedAnalysis());
            }
        };
        reader.onerror = () => reject(new Error('Error leyendo el archivo'));
        reader.readAsDataURL(videoFile);
    });
}

// --- Skeletal Overlay Component ---
const SkeletalOverlay = ({ points, isActive, color }: { points?: Record<string, { x: number; y: number }>; isActive: boolean; color: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !points || !isActive) {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limpiar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawLine = (p1: any, p2: any, strokeStyle: string, lineWidth: number = 2) => {
            if (!p1 || !p2) return;
            ctx.beginPath();
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.moveTo(p1.x * canvas.width / 100, p1.y * canvas.height / 100);
            ctx.lineTo(p2.x * canvas.width / 100, p2.y * canvas.height / 100);
            ctx.stroke();
        };

        const drawPoint = (p: any, fillStyle: string, radius: number = 3) => {
            if (!p) return;
            ctx.beginPath();
            ctx.fillStyle = fillStyle;
            ctx.arc(p.x * canvas.width / 100, p.y * canvas.height / 100, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        // Dibujar Conexiones (Esqueleto)
        ctx.globalAlpha = 0.6;
        drawLine(points.left_shoulder, points.right_shoulder, 'white');
        drawLine(points.left_shoulder, points.left_hip, 'white');
        drawLine(points.right_shoulder, points.right_hip, 'white');
        drawLine(points.left_hip, points.right_hip, 'white');

        drawLine(points.left_hip, points.left_knee, color);
        drawLine(points.left_knee, points.left_foot, color);
        drawLine(points.right_hip, points.right_knee, color);
        drawLine(points.right_knee, points.right_foot, color);

        // Dibujar Puntos
        ctx.globalAlpha = 1.0;
        Object.values(points).forEach(p => drawPoint(p, color));
        drawPoint(points.head, 'white', 4);
        drawPoint(points.club_head, '#fbbf24', 5);

    }, [points, isActive, color]);

    if (!points) return null;

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={240}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.3s'
            }}
        />
    );
};

const SwingAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [analyses, setAnalyses] = useState<SwingAnalysisData[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [processingStep, setProcessingStep] = useState<'none' | 'reading' | 'analyzing' | 'saving'>('none');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (session) fetchAnalyses();
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
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            setError('El video debe ser menor a 20MB');
            return;
        }

        setError(null);
        setSelectedFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
    };

    const handleAnalyze = async () => {
        if (!selectedFile || !session) return;

        setError(null);

        try {
            // Step 1: Read & encode
            setProcessingStep('reading');
            await new Promise(r => setTimeout(r, 500));

            // Step 2: Send to Gemini
            setProcessingStep('analyzing');
            const analysis = await analyzeSwingWithGemini(selectedFile);

            // Step 3: Upload video to Supabase Storage & save results
            setProcessingStep('saving');

            const fileExt = selectedFile.name.split('.').pop();
            const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('swing_analyses')
                .insert([{
                    user_id: session.user.id,
                    video_url: publicUrl,
                    feedback: analysis,
                    swing_score: analysis.swing_score || null,
                    analyzed_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            // Clean up
            setShowUploadModal(false);
            setSelectedFile(null);
            setVideoPreviewUrl(null);
            fetchAnalyses();

            if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

        } catch (err: any) {
            console.error('Error analyzing swing:', err);
            setError(err.message || 'Error al analizar el video. Intenta de nuevo.');
        } finally {
            setProcessingStep('none');
        }
    };

    const handleDeleteAnalysis = async (id: string, videoUrl: string) => {
        if (!session) {
            console.error('No session found for deletion');
            return;
        }

        console.log('Eliminando análisis:', id);

        try {
            // 1. ELIMINAR DE LA BASE DE DATOS PRIMERO
            const { error: dbError } = await supabase
                .from('swing_analyses')
                .delete()
                .match({ id, user_id: session.user.id });

            if (dbError) {
                console.error('Error DB al borrar:', dbError);
                throw dbError;
            }

            console.log('Registro en DB eliminado correctamente');

            // 2. ELIMINAR DEL STORAGE (Opcional, no bloquea el flujo si falla)
            try {
                // Limpiar URL de posibles parámetros (?t=...)
                const cleanUrl = videoUrl.split('?')[0];
                const urlParts = cleanUrl.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const userIdFolder = urlParts[urlParts.length - 2];
                const storagePath = `${userIdFolder}/${fileName}`;

                console.log('Eliminando de storage:', storagePath);

                const { error: storageError } = await supabase.storage
                    .from('media')
                    .remove([storagePath]);

                if (storageError) {
                    console.warn('Error en storage (ignorable):', storageError);
                } else {
                    console.log('Video eliminado de storage');
                }
            } catch (storageErr) {
                console.warn('Fallo al procesar borrado de storage:', storageErr);
            }

            // 3. ACTUALIZAR ESTADO LOCAL
            setAnalyses(prev => prev.filter(a => a.id !== id));
            if (expandedAnalysis === id) setExpandedAnalysis(null);

            // Notificar al usuario (opcional pero bueno para saber que terminó)
            if (navigator.vibrate) navigator.vibrate(50);

        } catch (err: any) {
            console.error('Error crítico eliminando análisis:', err);
            alert(`No se pudo eliminar: ${err.message || 'Error desconocido'}`);
        }
    };

    const closeModal = () => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setVideoPreviewUrl(null);
        setError(null);
        setProcessingStep('none');
    };

    const getStepInfo = () => {
        switch (processingStep) {
            case 'reading': return { text: 'Preparando video...', progress: 20 };
            case 'analyzing': return { text: 'Analizando con Gemini IA...', progress: 60 };
            case 'saving': return { text: 'Guardando resultados...', progress: 90 };
            default: return { text: '', progress: 0 };
        }
    };

    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%',
            overflow: 'hidden',
            background: 'var(--primary)'
        }}>
            <NavigationStyles />
            <PageHero />

            <div style={{ position: 'absolute', top: 'var(--header-offset-top)', left: 0, right: 0, zIndex: 900, background: 'transparent', paddingBottom: '5px' }}>
                <div style={{ padding: '0 20px' }}>
                    <PageHeader noMargin onBack={() => navigate('/play-mode')} title="Swing IA" subtitle="Análisis profesional con Inteligencia Artificial" />
                </div>
            </div>

            <div className="no-scrollbar" style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 80px)',
                left: 0, right: 0,
                bottom: 0,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '15px 20px calc(var(--nav-height) + 80px + env(safe-area-inset-bottom)) 20px',
                display: 'flex', flexDirection: 'column', gap: '16px',
                zIndex: 10,
                overscrollBehavior: 'contain'
            }}>
                {/* Upload CTA */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.15) 0%, rgba(20, 45, 30, 0.6) 100%)',
                        borderRadius: '20px',
                        padding: '20px',
                        border: '1px solid rgba(163, 230, 53, 0.25)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '16px'
                    }}
                >
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '16px',
                        background: 'rgba(163, 230, 53, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <Upload size={24} color="var(--secondary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'white', margin: '0 0 4px' }}>Analizar Nuevo Swing</h3>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.3 }}>
                            Sube un video y nuestra IA analizará postura, velocidad y técnica
                        </p>
                    </div>
                    <ChevronRight size={18} color="var(--secondary)" />
                </motion.div>

                {/* Recent Analyses */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'white', margin: 0 }}>Mis Análisis</h3>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{analyses.length} resultados</span>
                </div>

                {analyses.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '40px 20px',
                        background: 'rgba(255,255,255,0.02)', borderRadius: '20px',
                        border: '1px dashed rgba(255,255,255,0.08)'
                    }}>
                        <Video size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: '12px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 4px', fontWeight: '700' }}>Sin análisis aún</p>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>¡Sube tu primer swing para comenzar!</p>
                    </div>
                ) : (
                    analyses.map((item) => (
                        <AnalysisCard
                            key={item.id}
                            item={item}
                            isExpanded={expandedAnalysis === item.id}
                            onToggle={() => setExpandedAnalysis(expandedAnalysis === item.id ? null : item.id)}
                            onDelete={() => handleDeleteAnalysis(item.id, item.video_url)}
                        />
                    ))
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div key="upload-modal" style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: '20px' }}
                        onClick={processingStep === 'none' ? closeModal : undefined}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: '380px',
                                background: 'linear-gradient(180deg, rgba(20, 50, 30, 0.98) 0%, rgba(10, 30, 18, 0.99) 100%)',
                                borderRadius: '28px', padding: '24px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative'
                            }}
                        >
                            {processingStep === 'none' && (
                                <button onClick={closeModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={16} />
                                </button>
                            )}

                            {/* Video Preview or Upload area */}
                            {videoPreviewUrl ? (
                                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', position: 'relative', background: '#000' }}>
                                    <video
                                        src={videoPreviewUrl}
                                        controls
                                        playsInline
                                        style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
                                    />
                                    {processingStep === 'none' && (
                                        <button
                                            onClick={() => { setSelectedFile(null); setVideoPreviewUrl(null); setError(null); }}
                                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        borderRadius: '16px', padding: '35px 20px', marginBottom: '16px',
                                        border: '2px dashed rgba(163, 230, 53, 0.2)',
                                        background: 'rgba(163, 230, 53, 0.03)',
                                        textAlign: 'center', cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <Upload size={24} color="var(--secondary)" />
                                    </div>
                                    <p style={{ color: 'white', fontWeight: '800', fontSize: '14px', margin: '0 0 6px' }}>Seleccionar Video</p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                                        Video de cuerpo completo, lateral o frontal. Máx 20MB.
                                    </p>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />

                            {/* Error Message */}
                            {error && (
                                <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={14} color="#f87171" />
                                    <p style={{ color: '#f87171', fontSize: '11px', margin: 0, fontWeight: '600' }}>{error}</p>
                                </div>
                            )}

                            {/* Progress Steps */}
                            {processingStep !== 'none' && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: '12px' }}>
                                        <motion.div
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${getStepInfo().progress}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            style={{ height: '100%', background: 'var(--secondary)', borderRadius: '2px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <div className="loader-ring" />
                                        <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: '700' }}>
                                            {getStepInfo().text}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            {selectedFile && processingStep === 'none' && (
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleAnalyze}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '14px',
                                        background: 'var(--secondary)', color: 'var(--primary)',
                                        border: 'none', fontWeight: '900', fontSize: '14px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.25)'
                                    }}
                                >
                                    <Zap size={18} />
                                    ANALIZAR CON IA
                                </motion.button>
                            )}

                            {!selectedFile && processingStep === 'none' && (
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '14px',
                                        background: 'white', color: 'var(--primary)',
                                        border: 'none', fontWeight: '900', fontSize: '14px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Video size={18} />
                                    SELECCIONAR VIDEO
                                </motion.button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Analysis Card Component ---
const AnalysisCard = ({ item, isExpanded, onToggle, onDelete }: { item: SwingAnalysisData; isExpanded: boolean; onToggle: () => void; onDelete: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const score = item.swing_score || 0;
    const feedback = item.feedback || {};
    const date = new Date(item.analyzed_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

    const getScoreColor = (s: number) => {
        if (s >= 85) return '#a3e635';
        if (s >= 70) return '#fbbf24';
        if (s >= 50) return '#fb923c';
        return '#f87171';
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000); // 3 seconds to confirm
            return;
        }
        setIsDeleting(true);
        try {
            await onDelete();
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '20px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)'
            }}
        >
            {/* Video + Score Header */}
            <div style={{ position: 'relative', height: '240px', background: '#000' }} onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={item.video_url}
                    playsInline
                    onEnded={() => setIsPlaying(false)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }}
                />

                {/* Skeletal Overlay Canvas */}
                <SkeletalOverlay
                    points={feedback.visual_data?.points}
                    isActive={!isPlaying}
                    color={getScoreColor(score)}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    {!isPlaying && (
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            <Play size={20} color="white" style={{ marginLeft: '2px' }} />
                        </div>
                    )}
                </div>

                {/* Score Badge */}
                <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: `conic-gradient(${getScoreColor(score)} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(10, 30, 18, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', color: getScoreColor(score), lineHeight: 1 }}>{score}</span>
                        <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>SCORE</span>
                    </div>
                </div>

                {/* Simulation Badge */}
                {feedback.is_simulated && (
                    <div style={{
                        position: 'absolute', top: '12px', right: '70px',
                        background: 'rgba(239, 68, 68, 0.8)',
                        padding: '4px 8px', borderRadius: '6px',
                        backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 20
                    }}>
                        <span style={{ fontSize: '7px', fontWeight: '900', color: 'white', letterSpacing: '0.5px' }}>SIMULADO</span>
                    </div>
                )}

                {/* Date Badge */}
                <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(0,0,0,0.6)', padding: '3px 10px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{date}</span>
                </div>

                {/* Delete Button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        width: confirmDelete ? '80px' : '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: confirmDelete ? '#ef4444' : 'rgba(239, 68, 68, 0.95)',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        zIndex: 30,
                        pointerEvents: 'auto',
                        transition: 'width 0.2s ease, background 0.2s ease'
                    }}
                >
                    {isDeleting ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : confirmDelete ? (
                        <span style={{ fontSize: '9px', fontWeight: '900' }}>¿BORRAR?</span>
                    ) : (
                        <Trash2 size={16} />
                    )}
                </motion.button>
            </div>

            {/* Quick Summary Analysis (Always visible) */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {feedback.backswing_analysis && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ width: '4px', height: '14px', borderRadius: '2px', background: '#fbbf24', marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>
                            <span style={{ fontWeight: '800', color: '#fbbf24' }}>Backswing: </span>
                            {feedback.backswing_analysis.length > 80 ? feedback.backswing_analysis.substring(0, 80) + '...' : feedback.backswing_analysis}
                        </p>
                    </div>
                )}
                {feedback.grip_analysis && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ width: '4px', height: '14px', borderRadius: '2px', background: '#a3e635', marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>
                            <span style={{ fontWeight: '800', color: '#a3e635' }}>Grip: </span>
                            {feedback.grip_analysis.length > 80 ? feedback.grip_analysis.substring(0, 80) + '...' : feedback.grip_analysis}
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Metrics */}
            <div style={{ padding: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                    <MetricBox label="Velocidad" value={feedback.metrics?.club_head_speed || '--'} />
                    <MetricBox label="Tempo" value={feedback.metrics?.tempo_ratio || '--'} />
                    <MetricBox label="Backswing" value={feedback.metrics?.backswing_angle || '--'} />
                </div>

                {/* Expandable details */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onToggle}
                    style={{
                        width: '100%', padding: '8px', borderRadius: '10px',
                        background: 'rgba(163, 230, 53, 0.05)',
                        border: '1px solid rgba(163, 230, 53, 0.1)',
                        color: 'var(--secondary)', fontSize: '11px', fontWeight: '800',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}
                >
                    {isExpanded ? 'VER MENOS' : 'VER ANÁLISIS COMPLETO'}
                    <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </motion.button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div key="expanded-view" 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            style={{
                                marginTop: '12px',
                                maxHeight: '380px',
                                overflowY: 'auto',
                                paddingRight: '4px',
                                scrollbarWidth: 'none'
                            }}
                        >
                            <style>{`
                                div::-webkit-scrollbar { display: none; }
                            `}</style>
                            {/* Detailed Metrics Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                <MetricBox label="Ataque" value={feedback.metrics?.attack_angle || '--'} />
                                <MetricBox label="Columna" value={feedback.metrics?.spine_angle || '--'} />
                                <MetricBox label="Cadera" value={feedback.metrics?.hip_rotation || '--'} />
                            </div>

                            {/* Phase Analysis Accordion */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                <p style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', paddingLeft: '4px' }}>
                                    Desglose Técnico
                                </p>

                                {feedback.setup_analysis && (
                                    <ModernTechnicalCard title="Setup & Colocación" content={feedback.setup_analysis} icon={<Video size={14} />} color="#a3e635" />
                                )}
                                {feedback.grip_analysis && (
                                    <ModernTechnicalCard title="Control del Grip" content={feedback.grip_analysis} icon={<CheckCircle size={14} />} color="#60a5fa" />
                                )}
                                {feedback.backswing_analysis && (
                                    <ModernTechnicalCard title="Fase de Backswing" content={feedback.backswing_analysis} icon={<TrendingUp size={14} />} color="#fbbf24" />
                                )}
                                {feedback.downswing_analysis && (
                                    <ModernTechnicalCard title="Impacto y Release" content={feedback.downswing_analysis} icon={<Zap size={14} />} color="#f87171" />
                                )}
                            </div>

                            {/* Posture Summary (Old field for compatibility) */}
                            {feedback.posture && !feedback.setup_analysis && (
                                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                                    <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px' }}>Postura</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4 }}>{feedback.posture}</p>
                                </div>
                            )}

                            {/* Strengths */}
                            {feedback.strengths && feedback.strengths.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                    <p style={{ fontSize: '8px', color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle size={10} /> Fortalezas
                                    </p>
                                    {feedback.strengths.map((s: string, i: number) => (
                                        <div key={i} style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(163, 230, 53, 0.05)', marginBottom: '4px', border: '1px solid rgba(163, 230, 53, 0.08)' }}>
                                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>✓ {s}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Areas to Improve */}
                            {feedback.areas_to_improve && feedback.areas_to_improve.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                    <p style={{ fontSize: '8px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <TrendingUp size={10} /> Áreas de Mejora
                                    </p>
                                    {feedback.areas_to_improve.map((a: string, i: number) => (
                                        <div key={i} style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.05)', marginBottom: '4px', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
                                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>→ {a}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tips */}
                            {feedback.tips && (
                                <div style={{ padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.08) 0%, rgba(20, 45, 30, 0.3) 100%)', border: '1px solid rgba(163, 230, 53, 0.15)' }}>
                                    <p style={{ fontSize: '8px', color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Zap size={10} /> Consejo del Coach IA
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                                        "{feedback.tips}"
                                    </p>
                                </div>
                            )}

                            {/* Overall */}
                            {feedback.overall_assessment && (
                                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginTop: '10px' }}>
                                    <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px' }}>Evaluación General</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4 }}>{feedback.overall_assessment}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// --- Metric Box ---
const MetricBox = ({ label, value }: { label: string; value: string }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 6px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ margin: 0, fontSize: '7px', color: 'rgba(255,255,255,0.35)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--secondary)', fontWeight: '900' }}>{value}</p>
    </div>
);

// --- Modern Technical Content Item ---
const ModernTechnicalCard = ({ title, content, icon, color }: { title: string; content: string; icon: React.ReactNode; color: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <motion.div
            onClick={() => setIsOpen(!isOpen)}
            style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
                cursor: 'pointer'
            }}
        >
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: `${color}15`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: color
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: 'white', margin: 0 }}>{title}</p>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.3)" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div key="open-view" 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 16px 16px 60px' }}>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                                {content}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};



// --- Styles ---
const NavigationStyles = () => (<style>{`
    .loader-ring {
        width: 20px; height: 20px;
        border: 2px solid rgba(163, 230, 53, 0.15);
        border-top: 2px solid var(--secondary);
        border-radius: 50%;
        animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    /* Hide scrollbar for Safari/Chrome */
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
`}</style>);

export default SwingAnalysis;
