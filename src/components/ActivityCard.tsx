import React from 'react';
import { UserPlus, ShoppingBag, MessageSquare, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                width: '100%',
                WebkitTapHighlightColor: 'transparent'
            }}
        >
            <div style={{
                marginBottom: '10px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        backgroundImage: userImage ? `url(${userImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '50%',
                        padding: '5px',
                        display: 'flex',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                    }}>
                        {getIcon()}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>{userName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600' }}>
                            <Clock size={11} />
                            <span>{time}</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: itemName ? '10px' : '0', lineHeight: '1.4', fontWeight: '500' }}>
                        {description}
                    </p>

                    {itemName && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(163, 230, 53, 0.08)',
                            padding: '8px 12px',
                            borderRadius: '14px',
                            border: '1px solid rgba(163, 230, 53, 0.15)',
                            width: 'fit-content',
                            maxWidth: '100%'
                        }}>
                            {itemImage && (
                                <img
                                    src={itemImage}
                                    alt={itemName}
                                    style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                                />
                            )}
                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.2px' }}>
                                {itemName}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ActivityCard;
