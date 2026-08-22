import React, { useState } from 'react';

/**
 * MemoryVault Component - Step 8: Layout and Search Component
 * Renders the search bar and sets up columns.
 */
function MemoryVault() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('#492');

    return (
        <div className="vault-pane-container">
            {/* Search and Filters Bar */}
            <div className="vault-top-bar">
                <div className="vault-search-container">
                    <span className="search-icon-wrapper">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="vault-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search memories by error, tag, or project..."
                    />
                    <button className="btn-filter-vault" aria-label="Filter parameters">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14" />
                            <line x1="4" y1="10" x2="4" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12" y2="3" />
                            <line x1="20" y1="21" x2="20" y2="16" />
                            <line x1="20" y1="12" x2="20" y2="3" />
                            <line x1="1" y1="14" x2="7" y2="14" />
                            <line x1="9" y1="8" x2="15" y2="8" />
                            <line x1="17" y1="16" x2="23" y2="16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Grid Workspace */}
            <div className="vault-workspace-grid">
                <div className="vault-table-column">
                    <div className="placeholder-box">
                        Vault Table Grid Placeholder (Search: "{searchQuery}")
                    </div>
                </div>

                <div className="vault-details-column">
                    <div className="placeholder-box">
                        Selected Item: {selectedItemId} Details Placeholder
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemoryVault;
