import React, { useEffect, useState } from 'react';
import { supabase, optimizeImage } from '../services/SupabaseManager';
import { Save, Loader2, Camera, Trash2, Upload, MapPin, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';
import AddressModal from '../components/AddressModal';

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });

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
        }
    }, [profile]);

    // Redirect if no user found after fetching tries
    useEffect(() => {
        if (!user && !isFetching) {
            navigate('/auth');
        }
    }, [user, isFetching, navigate]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return; // Check user exists

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`; // Use Date.now() instead of Math.random() for slightly better uniqueness in this context

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, id_photo_url: publicUrl }));

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setSuccessMessage({ title: 'Error', message: 'No se pudo subir la imagen.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setUploading(false);
        }
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
            // No need for window.dispatchEvent, standard ways (context/query) handle this now
            navigate('/profile');
        } catch (error) {
            console.error('Error updating profile:', error);
            setSuccessMessage({ title: 'Error', message: 'No se pudieron guardar los cambios en tu perfil.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (isFetching && !profile) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade" style={styles.pageContainer}>
            <PageHero />
            <div style={styles.headerArea}>
                <PageHeader noMargin title="Editar Perfil" onBack={() => navigate('/profile')} />
            </div>

            <div style={styles.scrollArea}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Photo Section */}
                    <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                        <div style={styles.photoContainer}>
                            <div style={styles.photoFrame}>
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

                            <label style={styles.uploadButton}>
                                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            </label>
                        </div>

                        {formData.id_photo_url && (
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, id_photo_url: '' }))}
                                style={styles.deletePhotoButton}
                            >
                                <Trash2 size={11} /> Eliminar foto
                            </button>
                        )}
                    </div>

                    <FormInput
                        label="Nombre Completo"
                        value={formData.full_name}
                        onChange={v => setFormData(p => ({ ...p, full_name: v }))}
                        required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <FormInput
                            type="number"
                            label="Hándicap"
                            value={formData.handicap}
                            onChange={v => setFormData(p => ({ ...p, handicap: v }))}
                            step="0.1"
                        />
                        <FormInput
                            label="Cód. Federación"
                            value={formData.federation_code}
                            onChange={v => setFormData(p => ({ ...p, federation_code: v }))}
                        />
                    </div>

                    <FormInput
                        type="email"
                        label="Correo Electrónico"
                        value={formData.email}
                        onChange={v => setFormData(p => ({ ...p, email: v }))}
                    />

                    <FormInput
                        type="tel"
                        label="Teléfono Celular"
                        value={formData.phone}
                        onChange={v => setFormData(p => ({ ...p, phone: v }))}
                    />

                    <div className="form-group">
                        <Label text="Dirección de Envío" />
                        <div
                            onClick={() => setIsAddressModalOpen(true)}
                            className="glass"
                            style={styles.addressSelector}
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
                            ...styles.saveButton,
                            opacity: saving ? 0.7 : 1,
                            cursor: saving ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                </form>

                <AddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    currentAddress={formData.address}
                    onConfirm={(addr) => setFormData(p => ({ ...p, address: addr }))}
                />
            </div>

            <AnimatePresence>
                {showSuccessModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            style={{
                                background: 'rgba(30, 45, 30, 0.95)',
                                borderRadius: '30px',
                                padding: '40px 30px',
                                textAlign: 'center',
                                maxWidth: '85%',
                                width: '320px',
                                border: `1px solid ${successMessage.type === 'success' ? 'rgba(163, 230, 53, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}
                        >
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: successMessage.type === 'success' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: successMessage.type === 'success' ? 'var(--secondary)' : '#ef4444'
                            }}>
                                {successMessage.type === 'success' ? <CheckCircle2 size={40} /> : <X size={40} />}
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '10px' }}>
                                {successMessage.title}
                            </h2>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                                {successMessage.message}
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Helpers & Styles ---

const Label = ({ text }: { text: string }) => (
    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {text}
    </label>
);

interface FormInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    step?: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text', required, step }) => (
    <div className="form-group">
        <Label text={label} />
        <input
            type={type}
            step={step}
            className="glass"
            style={styles.input}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={required}
        />
    </div>
);


const styles = {
    pageContainer: {
        position: 'fixed' as 'fixed', inset: 0,
        background: 'var(--primary)',
        display: 'flex', flexDirection: 'column' as 'column',
        overflow: 'hidden', zIndex: 900,
        paddingTop: 'var(--header-offset-top)'
    },
    headerArea: {
        flexShrink: 0,
        position: 'relative' as 'relative',
        zIndex: 10,
        background: 'transparent',
        padding: '0 20px'
    },
    scrollArea: {
        flex: 1,
        position: 'relative' as 'relative',
        zIndex: 10,
        overflowY: 'auto' as 'auto',
        padding: '0 20px 120px 20px',
        display: 'flex', flexDirection: 'column' as 'column',
        gap: '12px', WebkitOverflowScrolling: 'touch' as 'touch'
    },
    photoContainer: {
        position: 'relative' as 'relative', width: '90px', height: '90px', margin: '0 auto 10px'
    },
    photoFrame: {
        width: '100%', height: '100%', borderRadius: '25px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    },
    uploadButton: {
        position: 'absolute' as 'absolute', bottom: '-8px', right: '-8px',
        padding: '8px', borderRadius: '12px',
        background: 'var(--secondary)', color: 'var(--primary)',
        cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    deletePhotoButton: {
        fontSize: '11px', color: '#ff6b6b', display: 'flex',
        alignItems: 'center', gap: '4px', margin: '0 auto',
        background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer'
    },
    input: {
        width: '100%', padding: '12px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        color: 'white', background: 'rgba(255,255,255,0.03)',
        fontSize: '14px'
    },
    addressSelector: {
        width: '100%', padding: '12px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        color: 'white', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)'
    },
    saveButton: {
        marginTop: '15px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px', padding: '16px',
        borderRadius: '14px', background: 'var(--secondary)',
        color: 'var(--primary)', border: 'none', fontWeight: '900',
        fontSize: '15px', boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)',
        width: '100%', letterSpacing: '0.5px'
    }
};

export default EditProfile;


