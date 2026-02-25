import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingBag, Handshake, Ticket, User } from 'lucide-react';
import { useStoreData } from './hooks/useStoreData';
import { supabase } from '../../services/SupabaseManager';

// Components
import ProductsTab from './tabs/ProductsTab';
import OrdersTab from './tabs/OrdersTab';
import OffersTab from './tabs/OffersTab';
import CouponsTab from './tabs/CouponsTab';
import ProfileTab from './tabs/ProfileTab';

// Modals
import ProductForm from './components/ProductForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import CounterOfferModal from './components/CounterOfferModal';
import OrderEditModal from './components/OrderEditModal';
import SuccessModal from './components/SuccessModal';
import CouponForm from './components/CouponForm';

// Global Components
import TrackingScanner from '../../components/TrackingScanner';
import StoreOnboarding from '../../components/StoreOnboarding';
import Skeleton from '../../components/Skeleton';
import PageHero from '../../components/PageHero';
import PageHeader from '../../components/PageHeader';

const MyStore: React.FC = () => {
    const navigate = useNavigate();
    const store = useStoreData();
    const {
        user, loading, products, sellerProfile, activeTab, setActiveTab,
        showForm, setShowForm, editingId, saving, uploading,
        formData, setFormData, coupons,
        orders, offers, searchTerm, setSearchTerm,
        deleteModal, setDeleteModal, confirmDelete,
        showCounterModal, setShowCounterModal, selectedOfferForCounter, setSelectedOfferForCounter,
        counterAmount, setCounterAmount, counterMessage, setCounterMessage, handleOfferAction,
        showOrderEditModal, setShowOrderEditModal, orderEditFormData, setOrderEditFormData, handleOrderEditSubmit,
        showScanner, setShowScanner, handleScanComplete,
        showCouponForm, setShowCouponForm, editingCouponId, setEditingCouponId, couponFormData, setCouponFormData, handleCouponSubmit,
        deleteCouponModal, setDeleteCouponModal, confirmDeleteCoupon,
        deleteOfferModal, setDeleteOfferModal, confirmDeleteOffer,
        showSuccessModal, setShowSuccessModal, successMessage,
        isEditingProfile, setIsEditingProfile, profileFormData, setProfileFormData, fetchStoreData,
        formatPrice, handleEditClick, handleDeleteClick, resetForm, handleSubmit, handleImageUpload,
        toggleSizeInventory, updateSizeQuantity, syncShoeSizes,
        updateOrderStatus, handleOrderEditClick, handleEditCoupon, deleteCoupon,
        editingTrackingId, setEditingTrackingId, setScanningOrderId
    } = store;

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--primary)', padding: '20px' }}>
                <Skeleton width="100%" height="200px" borderRadius="24px" />
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} width="80px" height="40px" borderRadius="12px" />)}
                </div>
                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} width="100%" height="250px" borderRadius="20px" />)}
                </div>
            </div>
        );
    }

    if (!sellerProfile) {
        return <StoreOnboarding onComplete={fetchStoreData} />;
    }

    const tabs = [
        { id: 'products', label: 'Productos', icon: Package },
        { id: 'orders', label: 'Ventas', icon: ShoppingBag },
        { id: 'offers', label: 'Ofertas', icon: Handshake },
        { id: 'coupons', label: 'Cupones', icon: Ticket },
        { id: 'profile', label: 'Mi Perfil', icon: User }
    ];

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900
        }}>
            <PageHero opacity={0.4} />

            <div style={{
                flexShrink: 0,
                position: 'relative',
                zIndex: 10,
                padding: '0 20px',
                paddingTop: 'var(--header-offset-top)'
            }}>
                <PageHeader
                    title="Mi Tienda"
                    subtitle="Gestiona tus productos y ventas"
                    onBack={() => navigate(-1)}
                    noMargin
                />

                {/* Tabs Navigation */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    width: '100%',
                    marginBottom: '20px',
                    marginTop: '20px',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '6px',
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '10px 0',
                                    borderRadius: '14px',
                                    background: isActive ? 'rgba(163, 230, 53, 0.15)' : 'transparent',
                                    color: isActive ? 'var(--secondary)' : 'rgba(255,255,255,0.5)',
                                    border: '1px solid ' + (isActive ? 'rgba(163, 230, 53, 0.3)' : 'transparent'),
                                    fontWeight: isActive ? '900' : '700',
                                    fontSize: '9px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    fontFamily: 'var(--font-main)'
                                }}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                {tab.label}

                                {tab.id === 'orders' && orders.filter(o => o.status === 'Pendiente').length > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '20px',
                                        height: '20px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        borderRadius: '50%',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        boxShadow: '0 4px 10px rgba(163, 230, 53, 0.4)'
                                    }}>
                                        {orders.filter(o => o.status === 'Pendiente').length}
                                    </span>
                                )}
                                {tab.id === 'offers' && offers.filter(o => o.status === 'pending').length > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '20px',
                                        height: '20px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        borderRadius: '50%',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        boxShadow: '0 4px 10px rgba(163, 230, 53, 0.4)'
                                    }}>
                                        {offers.filter(o => o.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px',
                paddingBottom: '100px'
            }} className="hide-scrollbar">
                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'products' && (
                            <ProductsTab
                                products={products as any}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onToggleStatus={async (id, status) => {
                                    const { error } = await supabase.from('products').update({ status }).eq('id', id);
                                    if (!error) fetchStoreData();
                                }}
                                onAddClick={() => { resetForm(); setShowForm(true); }}
                            />
                        )}
                        {activeTab === 'orders' && (
                            <OrdersTab
                                orders={orders as any}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onEditOrder={handleOrderEditClick}
                                onUpdateStatus={updateOrderStatus}
                                updatingOrder={store.updatingOrder}
                                editingTrackingId={editingTrackingId}
                                onTrackingUpdate={store.updateTracking}
                                onSetScanningOrderId={setScanningOrderId}
                                onShowScanner={setShowScanner}
                                onSetEditingTrackingId={setEditingTrackingId}
                            />
                        )}
                        {activeTab === 'offers' && (
                            <OffersTab
                                offers={offers as any}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onAccept={(id) => handleOfferAction(id, 'accepted')}
                                onReject={(id) => handleOfferAction(id, 'rejected')}
                                onCounter={(offer: any) => {
                                    setSelectedOfferForCounter(offer);
                                    setCounterAmount(offer.offer_amount.toString());
                                    setShowCounterModal(true);
                                }}
                                onDelete={(id) => store.deleteOffer(id)}
                                updatingOffer={store.updatingOffer}
                            />
                        )}
                        {activeTab === 'coupons' && (
                            <CouponsTab
                                coupons={coupons as any}
                                onAdd={() => {
                                    setEditingCouponId(null);
                                    setCouponFormData({ code: '', discount_type: 'percentage', discount_value: '', usage_limit: '', min_purchase_amount: '', is_active: true });
                                    setShowCouponForm(true);
                                }}
                                onEdit={handleEditCoupon}
                                onDelete={deleteCoupon}
                            />
                        )}
                        {activeTab === 'profile' && (
                            <ProfileTab
                                profile={sellerProfile as any}
                                isEditing={isEditingProfile}
                                setIsEditing={setIsEditingProfile}
                                formData={profileFormData as any}
                                setFormData={setProfileFormData as any}
                                onSave={async () => {
                                    if (!profileFormData || !user) return;
                                    const { error } = await supabase.from('seller_profiles').update(profileFormData).eq('user_id', user.id);
                                    if (!error) {
                                        fetchStoreData();
                                        setIsEditingProfile(false);
                                    }
                                }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Modals & Forms */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--primary)',
                    zIndex: 10000,
                    overflowY: 'auto'
                }}>
                    <PageHero opacity={0.4} />
                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        padding: '0 20px',
                        paddingTop: 'var(--header-offset-top)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        <PageHeader
                            title={editingId ? 'Editar Producto' : 'Nuevo Producto'}
                            subtitle="Publica tu producto en el marketplace"
                            onBack={() => setShowForm(false)}
                            noMargin
                        />

                        <div style={{ marginTop: '30px', paddingBottom: '80px' }}>
                            <ProductForm
                                formData={formData as any}
                                editingId={editingId}
                                saving={saving}
                                uploadingImage={uploading}
                                coupons={coupons as any}
                                formatPrice={formatPrice}
                                onClose={() => setShowForm(false)}
                                onChange={setFormData as any}
                                onSubmit={handleSubmit}
                                onImageUpload={handleImageUpload}
                                onToggleSize={toggleSizeInventory}
                                onUpdateSizeQuantity={updateSizeQuantity}
                                onSyncShoeSizes={syncShoeSizes}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showCouponForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '450px' }}>
                        <CouponForm
                            formData={couponFormData as any}
                            editingId={editingCouponId}
                            saving={saving}
                            onClose={() => setShowCouponForm(false)}
                            onChange={setCouponFormData as any}
                            onSubmit={handleCouponSubmit}
                        />
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="¿Eliminar Producto?"
                message={`¿Estás seguro de que quieres eliminar "${deleteModal.productName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                type="danger"
                isLoading={saving}
            />

            <ConfirmationModal
                isOpen={deleteCouponModal.isOpen}
                onClose={() => setDeleteCouponModal({ ...deleteCouponModal, isOpen: false })}
                onConfirm={confirmDeleteCoupon}
                title="¿Eliminar Cupón?"
                message={`¿Estás seguro de que quieres eliminar el cupón "${deleteCouponModal.couponCode}"?`}
                confirmText="Eliminar"
                type="danger"
                isLoading={saving}
            />

            <ConfirmationModal
                isOpen={deleteOfferModal.isOpen}
                onClose={() => setDeleteOfferModal({ ...deleteOfferModal, isOpen: false })}
                onConfirm={confirmDeleteOffer}
                title="¿Eliminar Oferta?"
                message={`¿Estás seguro de que quieres eliminar la oferta de "${deleteOfferModal.productName}"?`}
                confirmText="Eliminar"
                type="danger"
                isLoading={saving}
            />

            <CounterOfferModal
                isOpen={showCounterModal}
                onClose={() => setShowCounterModal(false)}
                onSubmit={() => {
                    if (selectedOfferForCounter) {
                        handleOfferAction(selectedOfferForCounter.id, 'countered', {
                            counter_amount: parseFloat(counterAmount),
                            counter_message: counterMessage
                        });
                        setShowCounterModal(false);
                    }
                }}
                counterAmount={counterAmount}
                onCounterAmountChange={setCounterAmount}
                counterMessage={counterMessage}
                onCounterMessageChange={setCounterMessage}
                updating={!!store.updatingOffer}
                productName={selectedOfferForCounter?.product?.name || ''}
            />

            <OrderEditModal
                isOpen={showOrderEditModal}
                onClose={() => setShowOrderEditModal(false)}
                onSubmit={handleOrderEditSubmit}
                formData={orderEditFormData as any}
                onChange={setOrderEditFormData as any}
                updating={!!store.updatingOrder}
                onOpenScanner={() => setShowScanner(true)}
            />

            <SuccessModal
                isOpen={showSuccessModal}
                title={successMessage.title}
                message={successMessage.message}
                type={successMessage.type}
                onClose={() => setShowSuccessModal(false)}
            />

            {showScanner && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 3000 }}>
                    <TrackingScanner
                        onScanComplete={(trackingNumber, provider) => {
                            handleScanComplete(trackingNumber, provider);
                            setShowScanner(false);
                        }}
                        onClose={() => setShowScanner(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default MyStore;
