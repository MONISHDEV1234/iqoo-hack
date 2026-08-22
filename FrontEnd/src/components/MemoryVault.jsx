import React, { useState } from 'react';

/**
 * MemoryVault Component
 * High-fidelity representation of the memory-vault dashboard panel.
 * Features:
 * - Search bar with filter controls.
 * - Interactive data table with custom Tag badges.
 * - Details side-pane showing: Original Error (crashed line logs), Validated Fix (highlighted code blocks), and Notes.
 */
function MemoryVault() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('#492');

    const vaultItems = [
        {
            id: '#492',
            title: 'NullReference in AuthController',
            tag: 'Bug',
            tagType: 'bug',
            project: 'Core API',
            date: '2h ago',
            languages: ['Bug', 'C#', 'Core API'],
            originalError: `System.NullReferenceException: Object reference not set to an instance of an object.
   at CoreAPI.Controllers.AuthController.Login(LoginRequest request)`,
            validatedFix: `// Added null check for user service dependency
if (_userService == null) {
    _logger.LogError("UserService is not registered!");
    return StatusCode(500, "Internal Configuration Error");
}

var user = await _userService.AuthenticateAsync(request);`,
            fixLanguage: 'csharp',
            notes: 'DI container was failing to register the UserService in the staging environment due to a missing interface mapping in Program.cs. Fix applied to both controller and DI setup.'
        },
        {
            id: '#491',
            title: 'Optimize React Render Cycle',
            tag: 'Perf',
            tagType: 'perf',
            project: 'Web App',
            date: 'Yesterday',
            languages: ['Perf', 'React', 'Web App'],
            originalError: `Warning: React has detected a change in the order of Hooks called by App.
   at App (src/App.jsx:12:35)
   at main.jsx:6:21`,
            validatedFix: `// Moved conditional check below hooks to satisfy hook order rules
const [activeTab, setActiveTab] = useState('live-debugger');
const [isReloading, setIsReloading] = useState(false);

// Relocate logic checks below reactive hooks declarations
if (debugMode) {
    console.log("Hook order is now preserved!");
}`,
            fixLanguage: 'javascript',
            notes: 'Hooks must be called at the top level of React functions. Conditional blocks containing hooks were causing React to throw order mismatch warnings.'
        },
        {
            id: '#490',
            title: 'Webpack build fails on prod',
            tag: 'Config',
            tagType: 'config',
            project: 'Web App',
            date: 'Oct 12',
            languages: ['Config', 'Webpack', 'Web App'],
            originalError: `ERROR in ./src/index.js Module not found: Error: Can't resolve './components/App'
webpack compiled with 1 error and 0 warnings`,
            validatedFix: `// Resolved relative import path case mismatch for Linux build systems
import App from './components/App'; // Lowercase folder path: previously './Components/App'`,
            fixLanguage: 'javascript',
            notes: "Production Linux build system is case-sensitive, which failed to resolve components directory capitalized as 'Components'. Corrected path import to lowercase 'components'."
        }
    ];

    // Filter items based on search query
    const filteredItems = vaultItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Retrieve current selected record
    const selectedItem = vaultItems.find(item => item.id === selectedItemId) || vaultItems[0];

    return (
        <div className="vault-pane-container">
            {/* Search and Details Header Row */}
            <div className="vault-top-bar-split">
                {/* Left header: Search bar */}
                <div className="vault-search-header-container">
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

                {/* Right header: selected ID index & share action */}
                <div className="vault-details-header-container">
                    <span className="details-selected-id">{selectedItem.id}</span>
                    <button className="btn-external-link" title="Open details in new context" aria-label="Open solution">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Workspace Split Grid */}
            <div className="vault-workspace-grid">
                {/* Left Column: Repository Items list */}
                <div className="vault-table-column">
                    {/* Table Header Section */}
                    <div className="vault-list-summary-group">
                        <h1 className="vault-pane-title">Vault</h1>
                        <span className="vault-pane-sub text-muted">1,248 Items</span>
                    </div>

                    <div className="vault-items-table-wrapper">
                        <table className="vault-records-table">
                            <thead>
                                <tr>
                                    <th className="th-id">ID</th>
                                    <th className="th-title">TITLE / ERROR</th>
                                    <th className="th-tag">TAG</th>
                                    <th className="th-project">PROJECT</th>
                                    <th className="th-date">DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-table-state">
                                            No records match your query.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => {
                                        const isSelected = selectedItemId === item.id;
                                        return (
                                            <tr
                                                key={item.id}
                                                className={`vault-tr-row ${isSelected ? 'selected' : ''}`}
                                                onClick={() => setSelectedItemId(item.id)}
                                            >
                                                <td className="td-id text-accent">{item.id}</td>
                                                <td className="td-title">{item.title}</td>
                                                <td className="td-tag">
                                                    <span className={`badge-vault-tag ${item.tagType}`}>{item.tag}</span>
                                                </td>
                                                <td className="td-project">{item.project}</td>
                                                <td className="td-date">{item.date}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Selected item code details inspector */}
                <div className="vault-details-column">
                    <div className="vault-details-contents">
                        {/* Title & Languages tag elements */}
                        <div className="details-meta-header">
                            <h2 className="details-item-title">{selectedItem.title}</h2>
                            <div className="details-tags-row">
                                {selectedItem.languages.map((lang, idx) => {
                                    let tagClass = 'tag-lang-gray';
                                    if (lang === 'Bug') tagClass = 'tag-lang-red';
                                    if (lang === 'Perf') tagClass = 'tag-lang-yellow';
                                    if (lang === 'Config') tagClass = 'tag-lang-purple';
                                    return (
                                        <span key={idx} className={`badge-detail-lang ${tagClass}`}>
                                            {lang}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Original Exception block */}
                        <div className="details-section">
                            <h3 className="section-label">ORIGINAL ERROR</h3>
                            <div className="terminal-error-output">
                                <pre className="terminal-pre">{selectedItem.originalError}</pre>
                            </div>
                        </div>

                        {/* Validated Fix Editor block */}
                        <div className="details-section">
                            <h3 className="section-label">VALIDATED FIX</h3>
                            <div className="validated-code-output">
                                <pre className="code-pre">
                                    {selectedItem.fixLanguage === 'csharp' ? (
                                        <code>
                                            <span className="comment">// Added null check for user service dependency</span><br />
                                            <span className="keyword">if</span> (_userService == <span className="null-val">null</span>) {"{"}<br />
                                            {"    "}_logger.LogError(<span className="string">"UserService is not registered!"</span>);<br />
                                            {"    "}<span className="keyword">return</span> StatusCode(<span className="number">500</span>, <span className="string">"Internal Configuration Error"</span>);<br />
                                            {"}"}<br />
                                            <br />
                                            <span className="keyword">var</span> user = <span className="keyword">await</span> _userService.AuthenticateAsync(request);
                                        </code>
                                    ) : (
                                        <code>
                                            {selectedItem.validatedFix}
                                        </code>
                                    )}
                                </pre>
                            </div>
                        </div>

                        {/* Explanatory notes */}
                        <div className="details-section">
                            <h3 className="section-label">NOTES</h3>
                            <p className="details-notes-text">{selectedItem.notes}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemoryVault;
