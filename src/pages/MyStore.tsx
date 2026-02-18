import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { supabase, optimizeImage } from '../services/SupabaseManager';
import {
    Plus, Package, Trash2,
    Camera, Loader2, CheckCircle2, X, Store, Pencil, Landmark,
    Truck, TrendingDown, Calendar, User, Phone, MapPin, Handshake, Info, Settings, Ticket, Percent, ArrowLeft
} from 'lucide-react';

import TrackingScanner from '../components/TrackingScanner';
import Card from '../components/Card';
import StoreOnboarding from '../components/StoreOnboarding';
import Skeleton from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import { useAuth } from '../context/AuthContext';

import type { Database } from '../types/database.types';

type SellerProfile = Database['public']['Tables']['seller_profiles']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Order = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'status' | 'total_amount' | 'tracking_number' | 'shipping_provider' | 'order_number'> & {
    seller_net_amount?: number;
    shipping_address?: string;
    buyer_name?: string;
    buyer_phone?: string;
    product: { name: string; image_url: string | null } | null;
    buyer: { full_name: string | null; id_photo_url: string | null; phone: string | null } | null;
};
type Offer = Pick<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at' | 'status' | 'offer_amount'> & {
    message?: string;
    buyer_id: string;
    counter_amount?: number;
    counter_message?: string;
    product: { id: string; name: string; image_url: string | null; price: number } | null;
    buyer: { id: string; full_name: string | null; id_photo_url: string | null } | null;
};

type Coupon = Database['public']['Tables']['coupons']['Row'];


const MyStore: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
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
                .select('id, created_at, status, buyer_id, offer_amount, message, counter_amount, counter_message, product:products(id, name, image_url, price)')

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
            setSuccessMessage({ title: 'Error', message: 'Error al subir la imagen', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } finally {
            setUploading(false);
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
                        link: '/?tab=myorders', // Link to home Compras tab
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

    const deleteOffer = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta oferta?')) return;

        try {
            const { error } = await supabase
                .from('offers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setOffers(prev => prev.filter(o => o.id !== id));
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error('Error deleting offer:', err);
            setSuccessMessage({ title: 'Error', message: 'No se pudo eliminar la oferta.', type: 'error' });
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
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

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '80vh' }}>
                <Loader2 className="animate-spin" color="var(--secondary)" size={32} />
            </div>
        );
    }



    if (!sellerProfile) {
        return <StoreOnboarding onComplete={() => fetchStoreData()} />;
    }



    return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden',
            zIndex: 500
        }} className="animate-fade">
            <PageHero />

            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'transparent',
                padding: '0 20px 10px 20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader
                    noMargin
                    showBack={true}
                    title={sellerProfile.store_name || "Mi Tienda"}
                    subtitle="Panel de Control"
                />

                {/* Dashboard Navigation */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '6px',
                    borderRadius: '24px',
                    marginBottom: '15px',
                    border: '1px solid rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                    {[
                        { id: 'products', label: 'STOCK', icon: Package, count: 0 },
                        { id: 'orders', label: 'PEDIDOS', icon: Truck, count: orders.filter(o => o.status === 'Pendiente').length },
                        { id: 'offers', label: 'OFERTAS', icon: Handshake, count: offers.filter(o => o.status === 'pending').length },
                        { id: 'coupons', label: 'CUPONES', icon: Ticket, count: 0 },
                        { id: 'profile', label: 'AJUSTES', icon: Settings, count: 0 }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    flex: 1,
                                    padding: '12px 4px',
                                    borderRadius: '18px',
                                    border: 'none',
                                    background: isActive ? 'var(--secondary)' : 'transparent',
                                    color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                                    fontWeight: '900',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    transform: isActive ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.7 }} />
                                <span style={{ fontSize: '8px', fontWeight: '900', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '15%',
                                        background: isActive ? 'var(--primary)' : 'var(--secondary)',
                                        color: isActive ? 'var(--secondary)' : 'var(--primary)',
                                        fontSize: '9px',
                                        minWidth: '16px',
                                        height: '16px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '900',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                        border: isActive ? 'none' : '1px solid rgba(0,0,0,0.1)'
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>


            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 155px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                transition: 'top 0.3s ease',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }}>
                {activeTab === 'products' ? (
                    <>
                        {/* Quick Stats Summary */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px',
                            marginBottom: '25px'
                        }} className="animate-fade-up">
                            <div style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                padding: '20px',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        background: 'rgba(163, 230, 53, 0.15)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(163, 230, 53, 0.2)'
                                    }}>
                                        <Package size={16} color="var(--secondary)" />
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>PRODUCTOS</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '28px', fontWeight: '950', color: 'white', letterSpacing: '-1px' }}>{products.length}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', opacity: 0.8 }}>ACTIVOS</span>
                                </div>
                            </div>
                            <div style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                padding: '20px',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        background: 'rgba(59, 130, 246, 0.15)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        <TrendingDown size={16} color="#60a5fa" />
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>VENTAS</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '28px', fontWeight: '950', color: 'white', letterSpacing: '-1px' }}>{orders.filter(o => o.status === 'Entregado').length}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', opacity: 0.8 }}>COMPLETADAS</span>
                                </div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '15px', letterSpacing: '-0.02em', color: 'white' }}>Gestión de Inventario</h2>

                        {!showForm && products.length > 0 && (
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: '14px 14px 14px 45px',
                                        borderRadius: '16px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease',
                                        outline: 'none'
                                    }}
                                />
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                                    <Package size={18} color="white" />
                                </div>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                style={{
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '12px',
                                    borderRadius: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    width: '100%',
                                    marginBottom: '20px'
                                }}
                            >
                                <Plus size={18} />
                                <span>Nuevo Producto</span>
                            </button>
                        )}

                        {showForm ? (
                            <form onSubmit={handleSubmit} className="glass" style={{ padding: '15px', marginBottom: '30px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); resetForm(); }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                </div>

                                {/* Image Upload Area */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Fotos del Producto (Máximo 3)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {[0, 1, 2].map((index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    position: 'relative',
                                                    width: '100%',
                                                    aspectRatio: '1/1',
                                                    borderRadius: '15px',
                                                    overflow: 'hidden',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px dashed var(--glass-border)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {formData.images[index] ? (
                                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                        <img
                                                            src={optimizeImage(formData.images[index], { width: 400, height: 400 })}
                                                            alt={`Preview ${index}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData(prev => {
                                                                    const newImages = [...prev.images];
                                                                    newImages[index] = '';
                                                                    return {
                                                                        ...prev,
                                                                        images: newImages,
                                                                        image_url: newImages[0] || ''
                                                                    };
                                                                });
                                                            }}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '5px',
                                                                right: '5px',
                                                                background: 'rgba(0,0,0,0.5)',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '20px',
                                                                height: '20px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <Camera size={24} color="var(--text-dim)" style={{ marginBottom: '4px' }} />
                                                        <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{uploading ? '...' : 'Subir'}</p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, index)}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                            placeholder="Ej: Sandwedge Titleist SM9"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Estado</label>
                                        <select
                                            value={formData.condition}
                                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                        >
                                            <option value="Nuevo">Nuevo</option>
                                            <option value="Usado - Como nuevo">Usado - Como nuevo</option>
                                            <option value="Usado - Buen estado">Usado - Buen estado</option>
                                            <option value="Usado - Desgastado">Usado - Desgastado</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Marca</label>
                                        <select
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                        >
                                            <option value="">Selecciona una marca...</option>
                                            <option value="OTRA">OTRA (Especificar en descripción)</option>
                                            {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>


                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Categoría</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => {
                                                const newCat = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    category: newCat,
                                                    clothing_type: newCat === 'Ropa' ? prev.clothing_type : '',
                                                    sizes_inventory: (
                                                        (prev.category === 'Zapatos' && newCat !== 'Zapatos') ||
                                                        (prev.category !== 'Zapatos' && newCat === 'Zapatos')
                                                    ) ? [] : prev.sizes_inventory
                                                }));
                                            }}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Precio del Producto (COP)</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                required
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.displayPrice}
                                                onChange={handlePriceChange}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                                placeholder="0"
                                            />
                                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '12px', pointerEvents: 'none' }}>
                                                $
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '15px',
                                        borderRadius: '15px',
                                        border: '1px solid var(--glass-border)',
                                        marginBottom: '15px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                                <Truck size={14} color="#38bdf8" />
                                            </div>
                                            <label style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>Costo de Envío (Opcional)</label>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.displayShippingCost}
                                                onChange={handleShippingCostChange}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    color: 'white',
                                                    fontSize: '15px'
                                                }}
                                                placeholder="Ej: 15.000 o 0 si es gratis"
                                            />
                                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '12px', pointerEvents: 'none' }}>
                                                $
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
                                            Define cuánto cobrarás por el envío. Si pones 0, se mostrará como **ENVÍO GRATIS**.
                                        </p>
                                    </div>

                                    {/* Conditional Size & Type Fields */}
                                    {formData.category === 'Ropa' && (
                                        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tipo de Prenda</label>
                                                <select
                                                    value={formData.clothing_type}
                                                    onChange={e => setFormData({ ...formData, clothing_type: e.target.value, size_clothing: '' })}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                                >
                                                    {['Camisa', 'Camiseta', 'Pantalón', 'Short', 'Buso / Chaqueta', 'Gorra', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Selecciona Tallas y Cantidades</label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {(formData.clothing_type === 'Pantalón' || formData.clothing_type === 'Short' ? ['30', '32', '34', '36', '38', '40'] : ['S', 'M', 'L', 'XL', 'XXL']).map(size => {
                                                            const isSelected = !!formData.sizes_inventory.find(s => s.size === size);
                                                            return (
                                                                <button
                                                                    key={size}
                                                                    type="button"
                                                                    onClick={() => toggleSizeInventory(size)}
                                                                    style={{
                                                                        flex: '1 0 50px',
                                                                        padding: '10px',
                                                                        borderRadius: '10px',
                                                                        border: '1px solid var(--glass-border)',
                                                                        background: isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                                        color: isSelected ? 'var(--primary)' : 'white',
                                                                        fontWeight: '700',
                                                                        fontSize: '13px',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    {size}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.category === 'Zapatos' && (
                                        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '-5px', fontSize: '13px', color: 'var(--text-dim)' }}>Tallas de Calzado (Conversión automática)</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--secondary)', fontWeight: '800' }}>Talla COL</label>
                                                    <input
                                                        placeholder="Ej: 40"
                                                        value={formData.size_shoes_col}
                                                        onChange={e => syncShoeSizes(e.target.value, 'col')}
                                                        style={{ width: '100%', background: 'rgba(163, 230, 53, 0.1)', border: '1px solid var(--secondary)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>Talla US</label>
                                                    <input
                                                        placeholder="Ej: 9.5"
                                                        value={formData.size_shoes_us}
                                                        onChange={e => syncShoeSizes(e.target.value, 'us')}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>Talla EU</label>
                                                    <input
                                                        placeholder="Ej: 42"
                                                        value={formData.size_shoes_eu}
                                                        onChange={e => syncShoeSizes(e.target.value, 'eu')}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>Talla CM</label>
                                                    <input
                                                        placeholder="Ej: 27"
                                                        value={formData.size_shoes_cm}
                                                        onChange={e => syncShoeSizes(e.target.value, 'cm')}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Shoe Inventory Selector */}
                                            <div style={{ marginTop: '5px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <label style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Selecciona Tallas y Cantidades (COL)</label>
                                                    <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: '700' }}>Usa los números para activar stock</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map(size => {
                                                        const isSelected = !!formData.sizes_inventory.find(s => s.size === size);
                                                        return (
                                                            <button
                                                                key={size}
                                                                type="button"
                                                                onClick={() => toggleSizeInventory(size)}
                                                                style={{
                                                                    flex: '1 0 45px',
                                                                    padding: '10px',
                                                                    borderRadius: '10px',
                                                                    border: '1px solid ' + (isSelected ? 'var(--secondary)' : 'var(--glass-border)'),
                                                                    background: isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                                    color: isSelected ? 'var(--primary)' : 'white',
                                                                    fontWeight: '800',
                                                                    fontSize: '13px',
                                                                    transition: 'all 0.2s ease',
                                                                    boxSizing: 'border-box',
                                                                    boxShadow: isSelected ? '0 0 15px rgba(163, 230, 53, 0.2)' : 'none'
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

                                    {/* Shared Quantity Inputs for Selected Sizes */}
                                    {formData.sizes_inventory.length > 0 && (
                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            marginTop: '15px'
                                        }}>
                                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px', fontWeight: '800' }}>CANTIDADES POR TALLA</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {formData.sizes_inventory.map(s => (
                                                    <div key={s.size} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>Talla {s.size}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateSizeQuantity(s.size, s.quantity - 1)}
                                                                style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                            >-</button>
                                                            <input
                                                                type="number"
                                                                value={s.quantity}
                                                                onChange={(e) => updateSizeQuantity(s.size, parseInt(e.target.value) || 0)}
                                                                style={{ width: '40px', textAlign: 'center', background: 'transparent', border: 'none', color: 'white', fontWeight: '800', fontSize: '14px' }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateSizeQuantity(s.size, s.quantity + 1)}
                                                                style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'white', color: 'var(--primary)' }}
                                                            >+</button>
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
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', minHeight: '80px', resize: 'none' }}
                                            placeholder="Describe el estado de tu producto..."
                                        />
                                    </div>

                                    {/* Negotiable Toggle */}
                                    <div
                                        onClick={() => setFormData({ ...formData, is_negotiable: !formData.is_negotiable })}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '15px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '15px',
                                            border: '1px solid var(--glass-border)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Precio Negociable</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Permitir que los compradores envíen ofertas</p>
                                        </div>
                                        <div style={{
                                            width: '44px',
                                            height: '24px',
                                            background: formData.is_negotiable ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                                            borderRadius: '20px',
                                            position: 'relative',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                background: formData.is_negotiable ? 'var(--primary)' : 'var(--text-dim)',
                                                borderRadius: '50%',
                                                position: 'absolute',
                                                top: '3px',
                                                left: formData.is_negotiable ? '23px' : '3px',
                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                            }} />
                                        </div>
                                    </div>
                                    {/* Coupon Selection */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                                <Ticket size={14} color="var(--secondary)" />
                                            </div>
                                            <label style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>Asignar Cupón (Opcional)</label>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                                            Selecciona un cupón para activarlo exclusivamente en este producto.
                                        </p>
                                        <select
                                            value={formData.selectedCouponId}
                                            onChange={e => setFormData({ ...formData, selectedCouponId: e.target.value })}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                padding: '12px',
                                                color: 'white',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="">Ningún cupón seleccionado</option>
                                            {coupons.map(coupon => (
                                                <option key={coupon.id} value={coupon.id}>
                                                    {coupon.code} - {coupon.discount_type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value.toLocaleString()} OFF`}
                                                    {coupon.product_id && coupon.product_id !== editingId ? ' (Asignado a otro producto)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Commission Calculation */}
                                    {(formData.price || formData.shipping_cost) && (() => {
                                        const selectedCoupon = coupons.find(c => c.id === formData.selectedCouponId);
                                        const basePrice = parseFloat(formData.price) || 0;
                                        const shippingCost = parseFloat(formData.shipping_cost) || 0;

                                        let discountValue = 0;
                                        if (selectedCoupon) {
                                            if (selectedCoupon.discount_type === 'percentage') {
                                                discountValue = Math.round(basePrice * (Number(selectedCoupon.value) / 100));
                                            } else {
                                                discountValue = Number(selectedCoupon.value);
                                            }
                                        }

                                        const discountedPrice = Math.max(0, basePrice - discountValue);
                                        const commission = Math.round(discountedPrice * 0.05);
                                        const finalTotal = discountedPrice - commission + shippingCost;

                                        return (
                                            <div className="glass" style={{ padding: '15px', background: 'rgba(163, 230, 53, 0.05)', borderRadius: '15px', border: '1px solid rgba(163, 230, 53, 0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                                    <span style={{ color: 'var(--text-dim)' }}>Precio base</span>
                                                    <span style={{ color: 'white', fontWeight: '600' }}>$ {formatPrice(basePrice.toFixed(0))}</span>
                                                </div>

                                                {discountValue > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', paddingTop: '5px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Percent size={12} color="#ef4444" />
                                                            <span style={{ color: '#ef4444', fontWeight: '800' }}>Descuento ({selectedCoupon?.code})</span>
                                                        </div>
                                                        <span style={{ color: '#ef4444', fontWeight: '800' }}>- $ {formatPrice(discountValue.toFixed(0))}</span>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                                    <span style={{ color: 'var(--text-dim)' }}>Comisión APEG (5%)</span>
                                                    <span style={{ color: '#ff6b6b', fontWeight: '600' }}>- $ {formatPrice(commission.toFixed(0))}</span>
                                                </div>

                                                {shippingCost > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                                        <span style={{ color: 'var(--text-dim)' }}>Costo de envío</span>
                                                        <span style={{ color: '#38bdf8', fontWeight: '600' }}>+ $ {formatPrice(shippingCost.toFixed(0))}</span>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
                                                    <span>Recibes en tu cuenta</span>
                                                    <span style={{ color: 'var(--secondary)' }}>$ {formatPrice(finalTotal.toFixed(0))}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <button
                                        type="submit"
                                        disabled={saving || !formData.image_url}
                                        style={{
                                            width: '100%',
                                            background: (saving || !formData.image_url) ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)',
                                            color: 'var(--primary)',
                                            padding: '15px',
                                            borderRadius: '15px',
                                            fontWeight: '800',
                                            marginTop: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                        {saving ? 'GUARDANDO...' : 'PUBLICAR PRODUCTO'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {loading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="glass" style={{ padding: '15px', display: 'flex', gap: '18px', alignItems: 'center' }}>
                                                <Skeleton width="90px" height="90px" borderRadius="20px" />
                                                <div style={{ flex: 1 }}>
                                                    <Skeleton width="60%" height="18px" style={{ marginBottom: '8px' }} />
                                                    <Skeleton width="40%" height="22px" style={{ marginBottom: '10px' }} />
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <Skeleton width="50px" height="18px" borderRadius="8px" />
                                                        <Skeleton width="40px" height="18px" borderRadius="8px" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '30px' }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <Package size={32} color="var(--text-dim)" style={{ opacity: 0.5 }} />
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Tu tienda está vacía</h3>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '20px' }}>¡Sube tu primer producto y comienza a vender!</p>
                                        <button
                                            onClick={() => setShowForm(true)}
                                            style={{
                                                background: 'var(--secondary)',
                                                color: 'var(--primary)',
                                                padding: '12px 25px',
                                                borderRadius: '15px',
                                                fontWeight: '900',
                                                border: 'none',
                                                fontSize: '14px'
                                            }}
                                        >
                                            VENDER UN ARTÍCULO
                                        </button>
                                    </div>
                                ) : (
                                    products.filter(p =>
                                        p.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).length === 0 && searchTerm ? (
                                        <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                                            <Package size={32} color="var(--text-dim)" style={{ opacity: 0.3, marginBottom: '10px', margin: '0 auto' }} />
                                            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No se encontraron productos que coincidan con tu búsqueda.</p>
                                        </div>
                                    ) : (
                                        products
                                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(product => (
                                                <div key={product.id} className="animate-fade-up">
                                                    <div
                                                        style={{
                                                            position: 'relative',
                                                            background: 'rgba(255,255,255,0.03)',
                                                            borderRadius: '26px',
                                                            border: '1px solid rgba(255,255,255,0.06)',
                                                            overflow: 'hidden',
                                                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                                        }}
                                                    >
                                                        <div style={{ padding: '15px', display: 'flex', gap: '18px', alignItems: 'center' }}>
                                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                                <div style={{
                                                                    width: '90px',
                                                                    height: '90px',
                                                                    borderRadius: '20px',
                                                                    overflow: 'hidden',
                                                                    background: 'var(--primary-light)',
                                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                                }}>
                                                                    <img
                                                                        src={optimizeImage(product.image_url, { width: 200, height: 200 })}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        alt={product.name}
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    bottom: '-6px',
                                                                    right: '-6px',
                                                                    background: product.status === 'active' ? 'var(--secondary)' : '#f59e0b',
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    borderRadius: '50%',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    border: '3px solid #062216',
                                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                                                                }}>
                                                                    {product.status === 'active' ? <CheckCircle2 size={14} color="var(--primary)" /> : <Package size={14} color="white" />}
                                                                </div>
                                                            </div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h3 style={{
                                                                    fontSize: '17px',
                                                                    fontWeight: '900',
                                                                    marginBottom: '5px',
                                                                    color: 'white',
                                                                    letterSpacing: '-0.3px',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>{product.name}</h3>

                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <span style={{ color: 'var(--secondary)', fontWeight: '900', fontSize: '22px', letterSpacing: '-0.5px' }}>
                                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        background: parseFloat(product.shipping_cost?.toString() || '0') > 0 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid ' + (parseFloat(product.shipping_cost?.toString() || '0') > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.15)'),
                                                                        width: 'fit-content'
                                                                    }}>
                                                                        <Truck size={12} color={parseFloat(product.shipping_cost?.toString() || '0') > 0 ? "#38bdf8" : "#22c55e"} />
                                                                        <span style={{
                                                                            fontSize: '10px',
                                                                            fontWeight: '800',
                                                                            color: parseFloat(product.shipping_cost?.toString() || '0') > 0 ? "#38bdf8" : "#22c55e",
                                                                            letterSpacing: '0.02em'
                                                                        }}>
                                                                            {parseFloat(product.shipping_cost?.toString() || '0') > 0
                                                                                ? `+ $${formatPrice(product.shipping_cost?.toString() || '0')} ENVÍO`
                                                                                : 'ENVÍO GRATIS'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    <div style={{
                                                                        background: 'rgba(255,255,255,0.04)',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '10px',
                                                                        fontSize: '11px',
                                                                        color: 'white',
                                                                        fontWeight: '700',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        border: '1px solid rgba(255,255,255,0.06)'
                                                                    }}>
                                                                        <span style={{ color: 'var(--text-dim)', fontSize: '9px', fontWeight: '800' }}>STOCK:</span>
                                                                        <span style={{ color: (product as any).stock_quantity > 0 ? 'var(--secondary)' : '#ef4444' }}>
                                                                            {(product as any).stock_quantity || 0}
                                                                        </span>
                                                                    </div>

                                                                    {/* Size Inventory Breakdown */}
                                                                    {Array.isArray((product as any).sizes_inventory) && (product as any).sizes_inventory.length > 0 && (
                                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                            {(product as any).sizes_inventory.map((inv: { size: string; quantity: number }, i: number) => (
                                                                                <span key={i} style={{
                                                                                    background: inv.quantity > 0 ? 'rgba(163, 230, 53, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '6px',
                                                                                    fontSize: '10px',
                                                                                    color: inv.quantity > 0 ? 'var(--secondary)' : 'rgba(255,255,255,0.2)',
                                                                                    fontWeight: '900',
                                                                                    border: '1px solid ' + (inv.quantity > 0 ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255,255,255,0.05)')
                                                                                }}>
                                                                                    {inv.size}: {inv.quantity}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Individual Shoe Size Columns (Fallback) */}
                                                                    {(!Array.isArray((product as any).sizes_inventory) || (product as any).sizes_inventory.length === 0) && (product as any).size_shoes_col && (
                                                                        <span style={{
                                                                            background: 'rgba(163, 230, 53, 0.1)',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '8px',
                                                                            fontSize: '10px',
                                                                            color: 'var(--secondary)',
                                                                            fontWeight: '900',
                                                                            border: '1px solid rgba(163, 230, 53, 0.2)'
                                                                        }}>
                                                                            TALLA COL: {(product as any).size_shoes_col}
                                                                        </span>
                                                                    )}
                                                                    {(!Array.isArray((product as any).sizes_inventory) || (product as any).sizes_inventory.length === 0) && (product as any).size_clothing && (
                                                                        <span style={{
                                                                            background: 'rgba(163, 230, 53, 0.1)',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '8px',
                                                                            fontSize: '10px',
                                                                            color: 'var(--secondary)',
                                                                            fontWeight: '900',
                                                                            border: '1px solid rgba(163, 230, 53, 0.2)'
                                                                        }}>
                                                                            TALLA: {(product as any).size_clothing}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '5px' }}>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                                                                    style={{
                                                                        color: 'white',
                                                                        background: 'rgba(255,255,255,0.05)',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        borderRadius: '12px',
                                                                        width: '42px',
                                                                        height: '42px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                                    }}
                                                                    className="hover-scale"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }}
                                                                    style={{
                                                                        color: '#ff6b6b',
                                                                        background: 'rgba(255, 107, 107, 0.05)',
                                                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                                                        borderRadius: '12px',
                                                                        width: '42px',
                                                                        height: '42px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                                    }}
                                                                    className="hover-scale"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {product.status === 'pending_payment' && (
                                                            <div style={{ padding: '0 15px 15px' }}>
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        try {
                                                                            const confirmed = confirm('¿Pagar 120,000 COP para publicar este producto?');
                                                                            if (confirmed) {
                                                                                const { error } = await supabase
                                                                                    .from('products')
                                                                                    .update({ status: 'active' })
                                                                                    .eq('id', product.id);
                                                                                if (error) throw error;
                                                                                setProducts(products.map(p => p.id === product.id ? { ...p, status: 'active' } : p));
                                                                                setSuccessMessage({
                                                                                    title: '¡Publicado!',
                                                                                    message: 'Tu producto ya está activo en el marketplace.',
                                                                                    type: 'success'
                                                                                });
                                                                                setShowSuccessModal(true);
                                                                                setTimeout(() => setShowSuccessModal(false), 3000);
                                                                            }
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            setSuccessMessage({
                                                                                title: 'Error',
                                                                                message: 'No se pudo procesar el pago o activar el producto.',
                                                                                type: 'error'
                                                                            });
                                                                            setShowSuccessModal(true);
                                                                            setTimeout(() => setShowSuccessModal(false), 3000);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                                                        color: 'var(--primary)',
                                                                        padding: '14px',
                                                                        borderRadius: '15px',
                                                                        fontWeight: '900',
                                                                        fontSize: '13px',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '10px',
                                                                        boxShadow: '0 8px 15px rgba(163, 230, 53, 0.2)',
                                                                        textAlign: 'center'
                                                                    }}
                                                                >
                                                                    <CheckCircle2 size={18} />
                                                                    PUBLICAR AHORA ($120.000)
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )))
                                )}
                            </div>
                        )}
                    </>
                ) : activeTab === 'orders' ? (
                    <div className="animate-fade">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                                Ventas <span style={{ color: 'var(--secondary)' }}>Recientes</span>
                            </h2>
                            <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>{orders.length} pedidos</div>
                        </div>
                        {orders.length === 0 ? (
                            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <TrendingDown size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-dim)' }}>Aún no tienes ventas registradas.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {orders.filter(o =>
                                    (o.buyer_name || o.buyer?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && searchTerm ? (
                                    <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                                        <TrendingDown size={32} color="var(--text-dim)" style={{ opacity: 0.3, marginBottom: '10px', margin: '0 auto' }} />
                                        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No se encontraron ventas que coincidan con tu búsqueda.</p>
                                    </div>
                                ) : (
                                    orders
                                        .filter(o =>
                                            (o.buyer_name || o.buyer?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map(order => (
                                            <Card key={order.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '12px',
                                                            fontSize: '10px',
                                                            fontWeight: '900',
                                                            background: order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                            color: order.status === 'Pendiente' ? '#f59e0b' : '#10b981',
                                                            border: `1px solid ${order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {order.status?.toUpperCase() || 'PENDIENTE'}
                                                        </span>
                                                        {order.order_number && (
                                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--secondary)' }}>
                                                                {order.order_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '600' }}>
                                                            <Calendar size={12} />
                                                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : '---'}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOrderEditClick(order);
                                                            }}
                                                            style={{
                                                                padding: '8px',
                                                                borderRadius: '12px',
                                                                background: 'rgba(163, 230, 53, 0.1)',
                                                                border: '1px solid rgba(163, 230, 53, 0.2)',
                                                                color: 'var(--secondary)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: '0.2s',
                                                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(163, 230, 53, 0.2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(163, 230, 53, 0.1)'}
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <img
                                                            src={optimizeImage(order.product?.image_url, { width: 150, height: 150 })}
                                                            style={{ width: '65px', height: '65px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                                            alt=""
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                                                            }}
                                                        />
                                                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--secondary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0e2f1f' }}>
                                                            <Package size={10} color="var(--primary)" />
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{order.product?.name}</h4>
                                                        <p style={{ fontSize: '16px', color: 'var(--secondary)', fontWeight: '900' }}>
                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.seller_net_amount || 0)}
                                                            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '600', marginLeft: '5px' }}>NETOS</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '18px', padding: '15px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <p style={{ fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <User size={12} /> Información del Comprador
                                                    </p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <User size={14} color="var(--text-dim)" />
                                                            </div>
                                                            <span style={{ fontWeight: '600' }}>{order.buyer_name || order.buyer?.full_name}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Phone size={14} color="var(--text-dim)" />
                                                            </div>
                                                            <span style={{ fontWeight: '600' }}>{order.buyer_phone || order.buyer?.phone}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                                                                <MapPin size={14} color="var(--text-dim)" />
                                                            </div>
                                                            <span style={{ lineHeight: '1.4', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>{order.shipping_address}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {order.status === 'Pendiente' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, 'Preparando')}
                                                        disabled={updatingOrder === order.id}
                                                        style={{
                                                            width: '100%',
                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                                            color: '#60a5fa',
                                                            padding: '14px',
                                                            borderRadius: '16px',
                                                            fontWeight: '800',
                                                            fontSize: '13px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                                                        }}
                                                    >
                                                        {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />}
                                                        {updatingOrder === order.id ? 'ACTUALIZANDO...' : 'LISTO PARA DESPACHO'}
                                                    </button>
                                                )}
                                                {(order.status === 'Preparando' || order.status === 'Pagado' || editingTrackingId === order.id) && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <p style={{ fontSize: '11px', fontWeight: '900', color: 'white', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {editingTrackingId === order.id ? 'Editar Datos de Envío' : 'Actualizar Guía de Envío'}
                                                        </p>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <input
                                                                id={`provider-${order.id}`}
                                                                placeholder="Transportadora (Servientrega, Coordinadora...)"
                                                                defaultValue={order.shipping_provider || ''}
                                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '13px', color: 'white', outline: 'none' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input
                                                                    id={`tracking-${order.id}`}
                                                                    placeholder="No. Guía"
                                                                    defaultValue={order.tracking_number || ''}
                                                                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '13px', color: 'white', outline: 'none' }}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        setScanningOrderId(order.id);
                                                                        setShowScanner(true);
                                                                    }}
                                                                    style={{
                                                                        background: 'rgba(255,255,255,0.1)',
                                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                                        borderRadius: '12px',
                                                                        width: '46px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: 'white',
                                                                        flexShrink: 0
                                                                    }}
                                                                    title="Escanear Guía"
                                                                >
                                                                    <Camera size={20} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            {editingTrackingId === order.id && (
                                                                <button
                                                                    onClick={() => setEditingTrackingId(null)}
                                                                    className="glass"
                                                                    style={{
                                                                        padding: '14px',
                                                                        borderRadius: '16px',
                                                                        cursor: 'pointer',
                                                                        color: 'var(--text-dim)',
                                                                        fontWeight: '700',
                                                                        fontSize: '13px'
                                                                    }}
                                                                >
                                                                    CANCELAR
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => {
                                                                    const prov = (document.getElementById(`provider-${order.id}`) as HTMLInputElement).value;
                                                                    const track = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                                                                    updateTracking(order.id, track, prov);
                                                                }}
                                                                disabled={updatingOrder === order.id}
                                                                style={{
                                                                    background: 'var(--secondary)',
                                                                    color: 'var(--primary)',
                                                                    padding: '14px',
                                                                    borderRadius: '16px',
                                                                    fontWeight: '900',
                                                                    flex: 1,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '10px',
                                                                    boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)'
                                                                }}
                                                            >
                                                                {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                                                                {editingTrackingId === order.id ? 'GUARDAR CAMBIOS' : 'MARCAR COMO ENVIADO'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {order.status === 'Enviado' && editingTrackingId !== order.id && (
                                                    <div style={{
                                                        background: 'rgba(16, 185, 129, 0.08)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        padding: '16px',
                                                        borderRadius: '18px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <CheckCircle2 size={20} color="#10b981" />
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: '800', color: '#10b981', fontSize: '14px' }}>Producto Enviado</p>
                                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{order.shipping_provider} • {order.tracking_number}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleOrderEditClick(order)}
                                                            style={{
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                color: 'var(--text-dim)',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: '0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                            title="Gestionar Pedido"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </Card>
                                        )))
                                }
                            </div>
                        )}
                    </div>
                ) : activeTab === 'offers' ? (
                    <div className="animate-fade">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '15px', color: 'white' }}>
                            Ofertas <span style={{ color: 'var(--secondary)' }}>Recibidas</span>
                        </h2>
                        {offers.length === 0 ? (
                            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <Handshake size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-dim)' }}>No hay ofertas pendientes.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {offers.filter(o =>
                                    (o.buyer?.full_name || 'Comprador APEG').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && searchTerm ? (
                                    <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                                        <Handshake size={32} color="var(--text-dim)" style={{ opacity: 0.3, marginBottom: '10px', margin: '0 auto' }} />
                                        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No se encontraron ofertas que coincidan con tu búsqueda.</p>
                                    </div>
                                ) : (
                                    offers
                                        .filter(o =>
                                            (o.buyer?.full_name || 'Comprador APEG').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map(offer => (
                                            <Card key={offer.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                                                    <span style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '12px',
                                                        fontSize: '10px',
                                                        fontWeight: '900',
                                                        background: offer.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' :
                                                            offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                        color: offer.status === 'pending' ? '#f59e0b' :
                                                            offer.status === 'accepted' ? '#10b981' : '#ef4444',
                                                        border: `1px solid ${offer.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' :
                                                            offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {offer.status === 'pending' ? 'PENDIENTE' :
                                                            offer.status === 'accepted' ? 'ACEPTADA' : 'RECHAZADA'}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '600' }}>
                                                            <Calendar size={12} />
                                                            {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '---'}
                                                        </div>
                                                        <button
                                                            onClick={() => deleteOffer(offer.id)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'rgba(239, 68, 68, 0.6)',
                                                                padding: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                borderRadius: '8px'
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <img
                                                            src={optimizeImage(offer.product?.image_url, { width: 150, height: 150 })}
                                                            style={{ width: '65px', height: '65px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                                            alt=""
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                                                            }}
                                                        />
                                                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0e2f1f' }}>
                                                            <Handshake size={10} color="white" />
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>{offer.product?.name}</h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <p style={{ fontSize: '18px', color: 'var(--secondary)', fontWeight: '900' }}>
                                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.offer_amount || 0)}
                                                            </p>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'line-through', fontWeight: '600' }}>
                                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.product?.price || 0)}
                                                            </p>
                                                            <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                                                -{Math.round((1 - (offer.offer_amount || 0) / (offer.product?.price || 1)) * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '18px', padding: '15px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '10px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <User size={14} color="var(--text-dim)" />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ fontWeight: '700' }}>{offer.buyer?.full_name || 'Comprador APEG'}</span>
                                                        </div>
                                                    </div>


                                                    {offer.message && (
                                                        <div style={{ position: 'relative', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', borderLeft: '3px solid var(--secondary)' }}>
                                                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: '1.4' }}>
                                                                "{offer.message}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {
                                                        offer.status === 'pending' && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                                                <button
                                                                    onClick={() => handleOfferAction(offer.id, 'rejected')}
                                                                    disabled={updatingOffer === offer.id}
                                                                    style={{
                                                                        flex: 1,
                                                                        minWidth: '100px',
                                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                        color: '#f87171',
                                                                        padding: '12px',
                                                                        borderRadius: '14px',
                                                                        fontWeight: '800',
                                                                        fontSize: '11px'
                                                                    }}
                                                                >
                                                                    RECHAZAR
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOfferForCounter(offer);
                                                                        setCounterAmount(offer.offer_amount.toString());
                                                                        setCounterMessage('');
                                                                        setShowCounterModal(true);
                                                                    }}
                                                                    disabled={updatingOffer === offer.id}
                                                                    style={{
                                                                        flex: 1,
                                                                        minWidth: '100px',
                                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                        color: 'white',
                                                                        padding: '12px',
                                                                        borderRadius: '14px',
                                                                        fontWeight: '800',
                                                                        fontSize: '11px'
                                                                    }}
                                                                >
                                                                    CONTRAOFERTA
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOfferAction(offer.id, 'accepted')}
                                                                    disabled={updatingOffer === offer.id}
                                                                    style={{
                                                                        flex: 2,
                                                                        minWidth: '180px',
                                                                        background: 'var(--secondary)',
                                                                        color: 'var(--primary)',
                                                                        padding: '12px',
                                                                        borderRadius: '14px',
                                                                        fontWeight: '900',
                                                                        fontSize: '11px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '8px',
                                                                        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)'
                                                                    }}
                                                                >
                                                                    {updatingOffer === offer.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                                    ACEPTAR OFERTA
                                                                </button>
                                                            </div>
                                                        )
                                                    }

                                                    {
                                                        offer.status === 'countered' && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tu Contraoferta</span>
                                                                        <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--secondary)' }}>${offer.counter_amount?.toLocaleString()}</span>
                                                                    </div>
                                                                    {offer.counter_message && (
                                                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: 0 }}>
                                                                            "{offer.counter_message}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '14px', color: '#60a5fa', textAlign: 'center', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                                    <Info size={16} />
                                                                    RESERVADO • El comprador tiene 1 hora para comprar
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    {
                                                        offer.status === 'accepted' && (
                                                            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '16px', color: '#10b981', textAlign: 'center', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                                <CheckCircle2 size={18} />
                                                                OFERTA ACEPTADA • Esperando pago (1h)
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                            </Card>
                                        )))
                                }
                            </div>
                        )}
                    </div>
                ) : activeTab === 'coupons' ? (
                    <div className="animate-fade">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                                Mis <span style={{ color: 'var(--secondary)' }}>Cupones</span>
                            </h2>
                            {!showCouponForm && (
                                <button
                                    onClick={() => setShowCouponForm(true)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--secondary)',
                                        padding: '8px 15px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        border: '1px solid rgba(163, 230, 53, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Plus size={14} /> NUEVO CUPÓN
                                </button>
                            )}
                        </div>

                        {showCouponForm ? (
                            <Card style={{ padding: '25px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', marginBottom: '20px' }}>
                                <form onSubmit={handleCouponSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{editingCouponId ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</h3>
                                        <button type="button" onClick={() => { setShowCouponForm(false); setEditingCouponId(null); }} style={{ color: 'var(--text-dim)' }}><X size={20} /></button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Código</label>
                                            <input
                                                required
                                                placeholder="GOLF2024"
                                                value={couponFormData.code}
                                                onChange={e => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Tipo</label>
                                            <select
                                                value={couponFormData.discount_type}
                                                onChange={e => setCouponFormData({ ...couponFormData, discount_type: e.target.value as any })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                            >
                                                <option value="percentage">Porcentaje (%)</option>
                                                <option value="fixed">Valor Fijo ($)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Valor Descuento</label>
                                            <input
                                                required
                                                type="number"
                                                placeholder={couponFormData.discount_type === 'percentage' ? '10' : '50000'}
                                                value={couponFormData.discount_value}
                                                onChange={e => setCouponFormData({ ...couponFormData, discount_value: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Límite de Usos</label>
                                            <input
                                                type="number"
                                                placeholder="Sin límite"
                                                value={couponFormData.usage_limit}
                                                onChange={e => setCouponFormData({ ...couponFormData, usage_limit: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        style={{ background: 'var(--secondary)', color: 'var(--primary)', padding: '15px', borderRadius: '16px', fontWeight: '900', marginTop: '10px' }}
                                    >
                                        {saving ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : (editingCouponId ? 'GUARDAR CAMBIOS' : 'CREAR CUPÓN')}
                                    </button>
                                </form>
                            </Card>
                        ) : null}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {coupons.length === 0 ? (
                                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                    <Ticket size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                                    <p style={{ color: 'var(--text-dim)' }}>No has creado cupones aún.</p>
                                </div>
                            ) : (
                                coupons.map(coupon => (
                                    <Card key={coupon.id} style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                                                    <Percent size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '0.05em' }}>{coupon.code}</span>
                                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: coupon.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: coupon.active ? '#10b981' : '#ef4444', fontWeight: '800' }}>
                                                            {coupon.active ? 'ACTIVO' : 'INACTIVO'}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                                        {coupon.discount_type === 'percentage' ? `${coupon.value}% de descuento` : `$${coupon.value.toLocaleString()} de descuento`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleEditCoupon(coupon)} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white' }}><Pencil size={16} /></button>
                                                <button onClick={() => deleteCoupon(coupon.id, coupon.code)} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>
                                            <span>USOS: {coupon.used_count || 0} / {coupon.usage_limit || '∞'}</span>
                                            <span>MÍNIMO: ${coupon.min_purchase_amount?.toLocaleString() || 0}</span>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                                Perfil <span style={{ color: 'var(--secondary)' }}>Marketplace</span>
                            </h2>
                            {isEditingProfile && (
                                <button
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        setProfileFormData({ ...sellerProfile });
                                    }}
                                    style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '600' }}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {!isEditingProfile ? (
                                <Card style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                        <div style={{ background: 'linear-gradient(135deg, var(--secondary), #7cc42b)', borderRadius: '20px', padding: '18px', color: 'var(--primary)', boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)' }}>
                                            <Store size={36} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em' }}>{sellerProfile?.store_name}</h3>
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
                                                    {sellerProfile?.entity_type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '20px',
                                            padding: '20px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '900', marginBottom: '18px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                                <User size={14} /> Datos de Identidad
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>
                                                        {sellerProfile?.entity_type === 'natural' ? 'Nombre Completo' : 'Razón Social'}
                                                    </span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{sellerProfile?.entity_type === 'natural' ? sellerProfile?.full_name : sellerProfile?.company_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>
                                                        {sellerProfile?.entity_type === 'natural' ? `Doc. (${sellerProfile?.document_type})` : 'NIT'}
                                                    </span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{sellerProfile?.entity_type === 'natural' ? sellerProfile?.document_number : sellerProfile?.nit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '20px',
                                            padding: '20px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '900', marginBottom: '18px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                                <Landmark size={14} /> Información Bancaria
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>Banco</span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{sellerProfile?.bank_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>Tipo de Cuenta</span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>{sellerProfile?.account_type}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>Número de Cuenta</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>•••• {sellerProfile?.account_number?.slice(-4) || '****'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setProfileFormData(sellerProfile);
                                            setIsEditingProfile(true);
                                        }}
                                        style={{
                                            marginTop: '30px',
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            padding: '18px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: '800',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <Pencil size={18} />
                                        EDITAR MI Marketplace
                                    </button>
                                </Card>
                            ) : (
                                <Card style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Marketplace</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    value={profileFormData?.store_name || ''}
                                                    onChange={e => setProfileFormData(prev => prev ? { ...prev, store_name: e.target.value } : null)}
                                                    style={{ width: '100%', padding: '16px 16px 16px 45px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px' }}
                                                    placeholder="Ej: Mi Tienda Pro"
                                                />
                                                <Store size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información de Identidad</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {sellerProfile?.entity_type === 'natural' ? (
                                                    <>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre Completo</label>
                                                            <input
                                                                value={profileFormData?.full_name || ''}
                                                                onChange={e => setProfileFormData(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Documento</label>
                                                            <input
                                                                value={profileFormData?.document_number || ''}
                                                                onChange={e => setProfileFormData(prev => prev ? { ...prev, document_number: e.target.value } : null)}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Razón Social</label>
                                                            <input
                                                                value={profileFormData?.company_name || ''}
                                                                onChange={e => setProfileFormData(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>NIT</label>
                                                            <input
                                                                value={profileFormData?.nit || ''}
                                                                onChange={e => setProfileFormData(prev => prev ? { ...prev, nit: e.target.value } : null)}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuenta de Retiros</h4>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Cuenta</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        value={profileFormData?.account_number || ''}
                                                        onChange={e => setProfileFormData(prev => prev ? { ...prev, account_number: e.target.value } : null)}
                                                        style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                        placeholder="Número de cuenta bancaria"
                                                    />
                                                    <Landmark size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                                </div>
                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Info size={12} />
                                                    Solo puedes editar el nombre y número de identificación. Para cambios bancarios contacta a soporte.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (saving || !profileFormData) return;
                                                setSaving(true);
                                                try {
                                                    const { error } = await supabase
                                                        .from('seller_profiles')
                                                        .update({
                                                            store_name: profileFormData.store_name,
                                                            full_name: profileFormData.full_name,
                                                            company_name: profileFormData.company_name,
                                                            document_number: profileFormData.document_number,
                                                            nit: profileFormData.nit,
                                                            account_number: profileFormData.account_number,
                                                            updated_at: new Date().toISOString()
                                                        } as any)
                                                        .eq('id', sellerProfile?.id);

                                                    if (error) throw error;

                                                    setSellerProfile(profileFormData);
                                                    setIsEditingProfile(false);
                                                    setSuccessMessage({
                                                        title: '¡Perfil Actualizado!',
                                                        message: 'Los cambios en tu tienda se han guardado correctamente.',
                                                        type: 'success'
                                                    });
                                                    setShowSuccessModal(true);
                                                    setTimeout(() => setShowSuccessModal(false), 3000);
                                                } catch (err: any) {
                                                    setSuccessMessage({
                                                        title: 'Error',
                                                        message: 'No pudimos actualizar tu perfil: ' + err.message,
                                                        type: 'error'
                                                    });
                                                    setShowSuccessModal(true);
                                                    setTimeout(() => setShowSuccessModal(false), 4000);
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={saving}
                                            style={{
                                                marginTop: '10px',
                                                width: '100%',
                                                background: saving ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)',
                                                color: 'var(--primary)',
                                                padding: '18px',
                                                borderRadius: '20px',
                                                fontSize: '15px',
                                                fontWeight: '900',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 8px 25px rgba(163, 230, 53, 0.2)'
                                            }}
                                        >
                                            {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                            {saving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CAMBIOS'}
                                        </button>
                                    </div>
                                </Card>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* Custom Confirmation Modal */}
            {
                deleteModal.isOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                padding: '25px',
                                borderRadius: '24px',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--primary)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}
                        >
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <Trash2 color="#ef4444" size={28} />
                            </div>
                            <h2 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: '700' }}>¿Eliminar producto?</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                                ¿Estás seguro que deseas eliminar <strong>{deleteModal.productName}</strong>? Esta acción es permanente.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        flex: 1,
                                        background: '#ef4444',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '14px'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Modal de Confirmación para Eliminar Cupón */}
            {
                deleteCouponModal.isOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                padding: '25px',
                                borderRadius: '24px',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--primary)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}
                        >
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <Trash2 color="#ef4444" size={28} />
                            </div>
                            <h2 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: '700' }}>¿Eliminar cupón?</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                                ¿Estás seguro que deseas eliminar el cupón <strong>{deleteCouponModal.couponCode}</strong>? Esta acción es permanente.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteCouponModal({ isOpen: false, couponId: null, couponCode: '' })}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteCoupon}
                                    style={{
                                        flex: 1,
                                        background: '#ef4444',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '14px'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }


            {/* Modal de Contraoferta */}
            {
                showCounterModal && selectedOfferForCounter && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            style={{
                                backgroundColor: '#1a1a1a',
                                borderRadius: '32px',
                                width: '100%',
                                maxWidth: '450px',
                                padding: '32px',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Enviar Contraoferta</h3>
                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Para {selectedOfferForCounter?.product?.name}</p>
                                </div>
                                <button
                                    onClick={() => setShowCounterModal(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '16px',
                                        color: 'white'
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', marginBottom: '24px', gap: '16px', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase' }}>Oferta Actual</span>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>${(selectedOfferForCounter?.offer_amount || 0).toLocaleString()}</div>
                                </div>
                                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase' }}>Precio Orig.</span>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'rgba(255,255,255,0.6)' }}>${selectedOfferForCounter?.product?.price.toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '10px', marginLeft: '4px' }}>Nuevo Monto</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: '900', color: 'var(--secondary)' }}>$</span>
                                    <input
                                        type="number"
                                        value={counterAmount}
                                        onChange={(e) => setCounterAmount(e.target.value)}
                                        placeholder="0"
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '2px solid rgba(163, 230, 53, 0.2)',
                                            borderRadius: '20px',
                                            padding: '20px 20px 20px 45px',
                                            fontSize: '28px',
                                            fontWeight: '900',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '10px', marginLeft: '4px' }}>Mensaje (Opcional)</label>
                                <textarea
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                    placeholder="Ej: Podemos cerrar en este precio si lo compras hoy mismo."
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '20px',
                                        padding: '16px',
                                        fontSize: '15px',
                                        color: 'white',
                                        minHeight: '100px',
                                        outline: 'none',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    handleOfferAction(selectedOfferForCounter?.id || '', 'countered', {
                                        counter_amount: parseFloat(counterAmount),
                                        counter_message: counterMessage
                                    });
                                    setShowCounterModal(false);
                                }}
                                disabled={!counterAmount || isNaN(parseFloat(counterAmount))}
                                style={{
                                    width: '100%',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '20px',
                                    borderRadius: '20px',
                                    fontWeight: '900',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    boxShadow: '0 12px 24px rgba(163, 230, 53, 0.2)',
                                    opacity: (!counterAmount || isNaN(parseFloat(counterAmount))) ? 0.5 : 1
                                }}
                            >
                                ENVIAR CONTRAOFERTA
                            </button>
                        </motion.div>
                    </div>
                )
            }


            {
                showScanner && (
                    <TrackingScanner
                        onScanComplete={handleScanComplete}
                        onClose={() => {
                            setShowScanner(false);
                            setScanningOrderId(null);
                        }}
                    />
                )
            }

            <AnimatePresence>
                {showOrderEditModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            style={{
                                background: '#0e2f1f',
                                width: '100%',
                                maxWidth: '500px',
                                borderRadius: '30px',
                                padding: '30px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>Gestionar Pedido</h2>
                                <button onClick={() => setShowOrderEditModal(false)} className="glass" style={{ padding: '8px', borderRadius: '12px' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleOrderEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>NÚMERO DE ORDEN</label>
                                    <input
                                        type="text"
                                        value={orderEditFormData.order_number}
                                        onChange={(e) => setOrderEditFormData({ ...orderEditFormData, order_number: e.target.value })}
                                        placeholder="Ej: #1001"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', color: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>ESTADO</label>
                                    <select
                                        value={orderEditFormData.status}
                                        onChange={(e) => setOrderEditFormData({ ...orderEditFormData, status: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', color: 'white' }}
                                    >
                                        <option value="Pendiente de Pago">Pendiente de Pago</option>
                                        <option value="shipped">Enviado (shipped)</option>
                                        <option value="Pagado">Pagado / Preparando</option>
                                        <option value="Enviado">Enviado</option>
                                        <option value="Entregado">Entregado</option>
                                        <option value="delivered">Entregado (delivered)</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>

                                <div style={{ background: 'rgba(163, 230, 53, 0.05)', borderRadius: '20px', padding: '20px', border: '1px dashed rgba(163, 230, 53, 0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--secondary)' }}>DATOS DE ENVÍO</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setScanningOrderId(selectedOrderForEdit?.id || null);
                                                setShowScanner(true);
                                            }}
                                            style={{
                                                background: 'var(--secondary)',
                                                color: 'var(--primary)',
                                                border: 'none',
                                                borderRadius: '10px',
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                fontWeight: '900',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Camera size={14} /> ESCANEAR GUÍA
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '6px' }}>TRANSPORTADORA</label>
                                            <input
                                                type="text"
                                                value={orderEditFormData.shipping_provider}
                                                onChange={(e) => setOrderEditFormData({ ...orderEditFormData, shipping_provider: e.target.value })}
                                                placeholder="Ej: Servientrega"
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '6px' }}>GUÍA</label>
                                            <input
                                                type="text"
                                                value={orderEditFormData.tracking_number}
                                                onChange={(e) => setOrderEditFormData({ ...orderEditFormData, tracking_number: e.target.value })}
                                                placeholder="No. de Guía"
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '13px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>DATOS DEL COMPRADOR (NOMBRE Y TEL)</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            value={orderEditFormData.buyer_name}
                                            onChange={(e) => setOrderEditFormData({ ...orderEditFormData, buyer_name: e.target.value })}
                                            placeholder="Nombre"
                                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', color: 'white' }}
                                        />
                                        <input
                                            type="text"
                                            value={orderEditFormData.buyer_phone}
                                            onChange={(e) => setOrderEditFormData({ ...orderEditFormData, buyer_phone: e.target.value })}
                                            placeholder="Teléfono"
                                            style={{ width: '120px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', color: 'white' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>DIRECCIÓN DE ENVÍO</label>
                                    <textarea
                                        value={orderEditFormData.shipping_address}
                                        onChange={(e) => setOrderEditFormData({ ...orderEditFormData, shipping_address: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', color: 'white', minHeight: '80px', resize: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>MONTO NETO ($)</label>
                                    <input
                                        type="number"
                                        value={orderEditFormData.seller_net_amount}
                                        onChange={(e) => setOrderEditFormData({ ...orderEditFormData, seller_net_amount: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', color: 'white' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={updatingOrder === selectedOrderForEdit?.id}
                                    style={{
                                        marginTop: '10px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        padding: '18px',
                                        borderRadius: '16px',
                                        fontWeight: '900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    {updatingOrder === selectedOrderForEdit?.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                    GUARDAR CAMBIOS
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

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
        </div >



    );
};

export default MyStore;
