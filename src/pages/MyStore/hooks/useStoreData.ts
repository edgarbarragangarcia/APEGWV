import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../services/SupabaseManager';
import { useAuth } from '../../../context/AuthContext';
import type { Database } from '../../../types/database.types';

export type SellerProfile = Database['public']['Tables']['seller_profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'status' | 'total_amount' | 'tracking_number' | 'shipping_provider' | 'order_number'> & {
    seller_net_amount?: number;
    shipping_address?: string;
    buyer_name?: string;
    buyer_phone?: string;
    product: { name: string; image_url: string | null } | null;
    buyer: { full_name: string | null; id_photo_url: string | null; phone: string | null } | null;
};
export type Offer = Pick<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at' | 'status' | 'offer_amount'> & {
    message?: string;
    buyer_id: string;
    counter_amount?: number;
    counter_message?: string;
    product: { id: string; name: string; image_url: string | null; price: number } | null;
    buyer: { id: string; full_name: string | null; id_photo_url: string | null } | null;
};

export type Coupon = Database['public']['Tables']['coupons']['Row'];

export const useStoreData = () => {
    const { user } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
        isOpen: false,
        productId: null,
        productName: ''
    });
    const [deleteCouponModal, setDeleteCouponModal] = useState<{ isOpen: boolean; couponId: string | null; couponCode: string }>({
        isOpen: false,
        couponId: null,
        couponCode: ''
    });
    const [deleteOfferModal, setDeleteOfferModal] = useState<{ isOpen: boolean; offerId: string | null; productName: string }>({
        isOpen: false,
        offerId: null,
        productName: ''
    });
    const [orders, setOrders] = useState<Order[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scanningOrderId, setScanningOrderId] = useState<string | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
    const [couponFormData, setCouponFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        usage_limit: '',
        min_purchase_amount: '',
        is_active: true
    });

    const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState<SellerProfile | null>(null);
    const [updatingOffer, setUpdatingOffer] = useState<string | null>(null);
    const [showCounterModal, setShowCounterModal] = useState(false);
    const [selectedOfferForCounter, setSelectedOfferForCounter] = useState<Offer | null>(null);
    const [counterAmount, setCounterAmount] = useState('');
    const [counterMessage, setCounterMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'offers' | 'coupons' | 'profile'>('products');
    const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
    const [showOrderEditModal, setShowOrderEditModal] = useState(false);
    const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
    const [orderEditFormData, setOrderEditFormData] = useState({
        order_number: '',
        status: '',
        tracking_number: '',
        shipping_provider: '',
        buyer_name: '',
        buyer_phone: '',
        shipping_address: '',
        seller_net_amount: ''
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });
    const [searchTerm, setSearchTerm] = useState('');



    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '', // Numeric string without formatting
        displayPrice: '', // String with thousand separators for UI
        category: 'Accesorios',
        image_url: '',
        images: [] as string[],
        size_clothing: '',
        clothing_type: 'Camiseta',
        size_shoes_us: '',
        size_shoes_eu: '',
        size_shoes_col: '',
        size_shoes_cm: '',
        brand: '',
        sizes_inventory: [] as { size: string; quantity: number }[],
        condition: 'Nuevo',
        is_negotiable: false,
        selectedCouponId: '',
        shipping_cost: '0',
        displayShippingCost: '0'
    });

    const [brandsList, setBrandsList] = useState<string[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const offerId = params.get('offer_id');
        const orderId = params.get('order_id');

        if (tab && ['products', 'orders', 'offers', 'coupons', 'profile'].includes(tab)) {
            setActiveTab(tab as any);
        } else if (offerId) {
            setActiveTab('offers');
        } else if (orderId) {
            setActiveTab('orders');
        }
    }, [location.search]);

    useEffect(() => {
        setSearchTerm('');
    }, [activeTab]);

    const syncShoeSizes = (value: string, source: 'col' | 'us' | 'eu' | 'cm') => {
        const num = parseFloat(value);
        if (isNaN(num)) {
            setFormData(prev => ({
                ...prev,
                size_shoes_col: source === 'col' ? value : '',
                size_shoes_us: source === 'us' ? value : '',
                size_shoes_eu: source === 'eu' ? value : '',
                size_shoes_cm: source === 'cm' ? value : ''
            }));
            return;
        }

        let col = 0;
        if (source === 'col') col = num;
        else if (source === 'us') col = num + 31;
        else if (source === 'eu') col = num - 2;
        else if (source === 'cm') col = num + 13;

        setFormData(prev => ({
            ...prev,
            size_shoes_col: col.toString(),
            size_shoes_us: (col - 31).toString(),
            size_shoes_eu: (col + 2).toString(),
            size_shoes_cm: (col - 13).toString(),
            // Ensure the source field retains exactly what the user typed (e.g. decimals)
            [`size_shoes_${source}`]: value
        }));
    };

    const formatPrice = (val: string) => {
        const numeric = val.replace(/\D/g, '');
        if (!numeric) return '';
        return new Intl.NumberFormat('es-CO').format(parseInt(numeric));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numeric = val.replace(/\D/g, '');
        setFormData(prev => ({
            ...prev,
            price: numeric,
            displayPrice: formatPrice(numeric)
        }));
    };

    const handleShippingCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numeric = val.replace(/\D/g, '');
        setFormData(prev => ({
            ...prev,
            shipping_cost: numeric,
            displayShippingCost: formatPrice(numeric)
        }));
    };

    const categories = ['Ropa', 'Accesorios', 'Bolas', 'Zapatos', 'Palos', 'Guantes', 'Gorras', 'Otros'];

    const toggleSizeInventory = (size: string) => {
        setFormData(prev => {
            const exists = prev.sizes_inventory.find(s => s.size === size);
            if (exists) {
                return {
                    ...prev,
                    sizes_inventory: prev.sizes_inventory.filter(s => s.size !== size)
                };
            } else {
                return {
                    ...prev,
                    sizes_inventory: [...prev.sizes_inventory, { size, quantity: 1 }]
                };
            }
        });
    };

    const updateSizeQuantity = (size: string, quantity: number) => {
        setFormData(prev => ({
            ...prev,
            sizes_inventory: prev.sizes_inventory.map(s =>
                s.size === size ? { ...s, quantity: Math.max(0, quantity) } : s
            )
        }));
    };

    const handleScanComplete = (trackingNumber: string, provider?: string) => {
        // Option 1: Update modal state if modal is open
        if (showOrderEditModal) {
            setOrderEditFormData(prev => ({
                ...prev,
                tracking_number: trackingNumber,
                shipping_provider: provider || prev.shipping_provider
            }));
        }

        // Option 2: Update legacy DOM elements (keep for compatibility if needed)
        if (scanningOrderId) {
            const trackingInput = document.getElementById(`tracking-${scanningOrderId}`) as HTMLInputElement;
            const providerInput = document.getElementById(`provider-${scanningOrderId}`) as HTMLInputElement;

            if (trackingInput) {
                trackingInput.value = trackingNumber;
                trackingInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (providerInput && provider) {
                providerInput.value = provider;
                providerInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        setShowScanner(false);
        setScanningOrderId(null);
    };

    const fetchOrders = async (userId: string) => {
        console.log('Fetching orders for seller:', userId);
        try {
            const { data: userOrders, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    created_at, 
                    status, 
                    total_amount, 
                    seller_net_amount,
                    shipping_address,
                    buyer_name,
                    buyer_phone,
                    tracking_number, 
                    shipping_provider, 
                    order_number,
                    order_items(
                        product:products(name, image_url)
                    ), 
                    buyer:profiles!orders_buyer_id_fkey(full_name, id_photo_url, phone)
                `)
                .eq('seller_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
                return;
            }

            if (userOrders && userOrders.length > 0) {
                // Normalize relations if they return as arrays
                const mappedOrders: Order[] = userOrders.map((o: any) => ({
                    ...o,
                    product: o.order_items?.[0]?.product || null,
                    buyer: Array.isArray(o.buyer) ? o.buyer[0] : o.buyer
                }));
                setOrders(mappedOrders);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error('Unexpected error in fetchOrders:', err);
        }
    };

    const fetchOffers = async (userId: string) => {
        try {
            const { data: userOffers, error: offersError } = await supabase
                .from('offers')
                .select('id, created_at, status, buyer_id, offer_amount, message, counter_amount, counter_message, product:products(id, name, image_url, price, is_negotiable)')

                .eq('seller_id', userId)
                .order('created_at', { ascending: false });

            if (offersError) {
                console.error('Error fetching offers:', offersError);
                return;
            }

            if (userOffers && userOffers.length > 0) {
                const buyerIds = [...new Set(userOffers.map((o: any) => o.buyer_id))];
                const { data: buyers } = await supabase
                    .from('profiles')
                    .select('id, full_name, id_photo_url')
                    .in('id', buyerIds);


                const buyersMap = new Map(buyers?.map(b => [b.id, b]) || []);

                const enrichedOffers: Offer[] = userOffers.map((offer: any) => ({
                    ...offer,
                    buyer_id: offer.buyer_id,
                    product: Array.isArray(offer.product) ? offer.product[0] : offer.product,
                    buyer: buyersMap.get(offer.buyer_id) || null
                }));

                setOffers(enrichedOffers);
            } else {
                setOffers([]);
            }
        } catch (err) {
            console.error('Error in fetchOffers:', err);
        }
    };

    const fetchCoupons = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('seller_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (err) {
            console.error('Error fetching coupons:', err);
        }
    };
    const fetchStoreData = async () => {
        if (!user) return;

        try {
            // Fetch Seller Profile
            const { data: profile } = await supabase
                .from('seller_profiles' as any)
                .select('*')
                .eq('user_id', user.id)
                .single();

            setSellerProfile(profile as any);
            if (profile) {
                setProfileFormData(profile as any);

                // Fetch User Products
                const { data: userProducts, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('seller_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProducts((userProducts as Product[]) || []);

                // Fetch Orders and Offers initial data
                fetchOrders(user.id);
                fetchOffers(user.id);
                fetchCoupons(user.id);

                const { data: brandsData } = await supabase
                    .from('brands')
                    .select('name')
                    .order('name', { ascending: true });
                if (brandsData) {
                    setBrandsList(brandsData.map(b => b.name));
                }
            }
        } catch (err) {
            console.error('Error fetching store data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStoreData();

            // Handle tab from navigation state or query params
            const params = new URLSearchParams(location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'offers') {
                setActiveTab('offers');
            } else if (tabParam === 'orders') {
                setActiveTab('orders');
            } else if (tabParam === 'products') {
                setActiveTab('products');
            } else if (tabParam === 'profile') {
                setActiveTab('profile');
            }

            // Setup Realtime for Orders & Offers
            const channel = supabase
                .channel(`seller - updates - ${user.id} `)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `seller_id = eq.${user.id} `
                    },
                    () => fetchOrders(user.id)
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'offers',
                        filter: `seller_id=eq.${user.id}`
                    },
                    () => fetchOffers(user.id)
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'coupons',
                        filter: `seller_id=eq.${user.id}`
                    },
                    () => fetchCoupons(user.id)
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setLoading(false); // Done loading (to show auth redirect if needed)
        }
    }, [user]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        const inputElement = e.target;
        if (!file) return;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setFormData(prev => {
                const newImages = [...prev.images];
                newImages[index] = publicUrl;
                return {
                    ...prev,
                    images: newImages,
                    image_url: index === 0 ? publicUrl : (prev.image_url || publicUrl)
                };
            });
        } catch (err) {
            console.error('Error uploading image:', err);
            setSuccessMessage({ title: 'Error', message: 'Error al subir la imagen. Verifica permisos o intenta de nuevo.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setUploading(false);
            if (inputElement) {
                inputElement.value = '';
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Input validation
        if (formData.name.length > 100) {
            setSuccessMessage({ title: 'Validación', message: 'El nombre del producto no puede exceder 100 caracteres', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            return;
        }
        if (formData.description && formData.description.length > 500) {
            setSuccessMessage({ title: 'Validación', message: 'La descripción no puede exceder 500 caracteres', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            return;
        }
        if (parseFloat(formData.price) <= 0) {
            setSuccessMessage({ title: 'Validación', message: 'El precio debe ser mayor a 0', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            return;
        }

        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let result;

            if (editingId) {
                // Update existing product
                result = await supabase
                    .from('products')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        price: parseFloat(formData.price),
                        category: formData.category,
                        image_url: formData.image_url,
                        condition: formData.condition,
                        size_clothing: formData.category === 'Ropa' ? formData.size_clothing : null,
                        size_shoes_us: formData.category === 'Zapatos' ? formData.size_shoes_us : null,
                        size_shoes_eu: formData.category === 'Zapatos' ? formData.size_shoes_eu : null,
                        size_shoes_col: formData.category === 'Zapatos' ? formData.size_shoes_col : null,
                        size_shoes_cm: formData.category === 'Zapatos' ? formData.size_shoes_cm : null,
                        clothing_type: formData.category === 'Ropa' ? formData.clothing_type : null,
                        is_negotiable: formData.is_negotiable,
                        stock_quantity: formData.sizes_inventory.reduce((acc, curr) => acc + curr.quantity, 0),
                        images: formData.images,
                        brand: formData.brand,
                        sizes_inventory: formData.sizes_inventory,
                        shipping_cost: parseFloat(formData.shipping_cost) || 0,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId)
                    .select()
                    .single();
            } else {
                // Insert new product
                result = await supabase
                    .from('products')
                    .insert([{
                        name: formData.name,
                        description: formData.description,
                        price: parseFloat(formData.price),
                        category: formData.category,
                        image_url: formData.image_url,
                        condition: formData.condition,
                        size_clothing: formData.category === 'Ropa' ? formData.size_clothing : null,
                        size_shoes_us: formData.category === 'Zapatos' ? formData.size_shoes_us : null,
                        size_shoes_eu: formData.category === 'Zapatos' ? formData.size_shoes_eu : null,
                        size_shoes_col: formData.category === 'Zapatos' ? formData.size_shoes_col : null,
                        size_shoes_cm: formData.category === 'Zapatos' ? formData.size_shoes_cm : null,
                        clothing_type: formData.category === 'Ropa' ? formData.clothing_type : null,
                        is_negotiable: formData.is_negotiable,
                        seller_id: user.id,
                        stock_quantity: formData.sizes_inventory.reduce((acc, curr) => acc + curr.quantity, 0),
                        brand: formData.brand,
                        sizes_inventory: formData.sizes_inventory,
                        images: formData.images,
                        shipping_cost: parseFloat(formData.shipping_cost) || 0
                    }])
                    .select()
                    .single();
            }

            const { data, error } = result;

            if (error) throw error;

            const productId = data.id;

            // Handle coupon assignment
            // First, clear any coupons previously assigned to this product
            const previouslyAssigned = coupons.filter(c => c.product_id === productId);
            for (const coupon of previouslyAssigned) {
                if (coupon.id !== formData.selectedCouponId) {
                    await supabase
                        .from('coupons')
                        .update({ product_id: null })
                        .eq('id', coupon.id);
                }
            }

            // Then assign the selected coupon to this product
            if (formData.selectedCouponId) {
                await supabase
                    .from('coupons')
                    .update({ product_id: productId })
                    .eq('id', formData.selectedCouponId);
            }

            // Refresh coupons to reflect changes
            if (user) fetchCoupons(user.id);

            // Invalidate marketplace queries to reflect changes
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });

            if (editingId) {
                setProducts(products.map(p => p.id === editingId ? data : p));
            } else {
                setProducts([data, ...products]);
            }

            setShowForm(false);
            resetForm();
        } catch (err) {
            console.error('Error saving product:', err);
            setSuccessMessage({ title: 'Error', message: 'No se pudo guardar el producto.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            displayPrice: '',
            category: 'Accesorios',
            image_url: '',
            size_clothing: '',
            clothing_type: 'Camiseta',
            size_shoes_us: '',
            size_shoes_eu: '',
            size_shoes_col: '',
            size_shoes_cm: '',
            is_negotiable: false,
            selectedCouponId: '',
            images: [],
            brand: '',
            sizes_inventory: [],
            condition: 'Nuevo',
            shipping_cost: '0',
            displayShippingCost: '0'
        });
        setEditingId(null);
    };

    const handleEditClick = (product: Product) => {
        const p = product.price?.toString() || '';
        setFormData({
            name: product.name,
            description: product.description || '',
            price: p,
            displayPrice: formatPrice(p),
            category: product.category || 'Accesorios',
            image_url: product.image_url || '',
            size_clothing: (product as any).size_clothing || '',
            clothing_type: (product as any).clothing_type || 'Camiseta',
            size_shoes_us: (product as any).size_shoes_us || '',
            size_shoes_eu: (product as any).size_shoes_eu || '',
            size_shoes_col: (product as any).size_shoes_col || '',
            size_shoes_cm: (product as any).size_shoes_cm || '',
            is_negotiable: (product as any).is_negotiable || false,
            shipping_cost: product.shipping_cost?.toString() || '0',
            displayShippingCost: formatPrice(product.shipping_cost?.toString() || '0'),
            selectedCouponId: coupons.find(c => c.product_id === product.id)?.id || '',
            images: Array.isArray((product as any).images) ? (product as any).images : (product.image_url ? [product.image_url] : []),
            brand: (product as any).brand || '',
            sizes_inventory: (product as any).sizes_inventory || [],
            condition: (product as any).condition || 'Nuevo'
        });
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleDeleteClick = (product: Product) => {
        setDeleteModal({
            isOpen: true,
            productId: product.id,
            productName: product.name
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.productId) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', deleteModal.productId);

            if (error) throw error;
            setProducts(products.filter(p => p.id !== deleteModal.productId));
            if (navigator.vibrate) navigator.vibrate(50);
            setDeleteModal({ isOpen: false, productId: null, productName: '' });
        } catch (err) {
            console.error('Error deleting product:', err);
            setSuccessMessage({ title: 'Error', message: 'No se pudo eliminar el producto.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrder(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            console.error('Error updating order status:', err);
            setSuccessMessage({ title: 'Error', message: 'Error al actualizar el estado del pedido.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setUpdatingOrder(null);
        }
    };

    const updateTracking = async (orderId: string, trackingNum: string, provider: string) => {
        if (!trackingNum || !provider) {
            setSuccessMessage({ title: 'Faltan datos', message: 'Por favor ingresa transportadora y guía.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            return;
        }
        setUpdatingOrder(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    tracking_number: trackingNum,
                    shipping_provider: provider,
                    status: 'Enviado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;
            setOrders(orders.map(o => o.id === orderId ? { ...o, tracking_number: trackingNum, shipping_provider: provider, status: 'Enviado' } : o));
            setEditingTrackingId(null);
        } catch (err) {
            console.error('Error updating tracking:', err);
            setSuccessMessage({ title: 'Error', message: 'No se pudo actualizar la guía de seguimiento.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setUpdatingOrder(null);
        }
    };

    const handleOrderEditClick = (order: Order) => {
        setSelectedOrderForEdit(order);
        setOrderEditFormData({
            order_number: order.order_number || '',
            status: order.status || '',
            tracking_number: order.tracking_number || '',
            shipping_provider: order.shipping_provider || '',
            buyer_name: order.buyer_name || order.buyer?.full_name || '',
            buyer_phone: order.buyer_phone || order.buyer?.phone || '',
            shipping_address: order.shipping_address || '',
            seller_net_amount: order.seller_net_amount?.toString() || ''
        });
        setShowOrderEditModal(true);
    };

    const handleOrderEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderForEdit) return;

        setUpdatingOrder(selectedOrderForEdit.id);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    order_number: orderEditFormData.order_number,
                    status: orderEditFormData.status,
                    tracking_number: orderEditFormData.tracking_number,
                    shipping_provider: orderEditFormData.shipping_provider,
                    buyer_name: orderEditFormData.buyer_name,
                    buyer_phone: orderEditFormData.buyer_phone,
                    shipping_address: orderEditFormData.shipping_address,
                    seller_net_amount: parseFloat(orderEditFormData.seller_net_amount) || 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedOrderForEdit.id);

            if (error) throw error;

            setOrders(orders.map(o => o.id === selectedOrderForEdit.id ? {
                ...o,
                ...orderEditFormData,
                seller_net_amount: parseFloat(orderEditFormData.seller_net_amount) || 0
            } as Order : o));

            setShowOrderEditModal(false);
            setSuccessMessage({ title: 'Éxito', message: 'Pedido actualizado correctamente', type: 'success' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
        } catch (err) {
            console.error('Error updating order:', err);
            setSuccessMessage({ title: 'Error', message: 'No se pudo actualizar el pedido', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setUpdatingOrder(null);
        }
    };

    const handleOfferAction = async (offerId: string, status: 'accepted' | 'rejected' | 'countered', extraData?: { counter_amount?: number; counter_message?: string }) => {
        setUpdatingOffer(offerId);
        try {
            const offer = offers.find(o => o.id === offerId);
            if (!offer) throw new Error('Oferta no encontrada');

            const updateData: any = {
                status,
                updated_at: new Date().toISOString()
            };

            if (status === 'countered' && extraData) {
                updateData.counter_amount = extraData.counter_amount;
                updateData.counter_message = extraData.counter_message;
            }

            const { error: offerError } = await supabase
                .from('offers')
                .update(updateData)
                .eq('id', offerId);

            if (offerError) throw offerError;

            // If accepted or countered, LOCK the product for 1 hour
            if ((status === 'accepted' || status === 'countered') && offer.product) {
                const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
                const { error: productError } = await supabase
                    .from('products')
                    .update({
                        status: 'negotiating',
                        negotiating_buyer_id: offer.buyer_id,
                        negotiation_expires_at: expiresAt
                    })
                    .eq('id', offer.product.id);

                if (productError) {
                    console.error('Error locking product:', productError);
                }
            }

            // Create notification for buyer
            if (offer.buyer_id) {
                let title = '';
                let message = '';

                if (status === 'accepted') {
                    title = '¡Oferta Aceptada!';
                    message = `El vendedor aceptó tu oferta por ${offer.product?.name}. Tienes 1 hora para completar el pago.`;
                } else if (status === 'countered') {
                    title = 'Nueva Contraoferta';
                    message = `El vendedor hizo una contraoferta de $${extraData?.counter_amount?.toLocaleString()} por ${offer.product?.name}.`;
                } else if (status === 'rejected') {
                    title = 'Oferta Rechazada';
                    message = `El vendedor rechazó tu oferta por ${offer.product?.name}.`;
                }

                if (title) {
                    await supabase.from('notifications').insert({
                        user_id: offer.buyer_id,
                        title,
                        message,
                        type: 'offer_update',
                        link: `/?tab=myorders&offer_id=${offerId}`, // Link to home Compras tab with offer ID
                    });
                }
            }

            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, ...updateData } : o));

            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error('Error updating offer:', err);
            setSuccessMessage({ title: 'Error', message: 'Hubo un problema al procesar la oferta.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setUpdatingOffer(null);
        }
    };

    const deleteOffer = (id: string) => {
        const offer = offers.find(o => o.id === id);
        const productName = offer?.product?.name || 'la oferta';
        setDeleteOfferModal({ isOpen: true, offerId: id, productName });
    };

    const confirmDeleteOffer = async () => {
        if (!deleteOfferModal.offerId) return;

        try {
            const { error } = await supabase
                .from('offers')
                .delete()
                .eq('id', deleteOfferModal.offerId);

            if (error) throw error;
            setOffers(prev => prev.filter(o => o.id !== deleteOfferModal.offerId));
            if (navigator.vibrate) navigator.vibrate(50);
            setDeleteOfferModal({ isOpen: false, offerId: null, productName: '' });
        } catch (err) {
            console.error('Error deleting offer:', err);
            setSuccessMessage({ title: 'Error', message: 'No se pudo eliminar la oferta.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            setDeleteOfferModal({ isOpen: false, offerId: null, productName: '' });
        }
    };
    const handleCouponSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            const dataToSave = {
                code: couponFormData.code.toUpperCase(),
                discount_type: couponFormData.discount_type,
                value: parseFloat(couponFormData.discount_value),
                usage_limit: couponFormData.usage_limit ? parseInt(couponFormData.usage_limit) : null,
                min_purchase_amount: couponFormData.min_purchase_amount ? parseFloat(couponFormData.min_purchase_amount) : 0,
                active: couponFormData.is_active,
                seller_id: user.id
            };

            let error;
            if (editingCouponId) {
                const { error: err } = await supabase
                    .from('coupons')
                    .update(dataToSave)
                    .eq('id', editingCouponId);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('coupons')
                    .insert([dataToSave]);
                error = err;
            }

            if (error) throw error;

            setShowCouponForm(false);
            setEditingCouponId(null);
            setCouponFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                usage_limit: '',
                min_purchase_amount: '',
                is_active: true
            });
            fetchCoupons(user.id);
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error('Error saving coupon:', err);
            setSuccessMessage({ title: 'Error', message: 'No se pudo guardar el cupón.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleEditCoupon = (coupon: Coupon) => {
        setEditingCouponId(coupon.id);
        setCouponFormData({
            code: coupon.code,
            discount_type: coupon.discount_type as 'percentage' | 'fixed',
            discount_value: coupon.value.toString(),
            usage_limit: coupon.usage_limit?.toString() || '',
            min_purchase_amount: coupon.min_purchase_amount?.toString() || '',
            is_active: coupon.active || true
        });
        setShowCouponForm(true);
    };

    const deleteCoupon = (id: string, code: string) => {
        setDeleteCouponModal({ isOpen: true, couponId: id, couponCode: code });
    };

    const confirmDeleteCoupon = async () => {
        if (!deleteCouponModal.couponId) return;
        try {
            const { error } = await supabase.from('coupons').delete().eq('id', deleteCouponModal.couponId);
            if (error) throw error;
            setCoupons(prev => prev.filter(c => c.id !== deleteCouponModal.couponId));
            setDeleteCouponModal({ isOpen: false, couponId: null, couponCode: '' });
            setSuccessMessage({ title: '¡Cupón Eliminado!', message: 'El cupón se ha eliminado correctamente.', type: 'success' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } catch (err) {
            console.error('Error deleting coupon:', err);
            setDeleteCouponModal({ isOpen: false, couponId: null, couponCode: '' });
            setSuccessMessage({ title: 'Error', message: 'No se pudo eliminar el cupón.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        }
    };

    return {
        user,
        loading,
        products,
        sellerProfile,
        showForm, setShowForm,
        saving,
        uploading,
        editingId,
        deleteModal, setDeleteModal,
        deleteCouponModal, setDeleteCouponModal,
        deleteOfferModal, setDeleteOfferModal,
        orders,
        showScanner, setShowScanner,
        scanningOrderId, setScanningOrderId,
        offers,
        coupons,
        showCouponForm, setShowCouponForm,
        editingCouponId, setEditingCouponId,
        couponFormData, setCouponFormData,
        updatingOrder,
        isEditingProfile, setIsEditingProfile,
        profileFormData, setProfileFormData,
        updatingOffer,
        showCounterModal, setShowCounterModal,
        selectedOfferForCounter, setSelectedOfferForCounter,
        counterAmount, setCounterAmount,
        counterMessage, setCounterMessage,
        activeTab, setActiveTab,
        editingTrackingId, setEditingTrackingId,
        showOrderEditModal, setShowOrderEditModal,
        selectedOrderForEdit, setSelectedOrderForEdit,
        orderEditFormData, setOrderEditFormData,
        showSuccessModal, setShowSuccessModal,
        successMessage, setSuccessMessage,
        searchTerm, setSearchTerm,
        formData, setFormData,
        brandsList,
        fetchStoreData,
        syncShoeSizes,
        formatPrice,
        handlePriceChange,
        handleShippingCostChange,
        categories,
        toggleSizeInventory,
        updateSizeQuantity,
        handleScanComplete,
        handleImageUpload,
        handleSubmit,
        resetForm,
        handleEditClick,
        handleDeleteClick,
        confirmDelete,
        updateOrderStatus,
        updateTracking,
        handleOrderEditClick,
        handleOrderEditSubmit,
        handleOfferAction,
        deleteOffer,
        confirmDeleteOffer,
        handleCouponSubmit,
        handleEditCoupon,
        deleteCoupon,
        confirmDeleteCoupon
    };
};
