import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Save, Loader2, ArrowLeft, Camera, Trash2, Upload } from 'lucide-react';
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
    }>({
        full_name: '',
        handicap: '',
        federation_code: '',
        id_photo_url: ''
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
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        full_name: data.full_name || '',
                        handicap: data.handicap?.toString() || '',
                        federation_code: data.federation_code || '',
                        id_photo_url: data.id_photo_url || ''
                    });
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
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

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


                <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                    style={{
                        marginTop: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    );
};

export default EditProfile;
