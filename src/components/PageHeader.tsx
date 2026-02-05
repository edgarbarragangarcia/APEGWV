import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    showBack?: boolean;
    noMargin?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    onBack,
    rightElement,
    showBack = true,
    noMargin = false
}) => {
    const navigate = useNavigate();
    const handleBack = onBack || (() => navigate(-1));

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: noMargin ? '0' : '0', // Default to 0 for standardization
            marginBottom: noMargin ? '4px' : '15px',
            position: 'relative',
            zIndex: 10
        }}>
            <div style={{ flex: 1 }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    margin: 0,
                    lineHeight: '1.2',
                    textTransform: 'none',
                    letterSpacing: '-0.5px'
                }}>
                    {(() => {
                        const words = title.split(' ');
                        if (words.length <= 1) return <span style={{ color: 'white' }}>{title}</span>;
                        return (
                            <>
                                <span style={{ color: 'white' }}>{words[0]} </span>
                                <span style={{ color: 'var(--secondary)' }}>{words[1]}</span>
                                {words.length > 2 && <span style={{ color: 'white' }}> {words.slice(2).join(' ')}</span>}
                            </>
                        );
                    })()}
                </h1>
                {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0, marginTop: '2px' }}>{subtitle}</p>}
            </div>
            {showBack && (
                <button
                    onClick={handleBack}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        marginLeft: '15px'
                    }}
                    className="hover-scale"
                >
                    <ArrowLeft size={20} />
                </button>
            )}
            {rightElement && <div>{rightElement}</div>}
        </header>
    );
};

export default PageHeader;
