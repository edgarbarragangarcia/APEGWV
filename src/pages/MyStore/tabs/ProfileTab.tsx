import React from 'react';
import { Pencil, Store, User, Landmark } from 'lucide-react';
import Card from '../../../components/Card';
import ProfileEditForm from '../components/ProfileEditForm';

import type { SellerProfile } from '../hooks/useStoreData';

interface ProfileTabProps {
    profile: SellerProfile | null;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;
    formData: SellerProfile | null;
    setFormData: (data: SellerProfile) => void;
    onSave: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
    profile,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    onSave
}) => {
    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                    Perfil <span style={{ color: 'var(--secondary)' }}>Marketplace</span>
                </h2>
                {isEditing && (
                    <button
                        onClick={() => setIsEditing(false)}
                        style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {!isEditing ? (
                    <Card style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ background: 'linear-gradient(135deg, var(--secondary), #7cc42b)', borderRadius: '20px', padding: '18px', color: 'var(--primary)', boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)' }}>
                                <Store size={36} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em' }}>{profile?.store_name || 'Mi Tienda'}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--secondary)',
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        fontWeight: '900',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {profile?.company_name ? 'Persona Jurídica' : 'Persona Natural'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '900', marginBottom: '18px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                    <User size={14} /> Datos de Identidad
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Nombre del Titular</span>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{profile?.account_holder_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Documento</span>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{profile?.account_holder_document}</span>
                                    </div>
                                    {profile?.company_name && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Empresa</span>
                                            <span style={{ fontWeight: '700', fontSize: '14px' }}>{profile?.company_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '900', marginBottom: '18px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                    <Landmark size={14} /> Información Bancaria
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Banco</span>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{profile?.bank_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Tipo de Cuenta</span>
                                        <span style={{ fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>{profile?.account_type}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Número de Cuenta</span>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>•••• {profile?.account_number?.slice(-4) || '****'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            style={{ marginTop: '30px', width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '18px', borderRadius: '20px', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <Pencil size={18} /> EDITAR MI Marketplace
                        </button>
                    </Card>
                ) : (
                    <ProfileEditForm
                        formData={formData as any}
                        saving={false}
                        onChange={setFormData as any}
                        onSubmit={() => onSave()}
                    />
                )}
            </div>
        </div>
    );
};

export default ProfileTab;
