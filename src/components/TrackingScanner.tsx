
import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Camera as LucideCamera, Upload, X, Loader2, RefreshCw } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface TrackingScannerProps {
    onScanComplete: (trackingNumber: string, provider?: string) => void;
    onClose: () => void;
}

const TrackingScanner: React.FC<TrackingScannerProps> = ({ onScanComplete, onClose }) => {
    const [image, setImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, extractedTextSet] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const CARRIERS = [
        { name: 'Servientrega', pattern: /(servientrega|[0-9]{10,13})/i },
        { name: 'Coordinadora', pattern: /(coordinadora|[0-9]{11,15})/i },
        { name: 'Interrapidisimo', pattern: /(interrapidisimo|[0-9]{10,12})/i },
        { name: 'Envia', pattern: /(envia|[0-9]{9,12})/i },
        { name: 'TCC', pattern: /(tcc|[0-9]{10,12})/i },
        { name: 'FedEx', pattern: /(fedex|[0-9]{12,15})/i },
        { name: 'DHL', pattern: /(dhl|[0-9]{10})/i }
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImage(event.target.result as string);
                    processImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        // We still keep the live video for preview, but we'll use Capacitor for better permissions/focus if possible
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
            // Trigger light haptic on camera start
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

    const capturePhoto = () => {
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

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const processImage = async (imgData: string) => {
        setScanning(true);
        setProgress(0);
        extractedTextSet('');

        try {
            const result = await Tesseract.recognize(
                imgData,
                'eng+spa', // Use both for better results in Colombia
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            extractedTextSet(text);
            analyzeText(text);

        } catch (err) {
            console.error("OCR Error:", err);
            alert("Error al procesar la imagen.");
        } finally {
            setScanning(false);
        }
    };

    const analyzeText = (text: string) => {
        console.log("Analyzing text for tracking number/provider:", text);

        let extractedProvider = '';
        let bestMatch = '';

        // 1. Precise Carrier Search: Look for the carrier name first
        for (const carrier of CARRIERS) {
            if (text.toLowerCase().includes(carrier.name.toLowerCase())) {
                extractedProvider = carrier.name;
                console.log(`Found provider: ${extractedProvider}`);
                break;
            }
        }

        // 2. Extract potential numbers (Alphanumeric, 8-22 chars)
        // We also allow some common OCR artifacts like spaces or dashes which we'll clean later
        let cleanedText = text.replace(/[\-|\s]/g, '');
        const potentialNumbers = cleanedText.match(/[A-Z0-9]{8,22}/g) || [];

        console.log("Potential matches found:", potentialNumbers);

        if (potentialNumbers.length > 0) {
            // Priority 1: If we have a carrier, try to find a number that matches its specific pattern
            if (extractedProvider) {
                const carrier = CARRIERS.find(c => c.name === extractedProvider);
                if (carrier) {
                    const match = potentialNumbers.find(n => carrier.pattern.test(n));
                    if (match) {
                        bestMatch = match;
                        console.log(`Matched carrier ${extractedProvider} specific pattern: ${bestMatch}`);
                    }
                }
            }

            // Priority 2: Take the most likely candidate (longest one that has digits)
            if (!bestMatch) {
                const validNumbers = potentialNumbers
                    .filter(n => /[0-9]{6,}/.test(n)) // Must have a decent number of digits
                    .sort((a, b) => b.length - a.length);

                if (validNumbers.length > 0) {
                    bestMatch = validNumbers[0];
                    console.log(`Fallback best match: ${bestMatch}`);
                }
            }
        }

        if (bestMatch) {
            console.log(`Final scan complete: Number=${bestMatch}, Provider=${extractedProvider}`);

            // Native feedback
            try {
                Haptics.impact({ style: ImpactStyle.Heavy });
                Haptics.notification({ type: 'SUCCESS' as any });
            } catch (e) {
                console.log("Haptics not supported or failed", e);
            }

            onScanComplete(bestMatch, extractedProvider);
        } else {
            console.warn("No valid tracking number found in text.");
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            background: 'var(--background)',
            display: 'flex',
            flexDirection: 'column'
        }} className="animate-fade-in">
            <div style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--primary)',
                color: 'white'
            }}>
                <h3 style={{ fontWeight: 'bold' }}>Escanear Guía</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: '20px',
                overflowY: 'auto'
            }}>
                {!image && !isCameraOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '300px' }}>
                        <button
                            onClick={takeNativePhoto}
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                border: 'none',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                fontSize: '16px',
                                boxShadow: '0 4px 15px rgba(163, 230, 53, 0.3)'
                            }}
                        >
                            <LucideCamera size={24} />
                            Usar Cámara Nativa
                        </button>

                        <button
                            onClick={startCamera}
                            style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
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
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                            <button
                                style={{
                                    width: '100%',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    fontSize: '16px'
                                }}
                            >
                                <Upload size={24} />
                                Subir Foto
                            </button>
                        </div>
                    </div>
                )}

                {isCameraOpen && (
                    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'black', display: 'flex', flexDirection: 'column' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', flex: 1, objectFit: 'cover' }} />
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                            <button
                                onClick={capturePhoto}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    border: '4px solid rgba(0,0,0,0.2)',
                                    boxShadow: '0 0 0 4px white'
                                }}
                            />
                        </div>
                    </div>
                )}

                {image && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <img src={image} alt="Scanned" style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'contain' }} />

                        {scanning ? (
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' }}>
                                <Loader2 className="animate-spin" size={32} color="var(--secondary)" style={{ margin: '0 auto 10px auto' }} />
                                <p style={{ color: 'white', fontWeight: 'bold' }}>Procesando imagen...</p>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--secondary)', transition: 'width 0.3s ease' }} />
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>{progress}%</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => { setImage(null); setIsCameraOpen(false); extractedTextSet('') }}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <RefreshCw size={18} />
                                    Intentar de nuevo
                                </button>
                            </div>
                        )}

                        {extractedText && !scanning && (
                            <div style={{
                                padding: '15px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '12px',
                                maxHeight: '150px',
                                overflowY: 'auto',
                                fontSize: '12px',
                                color: 'var(--text-dim)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '5px', color: 'var(--secondary)' }}>Texto Detectado:</p>
                                {extractedText}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingScanner;
