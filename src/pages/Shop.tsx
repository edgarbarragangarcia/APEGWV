import React, { useEffect, useState } from 'react';
import { Search, Filter, Heart, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import { supabase } from '../services/SupabaseManager';

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

    const filteredProducts = products.filter(product => {
        const matchesCategory = activeTab === 'Todo' || product.category === activeTab;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '25px' }}>
                <h1 style={{ fontSize: '28px' }}>Marketplace</h1>
                <p style={{ color: 'var(--text-dim)' }}>Equipamiento premium de la comunidad</p>
            </header>

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
                {['Todo', 'Palos', 'Balls', 'Clothing', 'Accessories'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '30px',
                            background: activeTab === tab ? 'var(--secondary)' : 'var(--glass-bg)',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-main)',
                            fontSize: '14px',
                            fontWeight: activeTab === tab ? '600' : '400',
                            border: '1px solid ' + (activeTab === tab ? 'var(--secondary)' : 'var(--glass-border)'),
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab === 'Balls' ? 'Bolas' : tab === 'Clothing' ? 'Ropa' : tab === 'Accessories' ? 'Accesorios' : tab}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(product => (
                    <Card
                        key={product.id}
                        style={{ overflow: 'hidden', padding: '10px' }}
                    >
                        <div style={{ position: 'relative' }}>
                            <img
                                src={product.image_url}
                                alt={product.name}
                                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px' }}
                            />
                            <button style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(0,0,0,0.5)',
                                padding: '8px',
                                borderRadius: '50%',
                                backdropFilter: 'blur(5px)'
                            }}>
                                <Heart size={16} color="white" />
                            </button>
                            {product.condition && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    left: '10px',
                                    background: 'var(--primary)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: '600'
                                }}>
                                    {product.condition}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '12px 5px 5px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '5px', height: '40px', overflow: 'hidden' }}>{product.name}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price)}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{product.category}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Shop;
