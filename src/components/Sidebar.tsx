// Sidebar - Clean Version with Search Tab
import { useStore } from '../store/useStore'
import UnifiedQueue from './UnifiedQueue'

interface SidebarProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { colors } = useStore()

    const menuItems = [
        { id: 'library', label: 'Library', icon: '💿' },
        { id: 'dj', label: 'Live DJ', icon: '🎛️' },
        { id: 'search', label: 'Search', icon: '🔍' },
        { id: 'gestures', label: 'Gestures', icon: '👋' },
    ]

    return (
        <div style={{
            width: '260px',
            height: '100%',
            background: 'rgba(20, 20, 20, 0.3)',
            backdropFilter: 'blur(40px) saturate(120%)',
            borderRight: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            padding: '50px 24px',
            zIndex: 50,
            flexShrink: 0,
        }}>
            {/* Logo area */}
            <div style={{
                marginBottom: '40px',
                padding: '0 8px',
                fontSize: '28px',
                fontWeight: 500,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontFamily: '"Times New Roman", serif',
                letterSpacing: '-0.5px',
                fontStyle: 'italic'
            }}>
                <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: `0 0 20px ${colors.primary}40`
                }} />
                ZenFlow
            </div>

            {/* Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' }}>
                {menuItems.map(item => {
                    const isActive = activeTab === item.id
                    return (
                        <div
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                transform: isActive ? 'translateX(4px)' : 'none'
                            }}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </div>
                    )
                })}
            </div>

            {/* Queue */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <UnifiedQueue />
            </div>
        </div>
    )
}
