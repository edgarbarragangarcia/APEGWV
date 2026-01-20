import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Save, Loader2, ArrowLeft, Camera, Trash2, Upload, MapPin, X, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';




const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState<{
        full_name: string;
        handicap: string;
        federation_code: string;
        id_photo_url: string;
        email: string;
        phone: string;
        address: string;
    }>({
        full_name: '',
        handicap: '',
        federation_code: '',
        id_photo_url: '',
        email: '',
        phone: '',
        address: ''
    });

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    // Draft address for the modal
    const [addressDetails, setAddressDetails] = useState({
        street: '',
        city: '',
        dept: '',
        zip: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/auth');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error) throw error;
                if (data) {
                    setFormData({
                        full_name: data.full_name || '',
                        handicap: data.handicap?.toString() || '',
                        federation_code: data.federation_code || '',
                        id_photo_url: data.id_photo_url || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        address: data.address || ''
                    });

                    // Parse address if it exists to pre-fill modal
                    if (data.address) {
                        const parts = data.address.split(',').map((p: string) => p.trim());
                        setAddressDetails({
                            street: parts[0] || '',
                            city: parts[1] || '',
                            dept: parts[2] || '',
                            zip: parts[3] || ''
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const updates = {
                id: session.user.id,
                full_name: formData.full_name,
                handicap: formData.handicap ? parseFloat(formData.handicap) : null,
                federation_code: formData.federation_code,
                id_photo_url: formData.id_photo_url,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

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

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '24px', margin: 0 }}>Editar Perfil</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Foto de Perfil Section */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 15px' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '30px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {formData.id_photo_url ? (
                                <img
                                    src={formData.id_photo_url}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Camera size={40} color="var(--text-dim)" />
                            )}
                        </div>

                        <label
                            className="flex-center"
                            style={{
                                position: 'absolute',
                                bottom: '-10px',
                                right: '-10px',
                                padding: '10px',
                                borderRadius: '15px',
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}
                        >
                            <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        </label>
                    </div>

                    {formData.id_photo_url && (
                        <button
                            type="button"
                            onClick={handleDeletePhoto}
                            style={{ fontSize: '12px', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}
                        >
                            <Trash2 size={12} /> Eliminar foto
                        </button>
                    )}
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                        Nombre Completo
                    </label>
                    <input
                        type="text"
                        className="glass"
                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                        Hándicap
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        className="glass"
                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                        value={formData.handicap}
                        onChange={e => setFormData({ ...formData, handicap: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                        Código Federación
                    </label>
                    <input
                        type="text"
                        className="glass"
                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                        value={formData.federation_code}
                        onChange={e => setFormData({ ...formData, federation_code: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        className="glass"
                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                        Teléfono Celular
                    </label>
                    <input
                        type="tel"
                        className="glass"
                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                        Dirección de Envío
                    </label>
                    <div
                        onClick={() => setIsAddressModalOpen(true)}
                        className="glass"
                        style={{
                            width: '100%',
                            padding: '15px',
                            borderRadius: '12px',
                            border: 'none',
                            color: formData.address ? 'var(--text)' : 'var(--text-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={18} color={formData.address ? 'var(--secondary)' : 'var(--text-dim)'} />
                            <span style={{ fontSize: '15px' }}>
                                {formData.address || 'Ingresa tu dirección'}
                            </span>
                        </div>
                        <ChevronRight size={16} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
                    </div>
                </div>


                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        marginTop: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '18px',
                        borderRadius: '16px',
                        background: 'var(--secondary)',
                        color: 'var(--primary)',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '16px',
                        boxShadow: '0 4px 15px rgba(163, 230, 53, 0.3)',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        width: '100%'
                    }}
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
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
                                backdropFilter: 'blur(5px)',
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
                                borderRadius: '30px 30px 0 0',
                                padding: '30px',
                                paddingBottom: 'calc(var(--safe-bottom) + 30px)',
                                zIndex: 2001,
                                maxWidth: 'var(--app-max-width)',
                                margin: '0 auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '900' }}>Detalles de Dirección</h2>
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
                                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)', background: 'rgba(255,255,255,0.05)' }}
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
                                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)', background: 'rgba(255,255,255,0.05)' }}
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
                                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)', background: 'rgba(255,255,255,0.05)' }}
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
                                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)', background: 'rgba(255,255,255,0.05)' }}
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
                                        gap: '10px'
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
    );
};

export default EditProfile;
