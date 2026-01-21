import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store, User, Building2,
    Landmark,
    CheckCircle2, ArrowRight,
    Loader2, ShieldCheck
} from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

interface StoreOnboardingProps {
    onComplete: () => void;
}

type EntityType = 'natural' | 'juridica';

const StoreOnboarding: React.FC<StoreOnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        store_name: '',
        entity_type: 'natural' as EntityType,
        // Natural
        full_name: '',
        document_type: 'CC',
        document_number: '',
        // Juridica
        company_name: '',
        nit: '',
        legal_representative: '',
        // Bank
        bank_name: '',
        account_type: 'ahorros' as 'ahorros' | 'corriente',
        account_number: '',
        account_holder_name: '',
        account_holder_document: ''
    });

    const banks = [
        'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA',
        'Banco Popular', 'Banco de Occidente', 'Scotiabank Colpatria',
        'Itaú', 'Nequi', 'Daviplata', 'Lulo Bank', 'Nu Colombia'
    ];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('seller_profiles')
                .insert([{
                    user_id: user.id,
                    store_name: formData.store_name,
                    entity_type: formData.entity_type,
                    full_name: formData.entity_type === 'natural' ? formData.full_name : null,
                    document_type: formData.entity_type === 'natural' ? formData.document_type : null,
                    document_number: formData.entity_type === 'natural' ? formData.document_number : null,
                    company_name: formData.entity_type === 'juridica' ? formData.company_name : null,
                    nit: formData.entity_type === 'juridica' ? formData.nit : null,
                    legal_representative: formData.entity_type === 'juridica' ? formData.legal_representative : null,
                    bank_name: formData.bank_name,
                    account_type: formData.account_type,
                    account_number: formData.account_number,
                    account_holder_name: formData.account_holder_name,
                    account_holder_document: formData.account_holder_document,
                    status: 'active'
                }]);

            if (error) throw error;
            onComplete();
        } catch (err) {
            console.error('Error creating seller profile:', err);
            alert('Error al crear el Marketplace. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const isStep1Valid = formData.store_name.length > 2;
    const isStep2Valid = formData.entity_type === 'natural'
        ? (formData.full_name && formData.document_number)
        : (formData.company_name && formData.nit && formData.legal_representative);
    const isStep3Valid = formData.bank_name && formData.account_number && formData.account_holder_name && formData.account_holder_document;

    return (
        <div className="animate-fade" style={{ padding: '0 5px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--secondary)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    boxShadow: '0 10px 20px rgba(163, 230, 53, 0.2)'
                }}>
                    <Store color="var(--primary)" size={30} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Configura tu Marketplace</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.5' }}>
                    Registra tus datos para empezar a vender tus productos en el Marketplace APEG.
                </p>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: i <= step ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                        transition: 'all 0.3s'
                    }} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div className="glass" style={{ padding: '25px', borderRadius: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Store size={18} color="var(--secondary)" />
                                Nombre del Marketplace
                            </h3>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tu marca o nombre comercial</label>
                            <input
                                required
                                value={formData.store_name}
                                onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '15px',
                                    padding: '15px',
                                    color: 'white',
                                    fontSize: '16px'
                                }}
                                placeholder="Ej: Golf Pro Shop"
                            />
                        </div>

                        <button
                            disabled={!isStep1Valid}
                            onClick={nextStep}
                            style={{
                                background: isStep1Valid ? 'var(--secondary)' : 'rgba(163, 230, 53, 0.2)',
                                color: 'var(--primary)',
                                padding: '16px',
                                borderRadius: '18px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.3s'
                            }}
                        >
                            <span>CONTINUAR</span>
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div className="glass" style={{ padding: '25px', borderRadius: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>Tipo de Vendedor</h3>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
                                <button
                                    onClick={() => setFormData({ ...formData, entity_type: 'natural' })}
                                    style={{
                                        flex: 1,
                                        padding: '20px 10px',
                                        borderRadius: '18px',
                                        border: `1px solid ${formData.entity_type === 'natural' ? 'var(--secondary)' : 'var(--glass-border)'}`,
                                        background: formData.entity_type === 'natural' ? 'rgba(163, 230, 53, 0.1)' : 'transparent',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '10px',
                                        color: formData.entity_type === 'natural' ? 'var(--secondary)' : 'var(--text-dim)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <User size={24} />
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>Persona Natural</span>
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, entity_type: 'juridica' })}
                                    style={{
                                        flex: 1,
                                        padding: '20px 10px',
                                        borderRadius: '18px',
                                        border: `1px solid ${formData.entity_type === 'juridica' ? 'var(--secondary)' : 'var(--glass-border)'}`,
                                        background: formData.entity_type === 'juridica' ? 'rgba(163, 230, 53, 0.1)' : 'transparent',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '10px',
                                        color: formData.entity_type === 'juridica' ? 'var(--secondary)' : 'var(--text-dim)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <Building2 size={24} />
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>Persona Jurídica</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {formData.entity_type === 'natural' ? (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre Completo</label>
                                            <input
                                                value={formData.full_name}
                                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tipo Doc</label>
                                                <select
                                                    value={formData.document_type}
                                                    onChange={e => setFormData({ ...formData, document_type: e.target.value })}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                                >
                                                    <option value="CC">CC</option>
                                                    <option value="CE">CE</option>
                                                    <option value="PP">Pasaporte</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Documento</label>
                                                <input
                                                    value={formData.document_number}
                                                    onChange={e => setFormData({ ...formData, document_number: e.target.value })}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Razón Social</label>
                                            <input
                                                value={formData.company_name}
                                                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>NIT</label>
                                            <input
                                                value={formData.nit}
                                                placeholder="Ej: 900.123.456-7"
                                                onChange={e => setFormData({ ...formData, nit: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Representante Legal</label>
                                            <input
                                                value={formData.legal_representative}
                                                onChange={e => setFormData({ ...formData, legal_representative: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={prevStep}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    padding: '16px',
                                    borderRadius: '18px',
                                    fontWeight: '700',
                                    border: '1px solid var(--glass-border)'
                                }}
                            >
                                ATRÁS
                            </button>
                            <button
                                disabled={!isStep2Valid}
                                onClick={nextStep}
                                style={{
                                    flex: 2,
                                    background: isStep2Valid ? 'var(--secondary)' : 'rgba(163, 230, 53, 0.2)',
                                    color: 'var(--primary)',
                                    padding: '16px',
                                    borderRadius: '18px',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                <span>CONTINUAR</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div className="glass" style={{ padding: '25px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '8px', borderRadius: '10px' }}>
                                    <Landmark size={20} color="var(--secondary)" />
                                </div>
                                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Información Bancaria</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Banco</label>
                                    <select
                                        value={formData.bank_name}
                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                    >
                                        <option value="">Selecciona un banco</option>
                                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tipo de Cuenta</label>
                                        <select
                                            value={formData.account_type}
                                            onChange={e => setFormData({ ...formData, account_type: e.target.value as any })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                        >
                                            <option value="ahorros">Ahorros</option>
                                            <option value="corriente">Corriente</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Cuenta</label>
                                        <input
                                            value={formData.account_number}
                                            inputMode="numeric"
                                            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Titular de la Cuenta</label>
                                    <input
                                        value={formData.account_holder_name}
                                        onChange={e => setFormData({ ...formData, account_holder_name: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                        placeholder="Nombre completo"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Documento del Titular</label>
                                    <input
                                        value={formData.account_holder_document}
                                        onChange={e => setFormData({ ...formData, account_holder_document: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                        placeholder="CC o NIT"
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(163, 230, 53, 0.05)', borderRadius: '15px', border: '1px solid rgba(163, 230, 53, 0.1)', display: 'flex', gap: '10px' }}>
                                <ShieldCheck size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                                    Usamos estos datos exclusivamente para consignar el dinero de tus ventas. Tus datos están protegidos y encriptados.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={prevStep}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    padding: '16px',
                                    borderRadius: '18px',
                                    fontWeight: '700',
                                    border: '1px solid var(--glass-border)'
                                }}
                            >
                                ATRÁS
                            </button>
                            <button
                                disabled={!isStep3Valid || loading}
                                onClick={handleSubmit}
                                style={{
                                    flex: 2,
                                    background: isStep3Valid ? 'var(--secondary)' : 'rgba(163, 230, 53, 0.2)',
                                    color: 'var(--primary)',
                                    padding: '16px',
                                    borderRadius: '18px',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                <span>{loading ? 'CREANDO...' : 'FINALIZAR REGISTRO'}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', color: 'var(--text-dim)' }}>
                Al registrarte, aceptas los términos de vendedor de APEG.
            </p>
        </div>
    );
};

export default StoreOnboarding;
