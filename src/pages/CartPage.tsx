import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Trash2,
    Package, ShieldCheck, Ticket, CheckCircle2, XCircle
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import PageHero from '../components/PageHero';

const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, totalAmount, totalItems } = useCart();
    const { user } = useAuth();

    // Coupon State
    const [couponCode, setCouponCode] = React.useState('');
    const [appliedDiscount, setAppliedDiscount] = React.useState(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
    const [couponError, setCouponError] = React.useState<string | null>(null);
    const [couponSuccess, setCouponSuccess] = React.useState<string | null>(null);

    const handleApplyCoupon = () => {
        setIsApplyingCoupon(true);
        setCouponError(null);
        setCouponSuccess(null);

        // Simulate API delay
        setTimeout(() => {
            const code = couponCode.toUpperCase().trim();
            if (code === 'APEG10') {
                setAppliedDiscount(10);
                setCouponSuccess('¡Cupón APEG10 aplicado con éxito! (10% de descuento)');
                setCouponCode('');
            } else if (code === 'BIENVENIDO') {
                setAppliedDiscount(15);
                setCouponSuccess('¡Cupón BIENVENIDO aplicado con éxito! (15% de descuento)');
                setCouponCode('');
            } else {
                setCouponError('El cupón ingresado no es válido o ha expirado.');
                setAppliedDiscount(0);
            }
            setIsApplyingCoupon(false);
        }, 800);
    };

    const discountAmount = (totalAmount * appliedDiscount) / 100;
    const finalTotal = totalAmount - discountAmount;

    const handleCheckout = () => {
        if (!user) {
            alert('Por favor, inicia sesión para realizar el pedido.');
            navigate('/auth');
            return;
        }

        if (cartItems.length === 0) return;
        navigate('/checkout');
    };

    if (cartItems.length === 0) {
        return (
            <div className="animate-fade" style={styles.pageContainer}>
                <PageHero image="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" />
                <div style={styles.headerContainer}>
                    <PageHeader noMargin title="Mi Carrito" />
                </div>
                <div style={styles.scrollContainer}>
                    <EmptyCartView onNavigate={() => navigate('/')} />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade" style={styles.pageContainer}>
            <PageHero image="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" />
            <div style={styles.headerContainer}>
                <PageHeader noMargin title="Mi Carrito" />
            </div>

            <div style={styles.scrollContainer}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeFromCart}
                            />
                        ))}
                    </div>

                    {/* Summary Card */}
                    <OrderSummary
                        totalItems={totalItems}
                        totalAmount={totalAmount}
                        discountAmount={discountAmount}
                        appliedDiscount={appliedDiscount}
                        finalTotal={finalTotal}
                        couponCode={couponCode}
                        setCouponCode={setCouponCode}
                        onApplyCoupon={handleApplyCoupon}
                        isApplyingCoupon={isApplyingCoupon}
                        couponError={couponError}
                        couponSuccess={couponSuccess}
                        onCheckout={handleCheckout}
                    />

                    {/* Policy area */}
                    <div style={{ padding: '20px 0', opacity: 0.6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <Package size={16} color="var(--secondary)" />
                            <span style={{ fontSize: '12px', fontWeight: '700' }}>POLÍTICA DE DEVOLUCIÓN</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                            Aceptamos devoluciones en las primeras 48 horas tras la entrega si el producto no coincide con la descripción. El producto debe estar en el mismo estado en que se recibió.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const EmptyCartView = ({ onNavigate }: { onNavigate: () => void }) => (
    <div style={styles.emptyContainer}>
        <div style={styles.emptyIconCircle}>
            <ShoppingBag size={48} strokeWidth={1} />
        </div>
        <p style={{ fontSize: '18px', fontWeight: '600' }}>El carrito está vacío</p>
        <p style={{ fontSize: '14px', marginTop: '5px' }}>¿Qué tal si buscas algo nuevo?</p>
        <button onClick={onNavigate} style={styles.catalogButton}>
            Ver Catálogo
        </button>
    </div>
);

const CartItem = ({ item, onUpdateQuantity, onRemove }: { item: any, onUpdateQuantity: (id: string, q: number) => void, onRemove: (id: string) => void }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
    >
        <Card style={{ padding: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden' }}>
                    <img
                        src={item.image_url}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', lineHeight: '1.2' }}>{item.name}</h4>
                        <p style={{ fontWeight: '800', color: 'var(--secondary)', fontSize: '15px', marginTop: '4px' }}>
                            $ {new Intl.NumberFormat('es-CO').format(item.price)}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{item.category}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '5px' }}>
                        <div style={styles.quantityControl}>
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                style={styles.quantityButton}
                            >
                                -
                            </button>
                            <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '800', fontSize: '13px' }}>
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                style={styles.quantityButton}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(item.id)}
                    style={styles.removeButton}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </Card>
    </motion.div>
);

const OrderSummary = ({
    totalItems,
    totalAmount,
    discountAmount,
    appliedDiscount,
    finalTotal,
    couponCode,
    setCouponCode,
    onApplyCoupon,
    isApplyingCoupon,
    couponError,
    couponSuccess,
    onCheckout
}: {
    totalItems: number,
    totalAmount: number,
    discountAmount: number,
    appliedDiscount: number,
    finalTotal: number,
    couponCode: string,
    setCouponCode: (c: string) => void,
    onApplyCoupon: () => void,
    isApplyingCoupon: boolean,
    couponError: string | null,
    couponSuccess: string | null,
    onCheckout: () => void
}) => (
    <Card style={{ padding: '25px', marginTop: '20px', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Resumen del canje</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-dim)' }}>
                <span>Productos ({totalItems})</span>
                <span style={{ color: 'white' }}>$ {new Intl.NumberFormat('es-CO').format(totalAmount)}</span>
            </div>

            {appliedDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--secondary)', fontWeight: '700' }}>
                    <span>Descuento ({appliedDiscount}%)</span>
                    <span>- $ {new Intl.NumberFormat('es-CO').format(discountAmount)}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-dim)' }}>
                <span>Gastos de envío</span>
                <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>GRATIS</span>
            </div>

            {/* Coupon Input Section */}
            <div style={{ marginTop: '5px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '0 15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: couponError ? '1px solid #ef4444' : (couponSuccess ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)')
                    }}>
                        <Ticket size={16} color="var(--text-dim)" />
                        <input
                            type="text"
                            placeholder="Código de cupón"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                width: '100%',
                                padding: '12px 0',
                                outline: 'none',
                                fontSize: '13px'
                            }}
                        />
                    </div>
                    <button
                        onClick={onApplyCoupon}
                        disabled={!couponCode || isApplyingCoupon}
                        style={{
                            padding: '0 20px',
                            borderRadius: '12px',
                            background: isApplyingCoupon ? 'rgba(163, 230, 53, 0.2)' : 'var(--secondary)',
                            color: 'var(--primary)',
                            fontWeight: '800',
                            fontSize: '13px',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: (!couponCode || isApplyingCoupon) ? 0.5 : 1
                        }}
                    >
                        {isApplyingCoupon ? '...' : 'Aplicar'}
                    </button>
                </div>

                {couponError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', color: '#ef4444', fontSize: '11px' }}>
                        <XCircle size={12} /> {couponError}
                    </div>
                )}
                {couponSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', color: 'var(--secondary)', fontSize: '11px' }}>
                        <CheckCircle2 size={12} /> {couponSuccess}
                    </div>
                )}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '19px', fontWeight: '900' }}>
                <span>Total a pagar</span>
                <span style={{ color: 'var(--secondary)' }}>$ {new Intl.NumberFormat('es-CO').format(finalTotal)}</span>
            </div>
        </div>

        <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="glass" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(163, 230, 53, 0.05)' }}>
                <ShieldCheck size={20} color="var(--secondary)" />
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.3' }}>
                    Tu pago está protegido por <strong>Garantía APEG</strong>.
                </p>
            </div>

            <button onClick={onCheckout} style={styles.checkoutButton}>
                <ShoppingBag size={20} />
                PROCEDER AL PAGO
            </button>
        </div>
    </Card>
);

// --- Styles ---

const styles = {
    pageContainer: {
        position: 'absolute' as 'absolute',
        top: '0', left: '0', right: '0', bottom: '0',
        width: '100%', maxWidth: 'var(--app-max-width)',
        margin: '0 auto', overflow: 'hidden'
    },
    headerContainer: {
        position: 'absolute' as 'absolute',
        top: 'var(--header-offset-top)',
        left: '0', right: '0', width: '100%',
        zIndex: 900, background: 'transparent',
        paddingLeft: '20px', paddingRight: '20px',
        pointerEvents: 'auto' as 'auto'
    },
    scrollContainer: {
        position: 'absolute' as 'absolute',
        top: 'calc(var(--header-offset-top) + 78px)',
        left: '0', right: '0', bottom: 'calc(var(--nav-height) + 20px)',
        overflowY: 'auto' as 'auto',
        padding: '0 20px 20px 20px',
        overflowX: 'hidden' as 'hidden'
    },
    emptyContainer: {
        display: 'flex', flexDirection: 'column' as 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 20px', textAlign: 'center' as 'center',
        opacity: 0.5
    },
    emptyIconCircle: {
        width: '100px', height: '100px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px'
    },
    catalogButton: {
        marginTop: '25px', color: 'var(--secondary)',
        fontWeight: '700', background: 'rgba(163, 230, 53, 0.1)',
        padding: '12px 25px', borderRadius: '12px',
        border: '1px solid var(--secondary)'
    },
    quantityControl: {
        display: 'flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px', padding: '2px'
    },
    quantityButton: {
        border: 'none', background: 'none',
        color: 'white', padding: '4px 8px', fontSize: '16px'
    },
    removeButton: {
        border: 'none', background: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444', padding: '10px',
        borderRadius: '12px', alignSelf: 'flex-start'
    },
    checkoutButton: {
        width: '100%', background: 'var(--secondary)',
        color: 'var(--primary)', padding: '18px',
        borderRadius: '18px', fontWeight: '900',
        fontSize: '16px', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        gap: '12px', border: 'none',
        boxShadow: '0 8px 30px rgba(163, 230, 53, 0.3)',
        marginTop: '10px'
    }
};

export default CartPage;

