import React from 'react';
import { motion } from 'framer-motion';

interface FilterBarProps {
    label: string;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ label, options, selectedValue, onSelect }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '4px'
        }}>
            {label && (
                <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.4)',
                    marginLeft: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {label}
                </span>
            )}
            <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                paddingLeft: '20px',
                paddingRight: '20px',
                scrollbarWidth: 'none',
                width: '100%',
                WebkitOverflowScrolling: 'touch'
            }} className="no-scrollbar">
                {options.map((option) => (
                    <motion.button
                        key={option}
                        onClick={() => onSelect(option)}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '16px',
                            background: selectedValue === option ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                            color: selectedValue === option ? 'var(--primary)' : 'white',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid ' + (selectedValue === option ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {option === 'Todos' ? 'Todo' : option}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default FilterBar;
