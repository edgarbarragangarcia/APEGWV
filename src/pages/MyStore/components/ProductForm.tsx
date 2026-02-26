import React from 'react';
import { Camera, CheckCircle2, Ticket, Trash2 } from 'lucide-react';

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
    onChange,
    onSubmit,
    onImageUpload,
    onToggleSize,
    onUpdateSizeQuantity,
    onSyncShoeSizes
}) => {
    const images = [...(formData.images || [])];
    while (images.length < 3) images.push('');

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '16px 16px 16px 20px',
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

    return (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', paddingBottom: '100px', fontFamily: 'var(--font-main)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                {/* Image Upload Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={labelStyle}>Fotos del producto (Máx. 3)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {[0, 1, 2].map((idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1/1',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '20px',
                                    border: `2px ${images[idx] ? 'solid' : 'dashed'} ${images[idx] ? 'var(--secondary)' : 'var(--glass-border)'}`,
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
                                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: '10px', padding: '6px' }} onClick={(e) => {
                                            e.stopPropagation();
                                            const newImages = [...formData.images];
                                            newImages.splice(idx, 1);
                                            onChange({ ...formData, images: newImages, image_url: idx === 0 ? (newImages[0] || '') : formData.image_url });
                                        }}>
                                            <Trash2 size={14} color="#ef4444" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={24} color="var(--text-dim)" opacity={0.5} />
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-dim)', marginTop: '6px' }}>{uploadingImage ? '...' : 'Subir'}</span>
                                    </>
                                )}
                                <input id={`image-upload-${idx}`} type="file" accept="image/*" onChange={(e) => onImageUpload(e, idx)} style={{ display: 'none' }} />
                                {idx === 0 && <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'var(--secondary)', color: 'var(--primary)', fontSize: '8px', fontWeight: '950', padding: '3px 6px', borderRadius: '6px', letterSpacing: '0.05em' }}>PRINCIPAL</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label style={labelStyle}>Nombre del producto</label>
                    <input
                        required
                        value={formData.name}
                        onChange={e => onChange({ ...formData, name: e.target.value })}
                        style={inputStyle}
                        placeholder="Ej: Titleist TSR3 Driver"
                    />
                </div>

                {/* Category and Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={labelStyle}>Categoría</label>
                        <select
                            value={formData.category}
                            onChange={e => onChange({ ...formData, category: e.target.value })}
                            style={inputStyle}
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
                        <label style={labelStyle}>Precio</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                required
                                value={formData.price}
                                onChange={e => onChange({ ...formData, price: e.target.value.replace(/\D/g, '') })}
                                style={{ ...inputStyle, paddingRight: '35px', fontWeight: '900', color: 'var(--secondary)' }}
                                placeholder="Ej: 1.200.000"
                            />
                            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', fontWeight: '900', fontSize: '18px' }}>$</span>
                        </div>
                    </div>
                </div>

                {/* Shipping Cost */}
                <div>
                    <label style={labelStyle}>Costo de Envío</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={formData.shipping_cost}
                            onChange={e => onChange({ ...formData, shipping_cost: e.target.value.replace(/\D/g, '') })}
                            style={inputStyle}
                            placeholder="Ej: 15.000 o 0 si es gratis"
                        />
                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontWeight: '800' }}>$</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', paddingLeft: '4px' }}>Usa 0 para ofrecer **ENVÍO GRATIS**.</p>
                </div>

                {/* Clothing Options */}
                {formData.category === 'Ropa' && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Tipo de Prenda</label>
                            <select
                                value={formData.clothing_type}
                                onChange={e => onChange({ ...formData, clothing_type: e.target.value, size_clothing: '' })}
                                style={inputStyle}
                            >
                                {['Camisa', 'Camiseta', 'Pantalón', 'Short', 'Buso / Chaqueta', 'Gorra', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Tallas disponibles</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {(formData.clothing_type === 'Pantalón' || formData.clothing_type === 'Short' ? ['30', '32', '34', '36', '38', '40'] : ['S', 'M', 'L', 'XL', 'XXL']).map(size => {
                                    const isSelected = !!formData.sizes_inventory.find(s => s.size === size);
                                    return (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => onToggleSize(size)}
                                            style={{
                                                flex: '1 0 60px',
                                                padding: '14px',
                                                borderRadius: '16px',
                                                border: isSelected ? '1px solid var(--secondary)' : '1px solid var(--glass-border)',
                                                background: isSelected ? 'rgba(163, 230, 53, 0.15)' : 'rgba(255,255,255,0.05)',
                                                color: isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.6)',
                                                fontWeight: '900',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontFamily: 'var(--font-main)'
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

                {/* Shoe Options */}
                {formData.category === 'Zapatos' && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={labelStyle}>Talla COL</label>
                                <input
                                    placeholder="40"
                                    value={formData.size_shoes_col}
                                    onChange={e => onSyncShoeSizes(e.target.value, 'col')}
                                    style={{ ...inputStyle, background: 'rgba(163, 230, 53, 0.08)', border: '1px solid var(--secondary)' }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Talla US</label>
                                <input
                                    placeholder="9.5"
                                    value={formData.size_shoes_us}
                                    onChange={e => onSyncShoeSizes(e.target.value, 'us')}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map(size => {
                                const isSelected = !!formData.sizes_inventory.find(s => s.size === size);
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => onToggleSize(size)}
                                        style={{
                                            flex: '1 0 50px',
                                            padding: '14px',
                                            borderRadius: '16px',
                                            border: isSelected ? '1px solid var(--secondary)' : '1px solid var(--glass-border)',
                                            background: isSelected ? 'rgba(163, 230, 53, 0.15)' : 'rgba(255,255,255,0.05)',
                                            color: isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.6)',
                                            fontWeight: '900',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontFamily: 'var(--font-main)'
                                        }}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Inventory Quantities */}
                {formData.sizes_inventory.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '15px', fontWeight: '900', letterSpacing: '0.1em' }}>CANTIDADES REQUERIDAS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {formData.sizes_inventory.map(s => (
                                <div key={s.size} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '16px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>Talla {s.size}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button type="button" onClick={() => onUpdateSizeQuantity(s.size, s.quantity - 1)} style={{ width: '36px', height: '36px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                        <input type="number" readOnly value={s.quantity} style={{ width: '30px', textAlign: 'center', background: 'transparent', border: 'none', color: 'white', fontWeight: '950', fontSize: '16px', outline: 'none' }} />
                                        <button type="button" onClick={() => onUpdateSizeQuantity(s.size, s.quantity + 1)} style={{ width: '36px', height: '36px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--primary)', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div>
                    <label style={labelStyle}>Descripción</label>
                    <textarea
                        value={formData.description}
                        onChange={e => onChange({ ...formData, description: e.target.value })}
                        style={{ ...inputStyle, minHeight: '120px', resize: 'none' }}
                        placeholder="Describe el estado de tu producto..."
                    />
                </div>

                {/* Negotiable Toggle */}
                <div
                    onClick={() => onChange({ ...formData, is_negotiable: !formData.is_negotiable })}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                        borderRadius: '24px',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{ paddingRight: '15px' }}>
                        <p style={{ fontSize: '16px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Precio Negociable</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>Permitir a los compradores enviarte contraofertas por este producto.</p>
                    </div>
                    <div style={{
                        width: '56px',
                        height: '32px',
                        background: formData.is_negotiable ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        flexShrink: 0
                    }}>
                        <div style={{
                            width: '26px',
                            height: '26px',
                            background: formData.is_negotiable ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '3px',
                            left: formData.is_negotiable ? '27px' : '3px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                </div>

                {/* Coupon Selection */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <Ticket size={20} color="var(--secondary)" />
                        <label style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>Cupón de Venta (Opcional)</label>
                    </div>
                    <select
                        value={formData.selectedCouponId}
                        onChange={e => onChange({ ...formData, selectedCouponId: e.target.value })}
                        style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <option value="">Sin cupón aplicado</option>
                        {coupons.map(c => (
                            <option key={c.id} value={c.id}>{c.code} - {c.discount_type === 'percentage' ? `${c.value}% OFF` : `$${c.value.toLocaleString()} OFF`}</option>
                        ))}
                    </select>
                </div>

                {/* Summary Section */}
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
                        <div style={{ padding: '24px', background: 'rgba(163, 230, 53, 0.04)', borderRadius: '24px', border: '1px solid rgba(163, 230, 53, 0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                <span>Precio de venta</span>
                                <span style={{ fontWeight: '800', color: 'white' }}>$ {formatPrice(base.toFixed(0))}</span>
                            </div>
                            {disc > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#ff6b6b', fontWeight: '800' }}>
                                <span>Descuento cupón</span>
                                <span>- $ {formatPrice(disc.toFixed(0))}</span>
                            </div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '13px', color: '#ff6b6b', fontWeight: '800' }}>
                                <span>Comisión Servicio (5%)</span>
                                <span>- $ {formatPrice(comm.toFixed(0))}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '950', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
                                <span style={{ color: 'white' }}>TOTAL A RECIBIR</span>
                                <span style={{ color: 'var(--secondary)', fontSize: '22px' }}>$ {formatPrice(total.toFixed(0))}</span>
                            </div>
                        </div>
                    );
                })()}

                {/* Submit Button */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '24px',
                    background: 'linear-gradient(to top, var(--primary) 70%, transparent)',
                    zIndex: 10
                }}>
                    <button
                        type="submit"
                        disabled={saving || !formData.image_url}
                        className={saving || !formData.image_url ? 'btn-disabled' : 'btn-primary'}
                        style={{ height: '60px', fontSize: '16px' }}
                    >
                        {saving ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="spinner-small" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                <span>GUARDANDO...</span>
                            </div>
                        ) : (
                            <>
                                <CheckCircle2 size={24} />
                                <span>{editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR PRODUCTO'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ProductForm;
