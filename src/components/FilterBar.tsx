import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterBarProps {
    label: string;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ label, options, selectedValue, onSelect }) => {
    // Si no hay opciones más allá de "Todos", no mostramos nada
    if (options.length <= 1) return null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '4px',
            width: '100%'
        }}>
            {label && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginLeft: '20px',
                    marginBottom: '-2px'
                }}>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                    }}>
                        {label}
                    </span>
                    <div style={{
                        flex: 1,
                        height: '1px',
                        background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)',
                        marginRight: '20px'
                    }} />
                </div>
            )}

            <div style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                padding: '4px 20px 10px 20px',
                scrollbarWidth: 'none',
                width: '100%',
                WebkitOverflowScrolling: 'touch',
                maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
            }} className="no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {options.map((option, idx) => {
                        const isSelected = selectedValue === option;
                        return (
                            <motion.button
                                key={option}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => onSelect(option)}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '14px',
                                    background: isSelected
                                        ? 'var(--secondary)'
                                        : 'rgba(255,255,255,0.03)',
                                    color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    border: '1px solid ' + (isSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.08)'),
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backdropFilter: isSelected ? 'none' : 'blur(10px)',
                                    boxShadow: isSelected
                                        ? '0 8px 16px rgba(163, 230, 53, 0.2)'
                                        : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <span style={{ position: 'relative', zIndex: 1 }}>
                                    {option === 'Todos' ? 'Todo' : option}
                                </span>
                                {isSelected && (
                                    <motion.div
                                        layoutId="active-pill"
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                            zIndex: 0
                                        }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FilterBar;

