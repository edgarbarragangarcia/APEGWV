import React, { useEffect, useState } from 'react';
import { supabase, optimizeImage } from '../services/SupabaseManager';
import { Save, Loader2, Camera, Trash2, Upload, MapPin, X, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';




import PageHeader from '../components/PageHeader';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';

const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: profile, isLoading: isFetching } = useProfile();
    const updateProfile = useUpdateProfile();

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        handicap: '',
        federation_code: '',
        id_photo_url: '',
        email: '',
        phone: '',
        address: ''
    });

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressDetails, setAddressDetails] = useState({
        street: '',
        city: '',
        dept: '',
        zip: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                handicap: profile.handicap?.toString() || '',
                federation_code: profile.federation_code || '',
                id_photo_url: profile.id_photo_url || '',
                email: profile.email || '',
                phone: profile.phone || '',
                address: profile.address || ''
            });

            if (profile.address) {
                const parts = profile.address.split(',').map((p: string) => p.trim());
                setAddressDetails({
                    street: parts[0] || '',
                    city: parts[1] || '',
                    dept: parts[2] || '',
                    zip: parts[3] || ''
                });
            }
        }
    }, [profile]);

    useEffect(() => {
        if (!user && !isFetching) {
            navigate('/auth');
        }
    }, [user, isFetching, navigate]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const fileExt = file.name.split('.').pop();
            const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

            // 1. Subir el archivo
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Obtener la URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, id_photo_url: publicUrl }));

        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = () => {
        setFormData(prev => ({ ...prev, id_photo_url: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updates = {
                full_name: formData.full_name,
                handicap: formData.handicap ? parseFloat(formData.handicap) : null,
                federation_code: formData.federation_code,
                id_photo_url: formData.id_photo_url,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                updated_at: new Date().toISOString(),
            };

            await updateProfile(updates);

            // Notificar a otros componentes (como el Navbar) que el perfil cambió
            window.dispatchEvent(new Event('profile-updated'));

            navigate('/profile');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    if (isFetching && !profile) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900,
            paddingTop: 'var(--header-offset-top)'
        }}>
            <div style={{ flexShrink: 0, zIndex: 10, background: 'var(--primary)', padding: '0 20px' }}>
                <PageHeader noMargin title="Editar Perfil" onBack={() => navigate('/profile')} />
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px 120px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                WebkitOverflowScrolling: 'touch'
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Foto de Perfil Section */}
                    <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 10px' }}> {/* Smaller photo */}
                            <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '25px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {formData.id_photo_url ? (
                                    <img
                                        src={optimizeImage(formData.id_photo_url, { width: 180, height: 180 })}
                                        alt="Profile"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Camera size={32} color="var(--text-dim)" />
                                )}
                            </div>

                            <label
                                className="flex-center"
                                style={{
                                    position: 'absolute',
                                    bottom: '-8px',
                                    right: '-8px',
                                    padding: '8px',
                                    borderRadius: '12px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                    zIndex: 5
                                }}
                            >
                                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            </label>
                        </div>

                        {formData.id_photo_url && (
                            <button
                                type="button"
                                onClick={handleDeletePhoto}
                                style={{
                                    fontSize: '11px',
                                    color: '#ff6b6b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    margin: '0 auto',
                                    background: 'none',
                                    border: 'none',
                                    fontWeight: '600'
                                }}
                            >
                                <Trash2 size={11} /> Eliminar foto
                            </button>
                        )}
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'white',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '14px'
                            }}
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Hándicap
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                className="glass"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    color: 'white',
                                    background: 'rgba(255,255,255,0.03)',
                                    fontSize: '14px'
                                }}
                                value={formData.handicap}
                                onChange={e => setFormData({ ...formData, handicap: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Cód. Federación
                            </label>
                            <input
                                type="text"
                                className="glass"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    color: 'white',
                                    background: 'rgba(255,255,255,0.03)',
                                    fontSize: '14px'
                                }}
                                value={formData.federation_code}
                                onChange={e => setFormData({ ...formData, federation_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'white',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '14px'
                            }}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Teléfono Celular
                        </label>
                        <input
                            type="tel"
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'white',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '14px'
                            }}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Dirección de Envío
                        </label>
                        <div
                            onClick={() => setIsAddressModalOpen(true)}
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: formData.address ? 'white' : 'var(--text-dim)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.03)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                <MapPin size={16} color={formData.address ? 'var(--secondary)' : 'var(--text-dim)'} />
                                <span style={{ fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {formData.address || 'Ingresa tu dirección'}
                                </span>
                            </div>
                            <ChevronRight size={14} color="var(--secondary)" />
                        </div>
                    </div>


                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            marginTop: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '16px',
                            borderRadius: '14px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            border: 'none',
                            fontWeight: '900',
                            fontSize: '15px',
                            boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            width: '100%',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                </form>

                {/* Address Modal */}
                <AnimatePresence>
                    {isAddressModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAddressModalOpen(false)}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(10px)',
                                    zIndex: 2000
                                }}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{
                                    position: 'fixed',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'var(--primary)',
                                    borderTop: '1px solid rgba(163, 230, 53, 0.3)',
                                    borderRadius: '32px 32px 0 0',
                                    padding: '30px',
                                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 30px)',
                                    zIndex: 2001,
                                    maxWidth: 'var(--app-max-width)',
                                    margin: '0 auto'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>
                                        Detalles <span style={{ color: 'var(--secondary)' }}>de</span> Dirección
                                    </h2>
                                    <button onClick={() => setIsAddressModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}>
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Calle / Carrera / Apto</label>
                                        <input
                                            type="text"
                                            className="glass"
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '15px' }}
                                            value={addressDetails.street}
                                            onChange={e => setAddressDetails({ ...addressDetails, street: e.target.value })}
                                            placeholder="Ej: Calle 100 #15-30 Apto 402"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Ciudad</label>
                                            <input
                                                type="text"
                                                className="glass"
                                                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '15px' }}
                                                value={addressDetails.city}
                                                onChange={e => setAddressDetails({ ...addressDetails, city: e.target.value })}
                                                placeholder="Bogotá"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Departamento</label>
                                            <input
                                                type="text"
                                                className="glass"
                                                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '15px' }}
                                                value={addressDetails.dept}
                                                onChange={e => setAddressDetails({ ...addressDetails, dept: e.target.value })}
                                                placeholder="Cundinamarca"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Código Postal</label>
                                        <input
                                            type="text"
                                            className="glass"
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '15px' }}
                                            value={addressDetails.zip}
                                            onChange={e => setAddressDetails({ ...addressDetails, zip: e.target.value })}
                                            placeholder="110111"
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            const fullAddress = [addressDetails.street, addressDetails.city, addressDetails.dept, addressDetails.zip]
                                                .filter(Boolean)
                                                .join(', ');
                                            setFormData({ ...formData, address: fullAddress });
                                            setIsAddressModalOpen(false);
                                        }}
                                        style={{
                                            marginTop: '15px',
                                            background: 'var(--secondary)',
                                            color: 'var(--primary)',
                                            padding: '18px',
                                            borderRadius: '16px',
                                            fontWeight: '900',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        <Check size={20} />
                                        CONFIRMAR DIRECCIÓN
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
export default EditProfile;

