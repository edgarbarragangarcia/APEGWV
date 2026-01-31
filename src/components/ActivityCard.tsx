import React from 'react';
import { UserPlus, ShoppingBag, MessageSquare, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './Card';

export type ActivityType = 'registration' | 'product' | 'offer';

interface ActivityCardProps {
    type: ActivityType;
    userName: string;
    userImage?: string;
    description: string;
    time: string;
    itemName?: string;
    itemImage?: string;
    onClick?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
    type,
    userName,
    userImage,
    description,
    time,
    itemName,
    itemImage,
    onClick
}) => {
    const getIcon = () => {
        switch (type) {
            case 'registration':
                return <UserPlus size={14} color="var(--secondary)" />;
            case 'product':
                return <ShoppingBag size={14} color="var(--accent)" />;
            case 'offer':
                return <MessageSquare size={14} color="#10b981" />;
            default:
                return null;
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default', width: '100%' }}
        >
            <Card style={{
                marginBottom: '10px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
            }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        backgroundImage: userImage ? `url(${userImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '2px solid var(--glass-border)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        padding: '4px',
                        display: 'flex',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                    }}>
                        {getIcon()}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{userName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '10px' }}>
                            <Clock size={10} />
                            <span>{time}</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: itemName ? '8px' : '0', lineHeight: '1.4' }}>
                        {description}
                    </p>

                    {itemName && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            {itemImage && (
                                <img
                                    src={itemImage}
                                    alt={itemName}
                                    style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                                />
                            )}
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {itemName}
                            </span>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default ActivityCard;
