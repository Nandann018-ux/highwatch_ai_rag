const API_URL = "";

// ── Constants ──
const SHARED_TEST_FOLDER = {
    url: "https://drive.google.com/drive/folders/1nAddt9FZxKXFBPaNXAf-nRNnMf9JRvig?usp=sharing",
    id: "1nAddt9FZxKXFBPaNXAf-nRNnMf9JRvig"
};

// ── DOM Interface ──
const els = {
    navLinks: document.querySelectorAll('.nav-link[data-page]'),
    pages: document.querySelectorAll('.page-container'),
    // Header
    header: document.getElementById('workspace-header'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    
    // Local Tabs
    tabLinks: document.querySelectorAll('.tab-link'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // Stats
    statusDot: document.getElementById('status-dot'),
    kpiAuth: document.getElementById('kpi-auth'),
    kpiDocs: document.getElementById('kpi-docs'),
    kpiChunks: document.getElementById('kpi-chunks'),
    kpiDocsOv: document.getElementById('kpi-docs-ov'),
    kpiChunksOv: document.getElementById('kpi-chunks-ov'),
    
    // Checklist
    checkItems: {
        auth: document.getElementById('check-auth'),
        index: document.getElementById('check-index'),
        library: document.getElementById('check-library'),
        ask: document.getElementById('check-ask')
    },
    demoSandbox: document.getElementById('demo-sandbox-zone'),
    
    // Drawer
    drawer: document.getElementById('context-drawer'),
    drawerTitle: document.getElementById('drawer-title'),
    drawerContent: document.getElementById('drawer-content'),
    
    // Sync Components
    btnConnect: document.getElementById('btn-connect'),
    btnDisconnect: document.getElementById('btn-disconnect'),
    btnSync: document.getElementById('btn-sync'),
    btnSyncDemo: document.getElementById('btn-sync-demo'),
    btnHeroDemo: document.getElementById('btn-hero-demo'),
    btnHeroSync: document.getElementById('btn-hero-sync'),
    folderInput: document.getElementById('folder-link'),
    heroFolderInput: document.getElementById('hero-folder-link'),
    
    // Library Components
    docsTableBody: document.getElementById('docs-table-body'),
    docCountLabel: document.getElementById('doc-count-label'),
    
    // Ask Components
    chatHistory: document.getElementById('chat-history'),
    chatInput: document.getElementById('chat-input'),
    btnSend: document.getElementById('btn-send'),
    quickPrompts: document.getElementById('quick-prompts'),
    
    // Settings Components
    depthSlider: document.getElementById('depth-slider'),
    depthBadge: document.getElementById('depth-badge'),
    
    // Maintenance
    btnClear: document.getElementById('btn-clear'),
    themeToggle: document.getElementById('theme-toggle'),
};

// ── Application State ──
let state = {
    activePage: 'overview',
    activeTabs: {
        'sync': 'auth'
    },
    theme: 'light',
    isSyncing: false,
    lastDebug: [],
    retrieverDepth: 5,
    systemReady: {
        auth: false,
        indexed: false,
        hasLibrary: false,
        hasAsked: false
    }
};

// ── Initialization ──
function init() {
    setupNavigation();
    setupLocalTabs();
    setupEventListeners();
    fetchSystemStatus();
    loadPreferences();
}

function setupNavigation() {
    els.navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const pageId = link.getAttribute('data-page');
            navigateTo(pageId);
        });
    });
}

function navigateTo(id) {
    state.activePage = id;
    
    // Update Sidebar
    els.navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-page') === id));
    
    // Update Content
    els.pages.forEach(p => p.classList.toggle('hidden', p.id !== `page-${id}`));
    
    // Update Header Context
    const meta = {
        'overview': { title: '', sub: '' },
        'sync': { title: 'Sync Center', sub: 'Connect your Google Drive and synchronize document sources.' },
        'documents': { title: 'Knowledge Library', sub: 'Browse and manage your neural-indexed document corpus.' },
        'ask': { title: 'Ask AI Assistant', sub: 'Query your documents using grounded retrieval intelligence.' },
        'settings': { title: 'System Settings', sub: 'Configure pipeline depth and maintain the knowledge index.' }
    };
    
    // Hide header entirely for overview and sync
    if (els.header) els.header.style.display = (id === 'overview' || id === 'sync') ? 'none' : 'flex';
    
    const info = meta[id] || { title: 'Workspace', sub: '' };
    els.pageTitle.textContent = info.title;
    els.pageSubtitle.textContent = info.sub;
    
    // Auto-open drawer for specific pages
    if (id === 'sync' || id === 'ask') {
        openContextDrawer(id);
    } else {
        toggleDrawer(false);
    }
    
    if (id === 'documents') fetchLibrary();
    if (id === 'ask') els.chatInput.focus();
}

function setupLocalTabs() {
    els.tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            const pageId = state.activePage;
            const tabId = tab.getAttribute('data-tab');
            switchLocalTab(pageId, tabId);
        });
    });
}

function switchLocalTab(pageId, tabId) {
    state.activeTabs[pageId] = tabId;
    
    // Update Tab UI
    els.tabLinks.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
    els.tabPanes.forEach(p => p.classList.toggle('hidden', p.id !== `${pageId}-tab-${tabId}`));
}

function openContextDrawer(pageId) {
    els.drawerTitle.textContent = `${pageId.toUpperCase()} MONITOR`;
    els.drawerContent.innerHTML = '';
    
    const tplId = `tpl-drawer-${pageId}`;
    const tpl = document.getElementById(tplId);
    if (tpl) {
        els.drawerContent.appendChild(tpl.content.cloneNode(true));
        toggleDrawer(true);
        if (pageId === 'ask' && state.lastDebug.length) renderRetrievalDebug(state.lastDebug);
    }
}

function toggleDrawer(open) {
    if (els.drawer) els.drawer.classList.toggle('open', open);
}

// ── System API ──
async function fetchSystemStatus() {
    try {
        const res = await fetch(`${API_URL}/status`);
        const data = await res.json();
        
        state.systemReady.auth = data.drive_connected;
        state.systemReady.indexed = (data.total_chunks_indexed > 0);
        state.systemReady.hasLibrary = (data.unique_documents > 0);
        
        if (data.drive_connected) {
            if (els.kpiAuth) els.kpiAuth.textContent = 'Active';
            if (els.statusDot) els.statusDot.className = 'dot dot-live';
            if (els.btnConnect) els.btnConnect.textContent = 'Reconnect Account';
            if (els.btnDisconnect) els.btnDisconnect.disabled = false;
            if (els.btnSync) els.btnSync.disabled = false;
        } else {
            if (els.kpiAuth) els.kpiAuth.textContent = 'Inactive';
            if (els.statusDot) els.statusDot.className = 'dot';
            if (els.btnDisconnect) els.btnDisconnect.disabled = true;
        }

        const docCount = data.unique_documents || 0;
        const chunkCount = data.total_chunks_indexed || 0;

        if (els.kpiDocs) els.kpiDocs.textContent = docCount;
        if (els.kpiChunks) els.kpiChunks.textContent = chunkCount;
        if (els.kpiDocsOv) els.kpiDocsOv.textContent = docCount;
        if (els.kpiChunksOv) els.kpiChunksOv.textContent = chunkCount;
        
        const isReady = data.faiss_index_exists;
        els.chatInput.disabled = !isReady;
        els.btnSend.disabled = !isReady;
        els.btnClear.disabled = !isReady;
        
        updateOnboardingUI();
        if (isReady) fetchQuickPrompts();
    } catch (e) {}
}

function updateOnboardingUI() {
    const s = state.systemReady;
    const isReady = s.indexed;
    
    // Checklist items
    if (els.checkItems.auth) els.checkItems.auth.classList.toggle('complete', s.auth || s.indexed);
    if (els.checkItems.index) els.checkItems.index.classList.toggle('complete', s.indexed);
    if (els.checkItems.library) els.checkItems.library.classList.toggle('complete', s.hasLibrary);
    if (els.checkItems.ask) els.checkItems.ask.classList.toggle('complete', s.hasAsked);

    // Demo Sandbox visibility
    if (els.demoSandbox) {
        els.demoSandbox.style.opacity = s.indexed ? '1' : '0.4';
        els.demoSandbox.style.pointerEvents = s.indexed ? 'all' : 'none';
    }
}

async function fetchLibrary() {
    try {
        const res = await fetch(`${API_URL}/documents`);
        const docs = await res.json();
        els.docCountLabel.textContent = docs.length;
        
        if (!docs.length) {
            els.docsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 4rem; opacity: 0.5;">No document fragments currently indexed.</td></tr>';
            return;
        }
        
        els.docsTableBody.innerHTML = docs.map(d => `
            <tr>
                <td style="font-weight: 700; color: var(--text-title);">${d.name}</td>
                <td><span class="badge-indigo" style="font-size: 0.65rem;">${d.type}</span></td>
                <td>${d.chunks} Chunks</td>
                <td><span style="color: var(--accent-teal); font-weight: 800; font-size: 0.7rem;">NEURAL ACTIVE</span></td>
            </tr>
        `).join('');
    } catch (e) {}
}

function parseFolderId(raw) {
    if (!raw) return null;
    const match = raw.match(/folders\/([a-zA-Z0-9_-]+)/) || raw.match(/^([a-zA-Z0-9_-]+)$/) || raw.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : raw.trim();
}

async function startSyncPipeline() {
    const fid = parseFolderId(els.folderInput.value);

    setSyncingUI(true);
    logSyncEvent(`[SYSTEM] Initializing intelligent pipeline...`);
    
    try {
        const res = await fetch(`${API_URL}/sync-drive`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder_id: fid })
        });
        const data = await res.json();
        
        if (res.ok) {
            logSyncEvent(`[SUCCESS] Pipeline complete. ${data.files_processed} files ingested.`);
            fetchSystemStatus();
        } else {
            logSyncEvent(`[ERROR] ${data.detail}`);
            alert(`Error: ${data.detail}`);
        }
    } catch (e) {
        logSyncEvent(`[ERROR] Pipeline disruption detected.`);
    } finally {
        setSyncingUI(false);
    }
}

async function indexFromHero() {
    const rawVal = els.heroFolderInput.value.trim();
    if (!rawVal) {
        alert("Please paste a Drive folder link or ID first.");
        return;
    }
    
    const fid = parseFolderId(rawVal);
    navigateTo('sync'); // Jump to sync page to show progress
    switchLocalTab('sync', 'indexing');
    
    els.folderInput.value = fid;
    startSyncPipeline();
}

async function startDemoSync() {
    setSyncingUI(true);
    logSyncEvent(`[SYSTEM] Initializing local demo pipeline...`);
    
    try {
        const res = await fetch(`${API_URL}/sync-demo`, { method: "POST" });
        const data = await res.json();
        
        if (res.ok) {
            logSyncEvent(`[SUCCESS] Demo corpus indexed. ${data.files_processed} docs processed.`);
            fetchSystemStatus();
        } else {
            logSyncEvent(`[ERROR] ${data.detail}`);
        }
    } catch (e) {
        logSyncEvent(`[ERROR] Local pipeline disruption.`);
    } finally {
        setSyncingUI(false);
    }
}

async function copyToClipboard(text, btnId, successMsg = "Copied!") {
    try {
        await navigator.clipboard.writeText(text);
        const btn = document.getElementById(btnId);
        const originalText = btn.textContent;
        btn.textContent = successMsg;
        btn.classList.add('btn-success');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('btn-success');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

function useSharedFolder() {
    els.heroFolderInput.value = SHARED_TEST_FOLDER.id;
    indexFromHero();
}

async function performAIQuery() {
    const query = els.chatInput.value.trim();
    if (!query) return;

    state.systemReady.hasAsked = true;
    updateOnboardingUI();

    appendChatTurn("user", query);
    els.chatInput.value = "";
    els.chatInput.style.height = 'auto';
    els.btnSend.disabled = true;

    const loaderId = "ai-" + Date.now();
    appendChatTurn("ai", "Synthesizing grounded response...", loaderId);

    try {
        const res = await fetch(`${API_URL}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                query: query,
                top_k: state.retrieverDepth 
            }),
        });
        const data = await res.json();
        
        const el = document.getElementById(loaderId);
        if (res.ok) {
            el.querySelector('.chat-text').innerHTML = `
                <div>${data.answer}</div>
                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${data.sources.map(s => `
                        <a href="${s.link}" target="_blank" style="font-size: 0.65rem; color: var(--accent); text-decoration: none; font-weight: 800; border-bottom: 1px solid var(--accent);">REF: ${s.name}</a>
                    `).join('')}
                </div>
            `;
            if (data.debug_chunks) {
                state.lastDebug = data.debug_chunks;
                renderRetrievalDebug(data.debug_chunks);
                toggleDrawer(true);
            }
        } else {
            el.querySelector('.chat-text').textContent = data.detail;
        }
    } catch (e) {
        const el = document.getElementById(loaderId);
        if (el) el.querySelector('.chat-text').textContent = "Neural timeout.";
    } finally {
        els.btnSend.disabled = false;
        els.chatInput.focus();
    }
}

async function fetchQuickPrompts() {
    try {
        const res = await fetch(`${API_URL}/recommend-questions`);
        const data = await res.json();
        if (data.questions) {
            els.quickPrompts.innerHTML = data.questions.map(q => `
                <button class="btn btn-ghost" style="font-size: 0.75rem; white-space: nowrap; padding: 0.4rem 0.8rem;" onclick="prefillQ('${q.replace(/'/g, "\\'")}')">${q}</button>
            `).join('');
        }
    } catch (e) {}
}

// ── UI Helpers ──
function appendChatTurn(role, text, id = null) {
    const turn = document.createElement("div");
    turn.className = `chat-bubble ${role}`;
    if (id) turn.id = id;
    turn.innerHTML = `
        <div class="chat-label">${role === 'ai' ? 'Neural Engine' : 'Your Inquiry'}</div>
        <div class="chat-text">${text}</div>
    `;
    els.chatHistory.appendChild(turn);
    els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
}

function renderRetrievalDebug(chunks) {
    const container = document.getElementById('retrieval-results');
    if (!container || !chunks.length) return;
    container.innerHTML = chunks.map((c, i) => `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.65rem; font-weight: 800; color: var(--text-dim); margin-bottom: 0.75rem;">
                <span>HIT #${i+1}</span>
                <span style="color: var(--accent);">SIMILARITY: ${c.relevance_score.toFixed(4)}</span>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.6; color: var(--text-title); margin-bottom: 0.5rem;">${c.chunk_text}</div>
            <div style="font-size: 0.65rem; font-style: italic; color: var(--text-dim);">${c.file_name}</div>
        </div>
    `).join('');
}

function logSyncEvent(msg) {
    const logContainer = document.getElementById('sync-logs');
    if (!logContainer) return;
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const row = document.createElement('div');
    row.textContent = `[${time}] ${msg}`;
    logContainer.appendChild(row);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function setSyncingUI(v) {
    state.isSyncing = v;
    if (els.btnSync) els.btnSync.disabled = v;
    if (els.btnSyncDemo) els.btnSyncDemo.disabled = v;
    if (els.btnHeroDemo) els.btnHeroDemo.disabled = v;
    if (els.btnHeroSync) els.btnHeroSync.disabled = v;
    
    if (els.btnHeroSync) els.btnHeroSync.textContent = v ? 'Indexing...' : 'Index Folder';
    if (els.btnHeroDemo) els.btnHeroDemo.textContent = v ? 'Syncing...' : 'Sync Demo Corpus';
}

window.prefillQ = function(q) {
    showPage('ask');
    setTimeout(() => {
        els.chatInput.value = q;
        els.chatInput.focus();
        els.chatInput.dispatchEvent(new Event('input'));
    }, 100);
};

// ── Event Handlers ──
function setupEventListeners() {
    if (els.btnConnect) els.btnConnect.addEventListener('click', () => window.location.href = `/auth/login`);
    if (els.btnDisconnect) els.btnDisconnect.addEventListener('click', async () => {
        if(confirm("Confirm: Sever intelligence source connection?")) {
            await fetch(`/disconnect`, { method: "POST" });
            window.location.reload();
        }
    });
    
    if (els.btnSync) els.btnSync.addEventListener('click', startSyncPipeline);
    if (els.btnSyncDemo) els.btnSyncDemo.addEventListener('click', startDemoSync);
    
    els.btnSend.addEventListener('click', performAIQuery);
    
    // Slider Sync
    if (els.depthSlider) {
        els.depthSlider.addEventListener('input', e => {
            const val = parseInt(e.target.value);
            state.retrieverDepth = val;
            els.depthBadge.textContent = `TOP ${val}`;
            localStorage.setItem('hw_retriever_depth', val);
        });
    }

    els.chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            performAIQuery();
        }
    });

    els.chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    els.btnClear.addEventListener('click', async () => {
        if(confirm("DANGER: Factory reset the neural index? This cannot be reversed.")) {
            await fetch(`/clear-data`, { method: "POST" });
            window.location.reload();
        }
    });

    els.themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme();
    });
}

function applyTheme() {
    document.body.className = state.theme;
    localStorage.setItem('hw_theme_editorial', state.theme);
}

function loadPreferences() {
    const savedTheme = localStorage.getItem('hw_theme_editorial');
    if (savedTheme) {
        state.theme = savedTheme;
        applyTheme();
    }

    const savedDepth = localStorage.getItem('hw_retriever_depth');
    if (savedDepth) {
        const val = parseInt(savedDepth);
        state.retrieverDepth = val;
        if (els.depthSlider) els.depthSlider.value = val;
        if (els.depthBadge) els.depthBadge.textContent = `TOP ${val}`;
    }
}

// Globals
window.showPage = navigateTo;
window.toggleDrawer = toggleDrawer;
window.startDemoSync = startDemoSync;
window.indexFromHero = indexFromHero;

init();
