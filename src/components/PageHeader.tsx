import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    showBack?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    onBack,
    rightElement,
    showBack = true
}) => {
    const navigate = useNavigate();
    const handleBack = onBack || (() => navigate(-1));

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'calc(env(safe-area-inset-top, 0px) + 15px)',
            marginBottom: '25px',
            position: 'relative',
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {showBack && (
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                        }}
                        className="hover-scale"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div>
                    <h1 style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        margin: 0,
                        lineHeight: '1.2',
                        textTransform: 'none' // Allow manual capitalization or use specific casing
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
            </div>
            {rightElement && <div>{rightElement}</div>}
        </header>
    );
};

export default PageHeader;
