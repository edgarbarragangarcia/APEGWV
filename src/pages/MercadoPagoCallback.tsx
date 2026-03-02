import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const MercadoPagoCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state'); // seller_profile_id

            if (!code || !state) {
                setStatus('error');
                setError('No se recibió el código de autorización o el estado.');
                return;
            }

            try {
                // Call Supabase Edge Function to exchange code for token
                const { data, error: functionError } = await supabase.functions.invoke('mercadopago-oauth', {
                    body: { code, seller_profile_id: state }
                });

                if (functionError) throw functionError;

                if (data.success) {
                    setStatus('success');
                    setTimeout(() => {
                        navigate('/my-store?tab=profile');
                    }, 3000);
                } else {
                    throw new Error(data.message || 'Error desconocido vinculando la cuenta.');
                }
            } catch (err: any) {
                console.error('Error in MP callback:', err);
                setStatus('error');
                setError(err.message || 'Error al procesar la vinculación.');
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div style={{
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--primary)',
            padding: '20px',
            textAlign: 'center'
        }}>
            {status === 'loading' && (
                <>
                    <Loader2 className="animate-spin" size={48} color="var(--secondary)" />
                    <h2 style={{ color: 'white', marginTop: '20px', fontSize: '20px', fontWeight: '800' }}>
                        Vinculando tu cuenta...
                    </h2>
                    <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>
                        Estamos procesando la autorización de Mercado Pago.
                    </p>
                </>
            )}

            {status === 'success' && (
                <>
                    <CheckCircle2 size={64} color="var(--secondary)" />
                    <h2 style={{ color: 'white', marginTop: '20px', fontSize: '24px', fontWeight: '900' }}>
                        ¡Cuenta Vinculada!
                    </h2>
                    <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>
                        Tu cuenta de Mercado Pago se ha conectado correctamente.
                        Vuelves a tu tienda en unos segundos...
                    </p>
                </>
            )}

            {status === 'error' && (
                <>
                    <XCircle size={64} color="#ef4444" />
                    <h2 style={{ color: 'white', marginTop: '20px', fontSize: '24px', fontWeight: '900' }}>
                        Algo salió mal
                    </h2>
                    <p style={{ color: 'var(--text-dim)', marginTop: '10px', maxWidth: '300px' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => navigate('/my-store?tab=profile')}
                        style={{
                            marginTop: '30px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        VOLVER AL PERFIL
                    </button>
                </>
            )}
        </div>
    );
};

export default MercadoPagoCallback;
