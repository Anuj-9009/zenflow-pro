// Desktop Sidebar
// Glassmorphism, Fixed Position, Draggable Region support

import { useStore } from '../store/useStore'

interface SidebarProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { colors } = useStore()

    const menuItems = [
        { id: 'library', label: 'Library', icon: '💿' },
        { id: 'search', label: 'Search', icon: '🔍' },
        { id: 'dj', label: 'Live DJ', icon: '🎛️' },
        { id: 'slowed', label: 'Slowed + Reverb', icon: '🎹' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ]

    return (
        <div style={{
            width: '260px', // Slightly wider for elegance
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            background: 'rgba(20, 20, 20, 0.3)', // Darker base
            backdropFilter: 'blur(40px) saturate(120%)', // Deep frost
            borderRight: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            padding: '50px 24px', // More breathing room
            zIndex: 50,
            // Allow clicking but top area is draggable in App.tsx
        }}>
            {/* Logo area */}
            <div style={{
                marginBottom: '60px',
                padding: '0 8px',
                fontSize: '28px', // Larger
                fontWeight: 500, // Lighter weight for serif
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontFamily: '"Times New Roman", serif', // Trendy serif
                letterSpacing: '-0.5px',
                fontStyle: 'italic'
            }}>
                <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%', // Circle looks more organic
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: `0 0 20px ${colors.primary}40`
                }} />
                ZenFlow
            </div>

            {/* Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map(item => {
                    const isActive = activeTab === item.id
                    return (
                        <div
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '14px 16px',
                                borderRadius: '16px', // Heavy rounded
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', // Liquid easing
                                background: isActive ? `rgba(255,255,255,0.06)` : 'transparent',
                                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                                transform: isActive ? 'translateX(8px)' : 'none', // Drift effect
                                marginTop: item.id === 'settings' ? 'auto' : undefined // Push settings to bottom? No, just keep list
                            }}
                            onMouseEnter={e => {
                                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                            }}
                            onMouseLeave={e => {
                                if (!isActive) e.currentTarget.style.background = 'transparent'
                            }}
                        >
                            <span style={{ fontSize: '20px', opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                            <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0.3px' }}>{item.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
