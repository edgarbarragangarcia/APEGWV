import React from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/Card';
import { ChevronLeft, ChevronRight, Info, Target, History } from 'lucide-react';
import type { GolfCourse } from '../data/courses';

const Round: React.FC = () => {
    const location = useLocation();
    const { course, recorrido } = (location.state as { course?: GolfCourse; recorrido?: string }) || {};

    const clubName = course?.club || 'Club de Golf';
    const fieldName = recorrido ? `${course?.name} - ${recorrido}` : (course?.name || 'Recorrido Principal');
    return (
        <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px' }}>{clubName}</h1>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{fieldName} • Par 72</p>
                    </div>
                </div>
                <button style={{ color: 'var(--secondary)' }}>Finalizar</button>
            </header>

            {/* Hole Selector */}
            <div className="glass" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 25px',
                marginBottom: '20px'
            }}>
                <button><ChevronLeft /></button>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: '600' }}>HOYO</span>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>4</div>
                    <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Par 4 • Hcp 8</span>
                </div>
                <button><ChevronRight /></button>
            </div>

            {/* GPS Distances */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FRONT</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>142</span>
                </div>

                <div className="glass flex-center" style={{
                    height: '140px',
                    flexDirection: 'column',
                    border: '2px solid var(--secondary)',
                    boxShadow: '0 0 20px rgba(163, 230, 53, 0.2)'
                }}>
                    <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: '600' }}>CENTER</span>
                    <span style={{ fontSize: '48px', fontWeight: '800' }}>158</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-dim)' }}>
                        <Target size={12} /> m
                    </div>
                </div>

                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>BACK</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>171</span>
                </div>
            </div>

            {/* Simulated Course Visualization */}
            <Card style={{ padding: 0, height: '300px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, #1a4d35, #0a261a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    {/* Mock hole visualization */}
                    <div style={{
                        width: '120px',
                        height: '220px',
                        background: 'rgba(163, 230, 53, 0.2)',
                        borderRadius: '60px',
                        border: '2px dashed rgba(255,b255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px'
                    }}>
                        <div style={{ width: '40px', height: '40px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }} />
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%' }} />
                    </div>

                    <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                        <button className="glass" style={{ padding: '8px' }}><Info size={16} /></button>
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' }}>
                        Viento: 12km/h NO
                    </div>
                </div>
            </Card>

            {/* Quick Score */}
            <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Golpes Hoyo 4</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
                    <button className="glass" style={{ width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px' }}>-</button>
                    <div style={{ fontSize: '40px', fontWeight: '700' }}>0</div>
                    <button className="glass" style={{ width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', borderColor: 'var(--secondary)' }}>+</button>
                </div>
            </div>
        </div>
    );
};

export default Round;
