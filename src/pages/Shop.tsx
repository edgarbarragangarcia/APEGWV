import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Heart } from 'lucide-react';

const products = [
    { id: 1, name: 'TaylorMade Stealth 2 Driver', price: 450, category: 'Palos', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=400', condition: 'Nuevo' },
    { id: 2, name: 'Titleist Pro V1 (12pk)', price: 55, category: 'Bolas', image: 'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=400', condition: 'Nuevo' },
    { id: 3, name: 'Bushnell Phantom 2 GPS', price: 120, category: 'Accesorios', image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=400', condition: 'Usado' },
    { id: 4, name: 'Nike Air Zoom Victory Tour', price: 180, category: 'Ropa', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400', condition: 'Nuevo' },
];

const Shop: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Todo');

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '28px' }}>Marketplace</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Equipamiento premium de la comunidad</p>
                </div>
                <button style={{
                    background: 'var(--secondary)',
                    color: 'var(--primary)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Plus size={24} />
                </button>
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
                {['Todo', 'Palos', 'Bolas', 'Ropa', 'Accesorios', 'Libros'].map(tab => (
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
                        {tab}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                {products.map(product => (
                    <motion.div
                        key={product.id}
                        whileHover={{ y: -5 }}
                        className="glass"
                        style={{ overflow: 'hidden', padding: '10px' }}
                    >
                        <div style={{ position: 'relative' }}>
                            <img
                                src={product.image}
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
                        </div>
                        <div style={{ padding: '12px 5px 5px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '5px', height: '40px', overflow: 'hidden' }}>{product.name}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>{product.price}€</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{product.category}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Shop;
