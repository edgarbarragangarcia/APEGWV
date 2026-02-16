import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClear: () => void;
    children: React.ReactNode;
    resultsCount: number;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onClear, children, resultsCount }) => {

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 3000
                        }}
                    />

                    {/* Modal Screen */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '85vh',
                            background: '#0a0d0c', // Darker background for the modal
                            borderTopLeftRadius: '40px',
                            borderTopRightRadius: '40px',
                            zIndex: 3001,
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                            padding: '0 0 calc(env(safe-area-inset-bottom) + 20px) 0'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '30px 24px 20px 24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'var(--secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'black'
                                }}>
                                    <SlidersHorizontal size={20} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', margin: 0 }}>Filtros</h2>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Personaliza tu búsqueda</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '24px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {children}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '20px 24px',
                            background: 'rgba(255,255,255,0.02)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={onClear}
                                style={{
                                    flex: '0 0 50px',
                                    height: '54px',
                                    borderRadius: '18px',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    border: 'none'
                                }}
                                title="Limpiar todo"
                            >
                                <RotateCcw size={20} />
                            </button>

                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    height: '54px',
                                    borderRadius: '18px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    fontSize: '16px',
                                    fontWeight: '800',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 10px 20px rgba(163, 230, 53, 0.2)'
                                }}
                            >
                                Mostrar {resultsCount} productos
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FilterModal;
