import React from 'react';

/**
 * Sidebar Component
 * Renders the logo, navigation links, and settings.
 * Supports mobile slide transitions and close toggle integrations.
 */
function Sidebar({
    activeTab = 'live-debugger',
    onTabChange,
    isOpen,
    onClose,
    solutionsCount = 128,
    selectedTag = null,
    onTagChange = () => { },
    autoIndex = true,
    onAutoIndexToggle = () => { }
}) {
    const menuItems = [
        {
            id: 'live-debugger',
            label: 'Live Debugger',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m8 2 8 8-8 8" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="M12 12V2" />
                </svg>
            )
        },
        {
            id: 'memory-vault',
            label: 'Memory Vault',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    <path d="M12 10v6" />
                    <path d="M9 13h6" />
                </svg>
            )
        },
        {
            id: 'history',
            label: 'History',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            )
        }
    ];

    const tags = ['#nextjs-14', '#prisma', '#cors', '#docker', '#auth-jwt'];

    return (
        <aside className={`sidebar-container ${isOpen ? 'mobile-open' : ''}`}>
            {/* Brand Header */}
            <div className="sidebar-brand-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sidebar-brand" style={{ paddingBottom: 0 }}>
                        <div className="logo-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M6 21V19" />
                                <path d="M10 21V19" />
                                <path d="M14 21V19" />
                                <path d="M18 21V19" />
                                <path d="M6 7V5" />
                                <path d="M10 7V5" />
                                <path d="M14 7V5" />
                                <path d="M18 7V5" />
                            </svg>
                        </div>
                        <span className="brand-text">RecallDev</span>
                    </div>

                    {/* Mobile Close Button */}
                    <button className="btn-close-sidebar" onClick={onClose} aria-label="Close menu">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <span className="meta-matches-badge" style={{ fontSize: '10px', backgroundColor: 'var(--accent-purple-light)', border: '1px solid var(--accent-purple-border)', color: 'var(--accent-purple-border)', padding: '2px 8px', borderRadius: '12px', marginLeft: '12px' }}>
                    {solutionsCount} Solutions Indexed
                </span>
            </div>

            {/* Quick action + shortcut trigger */}
            <div style={{ padding: '0 12px 16px 12px' }}>
                <button
                    onClick={() => {
                        onTabChange && onTabChange('memory-vault');
                        setTimeout(() => {
                            const addBtn = document.querySelector('.btn-add-memory');
                            if (addBtn) addBtn.click();
                        }, 100);
                        onClose && onClose();
                    }}
                    className="btn-action btn-primary"
                    style={{ width: '100%', justifyContent: 'space-between', height: '36px', padding: '0 12px' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        <span>New Memory</span>
                    </span>
                    <kbd style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                        ⌘K
                    </kbd>
                </button>
            </div>

            {/* Navigation List */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => {
                                onTabChange && onTabChange(item.id);
                                onClose && onClose();
                            }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {isActive && <div className="active-indicator" />}
                        </button>
                    );
                })}
            </nav>

            {/* Quick Filters tags list */}
            <div style={{ marginTop: '20px', padding: '0 12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                    Quick Filters
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {tags.map((tag) => {
                        const isSelected = selectedTag === tag;
                        return (
                            <button
                                key={tag}
                                onClick={() => onTagChange && onTagChange(isSelected ? null : tag)}
                                style={{
                                    background: isSelected ? 'var(--accent-purple-light)' : 'var(--bg-app)',
                                    border: isSelected ? '1px solid var(--accent-purple-border)' : '1px solid var(--border-color)',
                                    color: isSelected ? 'var(--accent-purple-border)' : 'var(--text-secondary)',
                                    fontSize: '10px',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-mono)'
                                }}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer Area with Settings */}
            <div className="sidebar-footer">
                <button
                    className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => {
                        onTabChange && onTabChange('settings');
                        onClose && onClose();
                    }}
                >
                    <span className="nav-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </span>
                    <span className="nav-label">Settings</span>
                    {activeTab === 'settings' && <div className="active-indicator" />}
                </button>

                {/* Auto-Indexing switch */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderTop: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Auto-Indexing</span>
                    <button
                        onClick={onAutoIndexToggle}
                        style={{
                            width: '32px',
                            height: '18px',
                            borderRadius: '10px',
                            backgroundColor: autoIndex ? 'var(--accent-green)' : 'var(--border-color)',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.2s',
                            padding: '1px'
                        }}
                    >
                        <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                            position: 'absolute',
                            left: autoIndex ? '15px' : '1px',
                            top: '1px',
                            transition: 'left 0.2s'
                        }} />
                    </button>
                </div>

                {/* User Profile Badge */}
                <div className="sidebar-user-card">
                    <div className="user-avatar">JD</div>
                    <div className="user-details">
                        <span className="user-name">dev_root</span>
                        <span className="user-plan">PRO ACCESS</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
