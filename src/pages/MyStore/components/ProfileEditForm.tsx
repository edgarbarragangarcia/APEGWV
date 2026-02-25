import React from 'react';
import { Store, Landmark, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SellerProfile {
    id: string;
    store_name: string;
    entity_type: string;
    full_name?: string | null;
    company_name?: string | null;
    document_type?: string | null;
    document_number?: string | null;
    nit?: string | null;
    bank_name?: string | null;
    account_type?: string | null;
    account_number?: string | null;
    [key: string]: any;
}

interface ProfileEditFormProps {
    formData: SellerProfile | null;
    saving: boolean;
    onChange: (data: SellerProfile) => void;
    onSubmit: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
    formData,
    saving,
    onChange,
    onSubmit
}) => {
    if (!formData) return null;

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '16px 16px 16px 45px',
        color: 'white',
        fontSize: '15px',
        fontFamily: 'var(--font-main)',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box' as const
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '10px',
        fontSize: '11px',
        fontWeight: '900',
        color: 'var(--secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        paddingLeft: '4px',
        fontFamily: 'var(--font-main)'
    };

    const sectionStyle = {
        padding: '24px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        marginBottom: '20px'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
            <div style={{ ...sectionStyle, background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}>
                <label style={labelStyle}>Nombre de tu Tienda</label>
                <div style={{ position: 'relative' }}>
                    <input
                        value={formData.store_name || ''}
                        onChange={e => onChange({ ...formData, store_name: e.target.value })}
                        style={inputStyle}
                        placeholder="Ej: Mi Tienda Pro"
                    />
                    <Store size={20} color="var(--secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }} />
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: '900',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    Información de Identidad
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {formData.entity_type === 'natural' ? (
                        <>
                            <div>
                                <label style={{ ...labelStyle, color: 'white', opacity: 0.7, fontSize: '12px' }}>Nombre Completo</label>
                                <input
                                    value={formData.full_name || ''}
                                    onChange={e => onChange({ ...formData, full_name: e.target.value })}
                                    style={{ ...inputStyle, paddingLeft: '20px' }}
                                />
                            </div>
                            <div>
                                <label style={{ ...labelStyle, color: 'white', opacity: 0.7, fontSize: '12px' }}>Número de Documento</label>
                                <input
                                    value={formData.document_number || ''}
                                    onChange={e => onChange({ ...formData, document_number: e.target.value })}
                                    style={{ ...inputStyle, paddingLeft: '20px' }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label style={{ ...labelStyle, color: 'white', opacity: 0.7, fontSize: '12px' }}>Razón Social</label>
                                <input
                                    value={formData.company_name || ''}
                                    onChange={e => onChange({ ...formData, company_name: e.target.value })}
                                    style={{ ...inputStyle, paddingLeft: '20px' }}
                                />
                            </div>
                            <div>
                                <label style={{ ...labelStyle, color: 'white', opacity: 0.7, fontSize: '12px' }}>NIT</label>
                                <input
                                    value={formData.nit || ''}
                                    onChange={e => onChange({ ...formData, nit: e.target.value })}
                                    style={{ ...inputStyle, paddingLeft: '20px' }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: '900',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    Configuración de Pagos
                </h4>
                <div>
                    <label style={{ ...labelStyle, color: 'white', opacity: 0.7, fontSize: '12px' }}>Número de Cuenta para Retiros</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={formData.account_number || ''}
                            onChange={e => onChange({ ...formData, account_number: e.target.value })}
                            style={inputStyle}
                            placeholder="Número de cuenta bancaria"
                        />
                        <Landmark size={20} color="var(--secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }} />
                    </div>
                    <div style={{
                        marginTop: '15px',
                        padding: '12px 16px',
                        background: 'rgba(56, 189, 248, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(56, 189, 248, 0.1)',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start'
                    }}>
                        <Info size={16} color="#38bdf8" style={{ marginTop: '2px' }} />
                        <p style={{ fontSize: '11px', color: '#7dd3fc', lineHeight: '1.4', fontWeight: '600' }}>
                            Para actualizar tus datos bancarios, por favor contacta al equipo de soporte de APEG.
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={onSubmit}
                disabled={saving}
                className="btn-primary"
                style={{ height: '60px', marginTop: '10px' }}
            >
                {saving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="spinner-small" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                        <span>GUARDANDO CAMBIOS...</span>
                    </div>
                ) : (
                    <>
                        <CheckCircle2 size={20} />
                        <span>GUARDAR CONFIGURACIÓN</span>
                    </>
                )}
            </button>
        </motion.div>
    );
};

export default ProfileEditForm;
