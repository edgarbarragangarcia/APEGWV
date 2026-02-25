import { Camera, X, Loader2, CheckCircle2, Ticket, ArrowLeft, Trash2 } from 'lucide-react';

interface SizesInventory {
    size: string;
    quantity: number;
}

interface ProductFormData {
    name: string;
    price: string;
    description: string;
    category: string;
    image_url: string;
    images: string[];
    shipping_cost: string;
    clothing_type: string;
    size_clothing: string;
    size_shoes_col: string;
    size_shoes_us: string;
    size_shoes_eu: string;
    size_shoes_cm: string;
    sizes_inventory: SizesInventory[];
    is_negotiable: boolean;
    selectedCouponId: string;
}

interface ProductFormProps {
    formData: ProductFormData;
    editingId: string | null;
    saving: boolean;
    uploadingImage: boolean;
    coupons: any[];
    formatPrice: (price: string) => string;
    onClose: () => void;
    onChange: (data: ProductFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
    onToggleSize: (size: string) => void;
    onUpdateSizeQuantity: (size: string, qty: number) => void;
    onSyncShoeSizes: (value: string, type: 'col' | 'us' | 'eu' | 'cm') => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
    formData,
    editingId,
    saving,
    uploadingImage,
    coupons,
    formatPrice,
    onClose,
    onChange,
    onSubmit,
    onImageUpload,
    onToggleSize,
    onUpdateSizeQuantity,
    onSyncShoeSizes
}) => {
    // Ensure images array has at least 3 slots for the UI
    const images = [...(formData.images || [])];
    while (images.length < 3) images.push('');

    return (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>
                        {editingId ? 'Editar' : 'Nuevo'} <span style={{ color: 'var(--secondary)' }}>Articulo</span>
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>Publica tu producto en el marketplace</p>
                </div>
                <button type="button" onClick={onClose} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '700' }}>Fotos del producto (Máx. 3)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {[0, 1, 2].map((idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1/1',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px',
                                    border: `2px ${images[idx] ? 'solid' : 'dashed'} ${images[idx] ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onClick={() => document.getElementById(`image-upload-${idx}`)?.click()}
                            >
                                {images[idx] ? (
                                    <>
                                        <img src={images[idx]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Preview ${idx}`} />
                                        <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px' }} onClick={(e) => {
                                            e.stopPropagation();
                                            const newImages = [...formData.images];
                                            newImages.splice(idx, 1);
                                            onChange({ ...formData, images: newImages, image_url: idx === 0 ? (newImages[0] || '') : formData.image_url });
                                        }}>
                                            <Trash2 size={12} color="white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={20} color="var(--text-dim)" />
                                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>{uploadingImage ? '...' : 'Subir'}</span>
                                    </>
                                )}
                                <input id={`image-upload-${idx}`} type="file" accept="image/*" onChange={(e) => onImageUpload(e, idx)} style={{ display: 'none' }} />
                                {idx === 0 && <span style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'var(--secondary)', color: 'var(--primary)', fontSize: '8px', fontWeight: '900', padding: '2px 4px', borderRadius: '4px' }}>PRINCIPAL</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre del producto</label>
                    <input
                        required
                        value={formData.name}
                        onChange={e => onChange({ ...formData, name: e.target.value })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                        placeholder="Ej: Titleist TSR3 Driver"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Categoría</label>
                        <select
                            value={formData.category}
                            onChange={e => onChange({ ...formData, category: e.target.value })}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                        >
                            <option value="Clubs">Palos (Clubs)</option>
                            <option value="Bolas">Bolas</option>
                            <option value="Ropa">Ropa</option>
                            <option value="Zapatos">Zapatos</option>
                            <option value="Accesorios">Accesorios</option>
                            <option value="Bolsas">Bolsas</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Precio</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                required
                                value={formData.price}
                                onChange={e => onChange({ ...formData, price: e.target.value.replace(/\D/g, '') })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', fontWeight: '800' }}
                                placeholder="Ej: 1.200.000"
                            />
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', fontWeight: '800' }}>$</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Costo de Envío</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={formData.shipping_cost}
                            onChange={e => onChange({ ...formData, shipping_cost: e.target.value.replace(/\D/g, '') })}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                            placeholder="Ej: 15.000 o 0 si es gratis"
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '12px' }}>$</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>Poner 0 para **ENVÍO GRATIS**.</p>
                </div>

                {formData.category === 'Ropa' && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tipo de Prenda</label>
                            <select
                                value={formData.clothing_type}
                                onChange={e => onChange({ ...formData, clothing_type: e.target.value, size_clothing: '' })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                            >
                                {['Camisa', 'Camiseta', 'Pantalón', 'Short', 'Buso / Chaqueta', 'Gorra', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tallas y Cantidades</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {(formData.clothing_type === 'Pantalón' || formData.clothing_type === 'Short' ? ['30', '32', '34', '36', '38', '40'] : ['S', 'M', 'L', 'XL', 'XXL']).map(size => {
                                    const isSelected = !!formData.sizes_inventory.find(s => s.size === size);
                                    return (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => onToggleSize(size)}
                                            style={{
                                                flex: '1 0 50px',
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--glass-border)',
                                                background: isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                color: isSelected ? 'var(--primary)' : 'white',
                                                fontWeight: '700'
                                            }}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {formData.category === 'Zapatos' && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '-5px', fontSize: '13px', color: 'var(--text-dim)' }}>Tallas de Calzado (COL)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--secondary)', fontWeight: '800' }}>Talla COL</label>
                                <input
                                    placeholder="40"
                                    value={formData.size_shoes_col}
                                    onChange={e => onSyncShoeSizes(e.target.value, 'col')}
                                    style={{ width: '100%', background: 'rgba(163, 230, 53, 0.1)', border: '1px solid var(--secondary)', borderRadius: '10px', padding: '10px', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>Talla US</label>
                                <input
                                    placeholder="9.5"
                                    value={formData.size_shoes_us}
                                    onChange={e => onSyncShoeSizes(e.target.value, 'us')}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map(size => {
                                const isSelected = !!formData.sizes_inventory.find(s => s.size === size);
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => onToggleSize(size)}
                                        style={{
                                            flex: '1 0 45px',
                                            padding: '10px',
                                            borderRadius: '10px',
                                            border: '1px solid ' + (isSelected ? 'var(--secondary)' : 'var(--glass-border)'),
                                            background: isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                            color: isSelected ? 'var(--primary)' : 'white',
                                            fontWeight: '800'
                                        }}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {formData.sizes_inventory.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px', fontWeight: '800' }}>CANTIDADES POR TALLA</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {formData.sizes_inventory.map(s => (
                                <div key={s.size} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>Talla {s.size}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button type="button" onClick={() => onUpdateSizeQuantity(s.size, s.quantity - 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }}>-</button>
                                        <input type="number" readOnly value={s.quantity} style={{ width: '30px', textAlign: 'center', background: 'transparent', border: 'none', color: 'white', fontWeight: '800' }} />
                                        <button type="button" onClick={() => onUpdateSizeQuantity(s.size, s.quantity + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'white', color: 'var(--primary)' }}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Descripción</label>
                    <textarea
                        value={formData.description}
                        onChange={e => onChange({ ...formData, description: e.target.value })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', minHeight: '80px', resize: 'none' }}
                        placeholder="Descripción y estado del producto..."
                    />
                </div>

                <div
                    onClick={() => onChange({ ...formData, is_negotiable: !formData.is_negotiable })}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                >
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Precio Negociable</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Permitir ofertas de compradores</p>
                    </div>
                    <div style={{ width: '44px', height: '24px', background: formData.is_negotiable ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative' }}>
                        <div style={{ width: '18px', height: '18px', background: formData.is_negotiable ? 'var(--primary)' : 'var(--text-dim)', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.is_negotiable ? '23px' : '3px', transition: 'all 0.3s ease' }} />
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Ticket size={14} color="var(--secondary)" />
                        <label style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>Cupón Exclusivo</label>
                    </div>
                    <select
                        value={formData.selectedCouponId}
                        onChange={e => onChange({ ...formData, selectedCouponId: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }}
                    >
                        <option value="">Sin cupón seleccionado</option>
                        {coupons.map(c => (
                            <option key={c.id} value={c.id}>{c.code} - {c.discount_type === 'percentage' ? `${c.value}% OFF` : `$${c.value.toLocaleString()} OFF`}</option>
                        ))}
                    </select>
                </div>

                {/* Calculation summary */}
                {(formData.price || formData.shipping_cost) && (() => {
                    const coupon = coupons.find(c => c.id === formData.selectedCouponId);
                    const base = parseFloat(formData.price) || 0;
                    const ship = parseFloat(formData.shipping_cost) || 0;
                    let disc = 0;
                    if (coupon) disc = coupon.discount_type === 'percentage' ? Math.round(base * (Number(coupon.value) / 100)) : Number(coupon.value);
                    const discounted = Math.max(0, base - disc);
                    const comm = Math.round(discounted * 0.05);
                    const total = discounted - comm + ship;

                    return (
                        <div className="glass" style={{ padding: '15px', background: 'rgba(163, 230, 53, 0.05)', borderRadius: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: 'var(--text-dim)' }}>
                                <span>Precio base</span>
                                <span>$ {formatPrice(base.toFixed(0))}</span>
                            </div>
                            {disc > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#ef4444', fontWeight: '800' }}>
                                <span>Descuento cupón</span>
                                <span>- $ {formatPrice(disc.toFixed(0))}</span>
                            </div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#ff6b6b' }}>
                                <span>Comisión APEG (5%)</span>
                                <span>- $ {formatPrice(comm.toFixed(0))}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '5px' }}>
                                <span>Recibes en cuenta</span>
                                <span style={{ color: 'var(--secondary)' }}>$ {formatPrice(total.toFixed(0))}</span>
                            </div>
                        </div>
                    );
                })()}

                <button
                    type="submit"
                    disabled={saving || !formData.image_url}
                    style={{ width: '100%', background: (saving || !formData.image_url) ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)', color: 'var(--primary)', padding: '15px', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    {saving ? 'GUARDANDO...' : 'PUBLICAR PRODUCTO'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
