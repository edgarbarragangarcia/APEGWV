import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAddress: string;
    onConfirm: (address: string, deptId?: number, cityId?: number) => void;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, currentAddress, onConfirm }) => {
    const [details, setDetails] = useState({
        street: '',
        city: '',
        dept: '',
        zip: ''
    });

    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

    const [deptSearch, setDeptSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [showDeptList, setShowDeptList] = useState(false);
    const [showCityList, setShowCityList] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
            if (currentAddress) {
                const parts = currentAddress.split(',').map(p => p.trim());
                setDetails({
                    street: parts[0] || '',
                    city: parts[1] || '',
                    dept: parts[2] || '',
                    zip: parts[3] || ''
                });
                setDeptSearch(parts[2] || '');
                setCitySearch(parts[1] || '');
            }
        }
    }, [isOpen]);

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('id, name')
                .order('name');
            if (error) throw error;
            setDepartments(data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const fetchCities = async (deptId: number) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('id, name')
                .eq('department_id', deptId)
                .order('name');
            if (error) throw error;
            setCities(data || []);
        } catch (err) {
            console.error('Error fetching cities:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDeptId) {
            fetchCities(selectedDeptId);
        } else {
            setCities([]);
        }
    }, [selectedDeptId]);

    const filteredDepts = useMemo(() =>
        departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())),
        [departments, deptSearch]
    );

    const filteredCities = useMemo(() =>
        cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())),
        [cities, citySearch]
    );

    const handleConfirm = () => {
        // We favor selected names from IDs if they exist, otherwise use what's in text
        const cityName = citySearch || details.city;
        const deptName = deptSearch || details.dept;

        const fullAddress = [details.street, cityName, deptName, details.zip]
            .filter(Boolean)
            .join(', ');

        onConfirm(fullAddress, selectedDeptId || undefined, selectedCityId || undefined);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 9998
                        }}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            background: '#0E1A11',
                            borderTop: '1px solid rgba(163, 230, 53, 0.2)',
                            borderRadius: '32px 32px 0 0',
                            padding: '30px',
                            paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)',
                            zIndex: 9999,
                            maxWidth: '768px',
                            margin: '0 auto',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>
                                <MapPin size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--secondary)' }} />
                                DIRECCIÓN <span style={{ color: 'var(--secondary)' }}>de</span> ENTREGA
                            </h2>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '18px',
                            overflowY: 'auto',
                            paddingRight: '8px',
                            flex: '1 1 auto',
                            minHeight: 0,
                            marginBottom: '10px'
                        }}>
                            <FormInput
                                label="Calle / Carrera / Apto"
                                value={details.street}
                                onChange={v => setDetails({ ...details, street: v })}
                                placeholder="Ej: Calle 100 #15-30 Apto 402"
                            />

                            {/* Department Selection */}
                            <div className="form-group" style={{ position: 'relative' }}>
                                <Label text="Departamento" />
                                <div
                                    onClick={() => { setShowDeptList(!showDeptList); setShowCityList(false); }}
                                    style={styles.dropdownTrigger}
                                >
                                    <span style={{ color: deptSearch ? 'white' : 'rgba(255,255,255,0.3)' }}>
                                        {deptSearch || 'Selecciona un departamento'}
                                    </span>
                                    <ChevronDown size={16} />
                                </div>
                                <AnimatePresence>
                                    {showDeptList && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            style={styles.dropdownList}
                                        >
                                            <div style={styles.searchWrapper}>
                                                <Search size={14} />
                                                <input
                                                    autoFocus
                                                    placeholder="Buscar departamento..."
                                                    value={deptSearch}
                                                    onChange={e => setDeptSearch(e.target.value)}
                                                    style={styles.searchInput}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {filteredDepts.map(d => (
                                                    <div
                                                        key={d.id}
                                                        onClick={() => {
                                                            setSelectedDeptId(d.id);
                                                            setDeptSearch(d.name);
                                                            setShowDeptList(false);
                                                            setCitySearch('');
                                                            setSelectedCityId(null);
                                                        }}
                                                        style={styles.listItem}
                                                    >
                                                        {d.name}
                                                    </div>
                                                ))}
                                                {filteredDepts.length === 0 && <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-dim)' }}>No se encontraron resultados</div>}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* City Selection */}
                            <div className="form-group" style={{ position: 'relative' }}>
                                <Label text="Ciudad" />
                                <div
                                    onClick={() => { if (cities.length > 0) setShowCityList(!showCityList); setShowDeptList(false); }}
                                    style={{ ...styles.dropdownTrigger, opacity: cities.length > 0 ? 1 : 0.5, cursor: cities.length > 0 ? 'pointer' : 'not-allowed' }}
                                >
                                    <span style={{ color: citySearch ? 'white' : 'rgba(255,255,255,0.3)' }}>
                                        {citySearch || (selectedDeptId ? 'Busca tu ciudad' : 'Selecciona departamento primero')}
                                    </span>
                                    {loading ? <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <ChevronDown size={16} />}
                                </div>
                                <AnimatePresence>
                                    {showCityList && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            style={styles.dropdownList}
                                        >
                                            <div style={styles.searchWrapper}>
                                                <Search size={14} />
                                                <input
                                                    autoFocus
                                                    placeholder="Buscar ciudad..."
                                                    value={citySearch}
                                                    onChange={e => setCitySearch(e.target.value)}
                                                    style={styles.searchInput}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {filteredCities.map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => {
                                                            setSelectedCityId(c.id);
                                                            setCitySearch(c.name);
                                                            setShowCityList(false);
                                                        }}
                                                        style={styles.listItem}
                                                    >
                                                        {c.name}
                                                    </div>
                                                ))}
                                                {filteredCities.length === 0 && <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-dim)' }}>No se encontraron resultados</div>}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <FormInput
                                label="Código Postal"
                                value={details.zip}
                                onChange={v => setDetails({ ...details, zip: v })}
                                placeholder="110111"
                            />
                        </div>

                        <div style={styles.footer}>
                            <button
                                onClick={handleConfirm}
                                style={styles.confirmButton}
                            >
                                <Check size={20} />
                                CONFIRMAR DIRECCIÓN
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const FormInput = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div className="form-group">
        <Label text={label} />
        <input
            type="text"
            className="glass"
            style={styles.input}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

const Label = ({ text }: { text: string }) => (
    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{text}</label>
);

const styles = {
    input: {
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        color: 'white',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '15px',
        outline: 'none'
    },
    dropdownTrigger: {
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        color: 'white',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
    },
    dropdownList: {
        position: 'absolute' as 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        background: '#1A2E1F',
        borderRadius: '16px',
        border: '1px solid rgba(163, 230, 53, 0.2)',
        zIndex: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        overflow: 'hidden'
    },
    searchWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.02)'
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '14px',
        width: '100%',
        outline: 'none'
    },
    listItem: {
        padding: '12px 16px',
        fontSize: '14px',
        color: 'white',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        transition: 'background 0.2s'
    },
    footer: {
        paddingTop: '20px',
        paddingBottom: '10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: '#0E1A11',
        flexShrink: 0
    },
    confirmButton: {
        width: '100%',
        background: 'var(--secondary)',
        color: 'var(--primary)',
        padding: '18px',
        borderRadius: '18px',
        fontWeight: '900',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        letterSpacing: '0.5px',
        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)',
        fontSize: '15px'
    }
};

export default AddressModal;
