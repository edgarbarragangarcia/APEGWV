import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import PageHeader from './PageHeader';
import PageHero from './PageHero';

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
        const cityName = citySearch || details.city;
        const deptName = deptSearch || details.dept;

        const fullAddress = [details.street, cityName, deptName, details.zip]
            .filter(Boolean)
            .join(', ');

        onConfirm(fullAddress, selectedDeptId || undefined, selectedCityId || undefined);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="animate-fade" style={pageStyles.pageContainer}>
            <PageHero />
            <div style={pageStyles.headerArea}>
                <PageHeader noMargin title="Dirección de Envío" onBack={onClose} />
            </div>

            <div style={pageStyles.scrollArea}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* Street */}
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
                            style={fieldStyles.dropdownTrigger}
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
                                    style={fieldStyles.dropdownList}
                                >
                                    <div style={fieldStyles.searchWrapper}>
                                        <Search size={14} />
                                        <input
                                            autoFocus
                                            placeholder="Buscar departamento..."
                                            value={deptSearch}
                                            onChange={e => setDeptSearch(e.target.value)}
                                            style={fieldStyles.searchInput}
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
                                                style={fieldStyles.listItem}
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
                            style={{ ...fieldStyles.dropdownTrigger, opacity: cities.length > 0 ? 1 : 0.5, cursor: cities.length > 0 ? 'pointer' : 'not-allowed' }}
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
                                    style={fieldStyles.dropdownList}
                                >
                                    <div style={fieldStyles.searchWrapper}>
                                        <Search size={14} />
                                        <input
                                            autoFocus
                                            placeholder="Buscar ciudad..."
                                            value={citySearch}
                                            onChange={e => setCitySearch(e.target.value)}
                                            style={fieldStyles.searchInput}
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
                                                style={fieldStyles.listItem}
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

                    {/* Zip Code */}
                    <FormInput
                        label="Código Postal"
                        value={details.zip}
                        onChange={v => setDetails({ ...details, zip: v })}
                        placeholder="110111"
                    />

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        style={fieldStyles.confirmButton}
                    >
                        <MapPin size={18} />
                        CONFIRMAR DIRECCIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div className="form-group">
        <Label text={label} />
        <input
            type="text"
            className="glass"
            style={fieldStyles.input}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

const Label = ({ text }: { text: string }) => (
    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' as 'uppercase', letterSpacing: '0.5px' }}>{text}</label>
);

const pageStyles = {
    pageContainer: {
        position: 'fixed' as 'fixed',
        inset: 0,
        width: '100%',
        maxWidth: 'var(--app-max-width)',
        margin: '0 auto',
        overflow: 'hidden',
        background: 'var(--primary)',
        zIndex: 2000,
    },
    headerArea: {
        position: 'absolute' as 'absolute',
        top: 'var(--header-offset-top)',
        left: '0',
        right: '0',
        width: '100%',
        zIndex: 900,
        background: 'transparent',
        paddingLeft: '20px',
        paddingRight: '20px',
        pointerEvents: 'auto' as 'auto',
    },
    scrollArea: {
        position: 'absolute' as 'absolute',
        top: 'calc(var(--header-offset-top) + 58px)',
        left: '0',
        right: '0',
        bottom: 0,
        overflowY: 'auto' as 'auto',
        padding: '0 20px 120px 20px',
        overflowX: 'hidden' as 'hidden',
    },
};

const fieldStyles = {
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        color: 'white',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '14px',
        outline: 'none'
    },
    dropdownTrigger: {
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        color: 'white',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
    },
    dropdownList: {
        marginTop: '8px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(163, 230, 53, 0.2)',
        zIndex: 10,
        overflow: 'hidden'
    },
    searchWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
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
    confirmButton: {
        marginTop: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '16px',
        borderRadius: '14px',
        background: 'var(--secondary)',
        color: 'var(--primary)',
        border: 'none',
        fontWeight: '900',
        fontSize: '15px',
        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)',
        width: '100%',
        letterSpacing: '0.5px',
        cursor: 'pointer'
    }
};

export default AddressModal;
