import React from 'react';
import { Store, Landmark, Info, Loader2, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/Card';

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

    return (
        <Card style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Marketplace</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={formData.store_name || ''}
                            onChange={e => onChange({ ...formData, store_name: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 45px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px' }}
                            placeholder="Ej: Mi Tienda Pro"
                        />
                        <Store size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                </div>

                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información de Identidad</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {formData.entity_type === 'natural' ? (
                            <>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre Completo</label>
                                    <input
                                        value={formData.full_name || ''}
                                        onChange={e => onChange({ ...formData, full_name: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Documento</label>
                                    <input
                                        value={formData.document_number || ''}
                                        onChange={e => onChange({ ...formData, document_number: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Razón Social</label>
                                    <input
                                        value={formData.company_name || ''}
                                        onChange={e => onChange({ ...formData, company_name: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>NIT</label>
                                    <input
                                        value={formData.nit || ''}
                                        onChange={e => onChange({ ...formData, nit: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuenta de Retiros</h4>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Cuenta</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                value={formData.account_number || ''}
                                onChange={e => onChange({ ...formData, account_number: e.target.value })}
                                style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                placeholder="Número de cuenta bancaria"
                            />
                            <Landmark size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Info size={12} />
                            Solo puedes editar el nombre y número de identificación. Para cambios bancarios contacta a soporte.
                        </p>
                    </div>
                </div>

                <button
                    onClick={onSubmit}
                    disabled={saving}
                    style={{
                        marginTop: '10px',
                        width: '100%',
                        background: saving ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)',
                        color: 'var(--primary)',
                        padding: '18px',
                        borderRadius: '20px',
                        fontSize: '15px',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 25px rgba(163, 230, 53, 0.2)',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    {saving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CAMBIOS'}
                </button>
            </div>
        </Card>
    );
};

export default ProfileEditForm;
