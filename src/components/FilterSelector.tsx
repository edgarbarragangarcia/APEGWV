import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FilterSelectorProps {
    label: string;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const FilterSelector: React.FC<FilterSelectorProps> = ({ label, options, selectedValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (options.length <= 1) return null;

    return (
        <div style={{
            padding: '0 20px',
            marginBottom: '8px',
            zIndex: isOpen ? 100 : 1
        }}>
            <motion.div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '12px 18px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: '900',
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px'
                    }}>
                        {label}
                    </span>
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '800',
                        color: 'white'
                    }}>
                        {selectedValue === 'Todos' ? 'Todo' : selectedValue}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <ChevronDown size={20} color="var(--secondary)" />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        style={{
                            overflow: 'hidden',
                            borderRadius: '24px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div style={{
                            padding: '12px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px'
                        }}>
                            {options.map((option) => {
                                const isSelected = selectedValue === option;
                                return (
                                    <motion.button
                                        key={option}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            onSelect(option);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            padding: '10px 4px',
                                            borderRadius: '12px',
                                            background: isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.03)',
                                            color: isSelected ? 'var(--primary)' : 'white',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            border: '1px solid ' + (isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.05)'),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {option === 'Todos' ? 'Todo' : option}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FilterSelector;
