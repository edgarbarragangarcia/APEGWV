import React, { useState, useRef, useEffect, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { Camera as LucideCamera, Upload, X, Loader2, RefreshCw } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { analyzeOCRText } from '../utils/scannerHelpers';

interface TrackingScannerProps {
    onScanComplete: (trackingNumber: string, provider?: string) => void;
    onClose: () => void;
}

const TrackingScanner: React.FC<TrackingScannerProps> = ({ onScanComplete, onClose }) => {
    const [image, setImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState<string>('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // --- Media Helpers ---

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    }, []);

    const startWebCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("No se pudo acceder a la cámara via web. Intenta subir una foto.");
            setIsCameraOpen(false);
        }
    };

    const takeNativePhoto = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera
            });

            if (image.dataUrl) {
                setImage(image.dataUrl);
                processImage(image.dataUrl);
            }
        } catch (err) {
            console.log("User cancelled camera or error:", err);
        }
    };

    // --- Processing Logic ---

    const processImage = async (imgData: string) => {
        setScanning(true);
        setProgress(0);
        setExtractedText('');

        try {
            const result = await Tesseract.recognize(
                imgData,
                'eng+spa',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            setExtractedText(text);

            const { bestMatch, extractedProvider } = analyzeOCRText(text);

            if (bestMatch) {
                try {
                    await Haptics.impact({ style: ImpactStyle.Heavy });
                    await Haptics.notification({ type: 'SUCCESS' as any });
                } catch (e) {
                    // Ignore haptics error on web
                }
                onScanComplete(bestMatch, extractedProvider);
            } else {
                console.warn("No valid tracking number found.");
            }

        } catch (err) {
            console.error("OCR Error:", err);
            alert("Error al procesar la imagen.");
        } finally {
            setScanning(false);
        }
    };

    const captureWebPhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImage(dataUrl);
            stopCamera();
            processImage(dataUrl);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const result = event.target.result as string;
                    setImage(result);
                    processImage(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // --- Styles ---
    // Moved complex inline object styles to constants for readability
    const overlayStyle: React.CSSProperties = {
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'var(--primary)', display: 'flex', flexDirection: 'column'
    };

    const headerStyle: React.CSSProperties = {
        padding: '20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: 'var(--primary)', color: 'white'
    };

    const actionButtonStyle: React.CSSProperties = {
        padding: '20px', borderRadius: '16px', border: 'none',
        fontWeight: 'bold', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px', fontSize: '16px',
        width: '100%', cursor: 'pointer'
    };

    return (
        <div style={overlayStyle} className="animate-fade-in">
            <div style={headerStyle}>
                <h3 style={{ fontWeight: 'bold' }}>Escanear Guía</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', padding: '20px', overflowY: 'auto'
            }}>
                {/* Initial View: Choose Source */}
                {!image && !isCameraOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '300px' }}>
                        <button
                            onClick={takeNativePhoto}
                            style={{
                                ...actionButtonStyle,
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                boxShadow: '0 4px 15px rgba(163, 230, 53, 0.3)'
                            }}
                        >
                            <LucideCamera size={24} />
                            Usar Cámara Nativa
                        </button>

                        <button
                            onClick={startWebCamera}
                            style={{
                                ...actionButtonStyle,
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                fontSize: '14px'
                            }}
                        >
                            <LucideCamera size={20} />
                            Cámara Web (Live)
                        </button>

                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                style={{
                                    position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer'
                                }}
                            />
                            <button
                                style={{
                                    ...actionButtonStyle,
                                    background: '#1a332a', color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <Upload size={24} />
                                Subir Foto
                            </button>
                        </div>
                    </div>
                )}

                {/* Web Camera View */}
                {isCameraOpen && (
                    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'black', display: 'flex', flexDirection: 'column' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', flex: 1, objectFit: 'cover' }} />
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                            <button
                                onClick={captureWebPhoto}
                                style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: 'white', border: '4px solid rgba(0,0,0,0.2)',
                                    boxShadow: '0 0 0 4px white', cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Result View */}
                {image && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <img src={image} alt="Scanned" style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'contain' }} />

                        {scanning ? (
                            <div style={{ padding: '20px', background: '#0a2a1d', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--secondary)' }}>
                                <Loader2 className="animate-spin" size={32} color="var(--secondary)" style={{ margin: '0 auto 10px auto' }} />
                                <p style={{ color: 'white', fontWeight: 'bold' }}>Procesando imagen...</p>
                                <div style={{ width: '100%', height: '6px', background: '#1a332a', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--secondary)', transition: 'width 0.3s ease' }} />
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>{progress}%</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => { setImage(null); setIsCameraOpen(false); setExtractedText('') }}
                                    style={{
                                        flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)',
                                        color: 'white', border: 'none', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '8px', cursor: 'pointer'
                                    }}
                                >
                                    <RefreshCw size={18} />
                                    Intentar de nuevo
                                </button>
                            </div>
                        )}

                        {extractedText && !scanning && (
                            <div style={{
                                padding: '15px', background: '#051d13', borderRadius: '12px',
                                maxHeight: '200px', overflowY: 'auto', fontSize: '13px',
                                color: 'white', border: '2px solid var(--secondary)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--secondary)', fontSize: '14px' }}>Texto Detectado:</p>
                                <div style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                    {extractedText}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingScanner;
