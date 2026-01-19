import React, { useEffect, useState } from 'react';
import { Search, Filter, Loader2, Store, ShoppingBag } from 'lucide-react';
import Card from '../components/Card';
import { supabase } from '../services/SupabaseManager';
import MyStore from './MyStore';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image_url: string;
    condition?: string;
}

const Shop: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [viewTab, setViewTab] = useState<'marketplace' | 'mystore'>('marketplace');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*');

                if (error) throw error;

                // Map the results to our interface if needed
                const mappedProducts = (data || []).map(p => ({
                    ...p,
                    price: parseFloat(p.price)
                }));

                setProducts(mappedProducts);
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const categories = ['Todo', 'Clubes', 'Bolas', 'Ropa', 'Accesorios', 'Zapatos', 'Otros'];

    const filteredProducts = products.filter(product => {
        // Normalize for robust comparison
        const normalize = (val: string) => val.toLowerCase().trim();
        const activeTabNorm = normalize(activeTab);
        const prodCategoryNorm = normalize(product.category || '');

        // Match category: Handle both English/Spanish variants often found in databases
        const matchesCategory = activeTab === 'Todo' ||
            prodCategoryNorm === activeTabNorm ||
            (activeTab === 'Palos' && prodCategoryNorm === 'clubes') ||
            (activeTab === 'Balls' && prodCategoryNorm === 'bolas') ||
            (activeTab === 'Clothing' && prodCategoryNorm === 'ropa') ||
            (activeTab === 'Accessories' && prodCategoryNorm === 'accesorios');

        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prodCategoryNorm.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade" style={{ paddingBottom: '100px' }}>
            <header style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px' }}>Tienda</h1>
                <p style={{ color: 'var(--text-dim)' }}>Equipamiento premium de la comunidad</p>
            </header>

            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px',
                borderRadius: '16px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={() => setViewTab('marketplace')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '12px',
                        border: 'none',
                        background: viewTab === 'marketplace' ? 'var(--secondary)' : 'transparent',
                        color: viewTab === 'marketplace' ? 'var(--primary)' : 'var(--text-dim)',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <ShoppingBag size={18} /> Marketplace
                </button>
                <button
                    onClick={() => setViewTab('mystore')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '12px',
                        border: 'none',
                        background: viewTab === 'mystore' ? 'var(--secondary)' : 'transparent',
                        color: viewTab === 'mystore' ? 'var(--primary)' : 'var(--text-dim)',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <Store size={18} /> Mi Tienda
                </button>
            </div>

            {viewTab === 'marketplace' ? (
                <>
                    {/* Search Bar */}
                    <div className="glass" style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        <Search size={20} color="var(--text-dim)" />
                        <input
                            type="text"
                            placeholder="Buscar palos, bolas, caddies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                width: '100%',
                                outline: 'none',
                                fontSize: '15px'
                            }}
                        />
                        <Filter size={20} color="var(--secondary)" />
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {categories.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '10px 22px',
                                    borderRadius: '30px',
                                    background: activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-main)',
                                    fontSize: '14px',
                                    fontWeight: activeTab === tab ? '700' : '500',
                                    border: '1px solid ' + (activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    boxShadow: activeTab === tab ? '0 4px 12px rgba(163, 230, 53, 0.2)' : 'none'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {filteredProducts.map(product => (
                            <Card
                                key={product.id}
                                style={{ overflow: 'hidden', padding: 0 }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '0' }}
                                    />
                                    {product.condition && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '10px',
                                            left: '10px',
                                            background: 'rgba(0,0,0,0.6)',
                                            backdropFilter: 'blur(4px)',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            color: 'white'
                                        }}>
                                            {product.condition}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '15px' }}>
                                    <h4 style={{
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        lineHeight: '1.2',
                                        marginBottom: '8px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {product.name}
                                    </h4>

                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={{
                                            background: 'rgba(163, 230, 53, 0.1)',
                                            color: 'var(--secondary)',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block'
                                        }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{product.category}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <MyStore />
            )}
        </div>
    );
};

export default Shop;
