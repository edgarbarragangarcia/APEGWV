import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface CardScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScanComplete: (data: { number: string; expiry: string }) => void;
}

const CardScanner: React.FC<CardScannerProps> = ({ isOpen, onClose, onScanComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('No se pudo acceder a la cámara. Por favor verifica los permisos.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureAndProcess = async () => {
        if (!videoRef.current || !canvasRef.current || isProcessing) return;

        setIsProcessing(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Draw current video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(canvas);
            await worker.terminate();

            // Simple regex for card numbers (detects sequences of 4 groups of digits)
            const numberMatch = text.replace(/[^0-9]/g, '').match(/\d{16}/);
            // Regex for expiry (MM/YY or MM/YYYY)
            const expiryMatch = text.match(/(0[1-9]|1[0-2])\/([0-9]{2,4})/);

            if (numberMatch) {
                const formattedNumber = numberMatch[0].match(/.{1,4}/g)?.join(' ') || '';
                const expiry = expiryMatch ? expiryMatch[0] : '';

                if (navigator.vibrate) navigator.vibrate(200);
                onScanComplete({ number: formattedNumber, expiry });
                onClose();
            } else {
                // If not found, try again in a second
                setTimeout(captureAndProcess, 1500);
            }
        } catch (err) {
            console.error('OCR error:', err);
            setTimeout(captureAndProcess, 1500);
        } finally {
            setIsProcessing(false);
        }
    };

    // Auto-process every few seconds
    useEffect(() => {
        let interval: any;
        if (isOpen && stream && !isProcessing) {
            interval = setTimeout(captureAndProcess, 2000);
        }
        return () => clearTimeout(interval);
    }, [isOpen, stream, isProcessing]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'black',
                        zIndex: 10000,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 10
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Camera size={20} color="var(--secondary)" />
                            <span style={{ fontWeight: '800', fontSize: '14px', color: 'white' }}>ESCANEAR TARJETA</span>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Camera View */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {error ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
                                <p style={{ color: 'white', fontWeight: '600' }}>{error}</p>
                                <button
                                    onClick={startCamera}
                                    style={{ marginTop: '20px', background: 'var(--secondary)', color: 'var(--primary)', padding: '12px 24px', borderRadius: '12px', fontWeight: '700' }}
                                >
                                    REINTENTAR
                                </button>
                            </div>
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />

                                {/* Scanning Overlay */}
                                <div style={{
                                    position: 'absolute',
                                    width: '85%',
                                    aspectRatio: '1.6',
                                    border: '2px solid var(--secondary)',
                                    borderRadius: '20px',
                                    boxShadow: '0 0 0 1000px rgba(0,0,0,0.6)',
                                    zIndex: 5
                                }}>
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            height: '2px',
                                            background: 'var(--secondary)',
                                            boxShadow: '0 0 15px var(--secondary)'
                                        }}
                                    />
                                    {isProcessing && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(0,0,0,0.3)',
                                            borderRadius: '18px'
                                        }}>
                                            <div className="animate-pulse" style={{ color: 'var(--secondary)', fontWeight: '900', fontSize: '12px', letterSpacing: '2px' }}>
                                                PROCESANDO...
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Instructions */}
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
                        <p style={{ color: 'white', fontSize: '14px', fontWeight: '600', opacity: 0.8 }}>
                            Ubica tu tarjeta dentro del recuadro
                        </p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '8px' }}>
                            Asegúrate de tener buena iluminación
                        </p>
                    </div>

                    {/* Hidden Canvas for capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CardScanner;
