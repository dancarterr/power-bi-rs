// app.js - CFL Analysis Interactive Engine

// Map fetched PBIRS reports to our internal report objects
function mapPbirsReports(pbirsValue) {
    return pbirsValue.map(item => {
        let service = (item.Service || item.service || "qualite").toLowerCase();
        const accents = {'é': 'e', 'è': 'e', 'à': 'a', 'ù': 'u', 'ç': 'c', 'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u'};
        for (let k in accents) {
            service = service.split(k).join(accents[k]);
        }
        
        // Construct Web URL exactly as the PowerShell script: $webUrl = "$ReportServerUrl/powerbi$encodedPath"
        const ReportServerUrl = "https://powerbi.cfl.lu/reports";
        const rawPath = item.Path || item.path || "";
        const encodedPath = encodeURIComponent(rawPath);
        const webUrl = `${ReportServerUrl}/powerbi${encodedPath}`;
        
        return {
            id: item.Id || item.id,
            title: item.Name || item.name,
            desc: item.Description || item.description || "",
            pbirsPath: rawPath,
            pbirsUrl: webUrl,
            service: service,
            classification: item.Classification || item.classification || "self-service",
            pssi: item.PSSI || item.pssi || "public",
            tags: item.Tags || item.tags || [],
            owner: item.Owner || item.owner || "",
            frequency: item.Frequency || item.frequency || "Mensuel",
            lastRefresh: item.LastRefresh || item.lastRefresh || "Récemment",
            viewcount: item.ViewCount || item.viewcount || 0,
            adGroups: item.AdGroups || item.adGroups || [],
            steward: item.Steward || item.steward || "",
            custodian: item.Custodian || item.custodian || "",
            summary: item.Summary || item.summary || ""
        };
    });
}



// Audit logs base adjusted for Qualité / Informatique reports
const INITIAL_LOGS = [
    { timestamp: "2026-07-24 10:10", user: "Damien G.", event: "Sync Data Galaxy", target: "Clearing Code 5XX", status: "Succès" },
    { timestamp: "2026-07-24 09:32", user: "Sophie M.", event: "Workflow Partage", target: "Tableau de bord H00 -> L.Faber", status: "Approuvé" },
    { timestamp: "2026-07-24 08:15", user: "Marc W.", event: "Modif. Métadonnées", target: "Qualité des données", status: "Succès" },
    { timestamp: "2026-07-24 07:05", user: "System", event: "Auto-sync Data Galaxy", target: "18 tags synchronisés", status: "Succès" }
];



// 2. Global State Variables and Configuration
const DEFAULT_CONFIG = {
    services: [
        { id: "qualite", label: "Qualité", color: "#00a896" },
        { id: "informatique", label: "Informatique", color: "#536dfe" },
        { id: "voyageurs", label: "Activité Voyageur", color: "#007aff" },
        { id: "infra", label: "Gestion Infrastructure", color: "#ff9500" },
        { id: "finances", label: "Finance", color: "#5856d6" },
        { id: "rh", label: "RH", color: "#af52de" },
        { id: "achats", label: "Achats", color: "#dc3545" },
        { id: "juridique", label: "Juridique", color: "#17a2b8" }
    ],
    classifications: [
        { id: "dwh", label: "Certifié DWH", class: "dwh" },
        { id: "self-service", label: "Self-Service", class: "self-service" },
        { id: "public", label: "Public", class: "public" }
    ],
    pssi: [
        { id: "public", label: "Public", class: "public" },
        { id: "interne", label: "Interne", class: "interne" },
        { id: "restreint", label: "Restreint", class: "restreint" },
        { id: "confidentiel", label: "Confidentiel", class: "confidentiel" }
    ]
};

let portalConfig = { ...DEFAULT_CONFIG };
let reports = [];
let logs = [];
let currentRole = "Standard"; // Standard, Steward, Owner, Admin
let activeTab = "dashboard"; // dashboard, catalog, rights, governance
let selectedService = "all";
let selectedClassification = "all";
let selectedPssi = "all"; 
let selectedTags = [];
let searchQuery = "";
let favorites = [];
let history = [];

// Helper to convert hex color to rgba for style injection
function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Dynamically inject styles based on config services
function injectDynamicConfigStyles(config) {
    const styleEl = document.createElement("style");
    let css = "";
    config.services.forEach(s => {
        const rbgLight = hexToRgba(s.color, 0.08);
        css += `
            .service-badge.${s.id} {
                background-color: ${rbgLight} !important;
                color: ${s.color} !important;
            }
            .catalog-service-title.${s.id} {
                border-bottom-color: ${s.color} !important;
            }
        `;
    });
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
}

// Parse custom lightweight YAML
function parseYamlConfig(yamlText) {
    const lines = yamlText.split('\n');
    const config = { services: [], classifications: [], pssi: [] };
    let currentSection = null;
    let currentItem = null;

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) continue;

        if (trimmed.startsWith("services:")) {
            currentSection = "services";
            continue;
        } else if (trimmed.startsWith("classifications:")) {
            currentSection = "classifications";
            continue;
        } else if (trimmed.startsWith("pssi:")) {
            currentSection = "pssi";
            continue;
        }

        if (trimmed.startsWith("-")) {
            if (currentItem && currentSection) {
                config[currentSection].push(currentItem);
            }
            currentItem = {};
        }

        if (trimmed.includes(":")) {
            const colonIdx = trimmed.indexOf(":");
            let key = trimmed.substring(0, colonIdx).replace(/^-/, "").trim();
            let val = trimmed.substring(colonIdx + 1).trim();
            val = val.replace(/^["']|["']$/g, "");
            
            if (currentItem) {
                currentItem[key] = val;
            }
        }
    }
    if (currentItem && currentSection) {
        config[currentSection].push(currentItem);
    }
    return config;
}

// Populate HTML dynamic filters and admin form dropdowns
function initDynamicFilters(config) {
    // 1. Service filter pills
    const serviceFilterContainer = document.getElementById("filter-services-container");
    if (serviceFilterContainer) {
        serviceFilterContainer.innerHTML = `<button class="filter-pill active" data-service="all">Tous</button>`;
        config.services.forEach(s => {
            const btn = document.createElement("button");
            btn.className = "filter-pill";
            btn.setAttribute("data-service", s.id);
            btn.textContent = s.label;
            serviceFilterContainer.appendChild(btn);
        });
        
        // Rebind click listeners
        document.querySelectorAll('#filter-services-container .filter-pill').forEach(pill => {
            pill.addEventListener("click", (e) => {
                document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedService = e.currentTarget.getAttribute("data-service");
                renderCatalog();
            });
        });
    }

    // 2. Classification filter pills
    const classifFilterContainer = document.getElementById("filter-classifications-container");
    if (classifFilterContainer) {
        classifFilterContainer.innerHTML = `<button class="filter-pill active" data-classif="all">Toutes</button>`;
        config.classifications.forEach(c => {
            const btn = document.createElement("button");
            btn.className = "filter-pill";
            btn.setAttribute("data-classif", c.id);
            btn.textContent = c.label;
            classifFilterContainer.appendChild(btn);
        });
        
        document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(pill => {
            pill.addEventListener("click", (e) => {
                document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedClassification = e.currentTarget.getAttribute("data-classif");
                renderCatalog();
            });
        });
    }

    // 3. PSSI filter pills
    const pssiFilterContainer = document.getElementById("filter-pssi-container");
    if (pssiFilterContainer) {
        pssiFilterContainer.innerHTML = `<button class="filter-pill active" data-pssi="all">Toutes</button>`;
        config.pssi.forEach(p => {
            const btn = document.createElement("button");
            btn.className = "filter-pill";
            btn.setAttribute("data-pssi", p.id);
            btn.textContent = p.label;
            pssiFilterContainer.appendChild(btn);
        });
        
        document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(pill => {
            pill.addEventListener("click", (e) => {
                document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedPssi = e.currentTarget.getAttribute("data-pssi");
                renderCatalog();
            });
        });
    }

    // 4. Admin form options
    const adminServiceSelect = document.getElementById("admin-report-service");
    if (adminServiceSelect) {
        adminServiceSelect.innerHTML = "";
        config.services.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.label;
            adminServiceSelect.appendChild(opt);
        });
    }

    const adminClassifSelect = document.getElementById("admin-report-classif");
    if (adminClassifSelect) {
        adminClassifSelect.innerHTML = "";
        config.classifications.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.label;
            adminClassifSelect.appendChild(opt);
        });
    }

    const adminPssiSelect = document.getElementById("admin-report-pssi");
    if (adminPssiSelect) {
        adminPssiSelect.innerHTML = "";
        config.pssi.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.label;
            adminPssiSelect.appendChild(opt);
        });
    }
}

// Fetch and load YAML config
async function loadConfig() {
    try {
        const response = await fetch('config.yaml');
        if (response.ok) {
            const yamlText = await response.text();
            portalConfig = parseYamlConfig(yamlText);
            console.log("Configuration YAML chargée avec succès !");
        }
    } catch (e) {
        console.warn("Impossible de charger config.yaml via fetch, utilisation des configurations par défaut.");
    }
    
    injectDynamicConfigStyles(portalConfig);
    initDynamicFilters(portalConfig);
}

// Update Role-Based Tab Permissions
function updateTabPermissions() {
    const navRights = document.getElementById("nav-rights");
    const navGovernance = document.querySelector('[data-tab-target="governance"]');
    const navAdminConsole = document.querySelector('[data-tab-target="admin-console"]');

    // Gestion des droits: Steward, Owner, Admin
    const hasRightsAccess = (currentRole === "Steward" || currentRole === "Owner" || currentRole === "Admin");
    if (navRights) {
        navRights.style.display = hasRightsAccess ? "flex" : "none";
    }

    // Gestion des rapports: Steward, Owner
    const hasGovernanceAccess = (currentRole === "Steward" || currentRole === "Owner");
    if (navGovernance) {
        navGovernance.style.display = hasGovernanceAccess ? "flex" : "none";
    }

    // Console Admin BI: Admin ONLY
    const hasAdminConsoleAccess = (currentRole === "Admin");
    if (navAdminConsole) {
        navAdminConsole.style.display = hasAdminConsoleAccess ? "flex" : "none";
    }

    // Redirect to dashboard if currently on a forbidden tab
    if (activeTab === "rights" && !hasRightsAccess) {
        switchTab("dashboard");
    }
    if (activeTab === "governance" && !hasGovernanceAccess) {
        switchTab("dashboard");
    }
    if (activeTab === "admin-console" && !hasAdminConsoleAccess) {
        switchTab("dashboard");
    }
}

// 3. Initialize App
document.addEventListener("DOMContentLoaded", async () => {
    await loadConfig();
    await loadState();
    initEventListeners();
    renderAll();
});

// 4. State Persistence Helpers
async function loadState() {
    let loaded = false;
    let isLive = false;

    // 1. Always attempt to fetch from the real PBIRS API endpoint first (real-time) using /api/v2.0/CatalogItems
    try {
        const serverUrl = 'https://powerbi.cfl.lu/reports'; 
        const endpoint = `${serverUrl}/api/v2.0/CatalogItems`;
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include' 
        });

        if (response.ok) {
            const data = await response.json();
            const rawItems = data.value || [];
            
            // Filter items: PowerBIReport or Report (CatalogItemType)
            const filteredItems = rawItems.filter(item => {
                const type = item.Type || item.type || "";
                return type === 'PowerBIReport' || type === 'Report';
            });
            
            reports = mapPbirsReports(filteredItems);
            loaded = true;
            isLive = true;
        } else {
            console.warn(`Real-time PBIRS API returned status: ${response.status}`);
        }
    } catch (e) {
        console.warn("Could not connect to real-time PBIRS API (CORS restriction or network offline). Using local fallback.", e);
    }

    // 2. Fallback to pbirs_reports.json if the live API call failed
    if (!loaded) {
        try {
            const response = await fetch('pbirs_reports.json');
            if (response.ok) {
                const data = await response.json();
                const rawItems = data.value || [];
                const filteredItems = rawItems.filter(item => {
                    const type = item.Type || item.type || "";
                    return type === 'PowerBIReport' || type === 'Report';
                });
                
                reports = mapPbirsReports(filteredItems);
                loaded = true;
            } else {
                console.error("Failed to load reports from PBIRS mock endpoint");
            }
        } catch (e) {
            console.error("Error fetching PBIRS reports:", e);
        }
    }

    // 3. Update the UI connection status badge in real-time
    const badgeText = document.getElementById("header-pbirs-status-text");
    const badgeDot = document.getElementById("header-pbirs-status-dot");
    if (badgeText && badgeDot) {
        if (isLive) {
            badgeText.textContent = "API Live";
            badgeDot.className = "pbirs-status-dot"; // Green dot
            badgeDot.style.backgroundColor = "#34c759";
            badgeDot.style.boxShadow = "0 0 6px rgba(52, 199, 89, 0.6)";
        } else {
            badgeText.textContent = "API Local";
            badgeDot.className = "pbirs-status-dot offline"; // Orange dot
        }
    }

    let needsSave = true;
    reports.forEach((r, idx) => {
        if (!r.steward) {
            r.steward = r.service === "qualite" ? (idx % 2 === 0 ? "Sylvain Rauch" : "Gilles Becker") : "Damien G.";
            needsSave = true;
        }
        if (!r.custodian) {
            r.custodian = r.service === "qualite" ? "Marc Weber" : "Stephane Hoff";
            needsSave = true;
        }
        if (!r.summary) {
            r.summary = `Résumé analytique du rapport : Suivi et pilotage de l'activité ${r.title || ""} pour les équipes CFL.`;
            needsSave = true;
        }
        if (!r.tags || !Array.isArray(r.tags)) {
            r.tags = [];
            needsSave = true;
        }
        if (!r.users || !Array.isArray(r.users)) {
            r.users = idx === 0 ? ["laurent.leclerc@cfl.lu"] : (idx === 3 ? ["jean-paul.weber@cfl.lu"] : []);
            needsSave = true;
        }
        // Seeding for report quality rules simulation
        if (r.id === "rep-13") {
            if (!r.title.includes("(OLD)")) {
                r.title = "Internet - DE (OLD)";
                needsSave = true;
            }
            if (r.lastRefresh !== "14/12/2023 à 10:15") {
                r.lastRefresh = "14/12/2023 à 10:15";
                needsSave = true;
            }
        }
        if (r.id === "rep-33") {
            if (r.lastRefresh !== "02/02/2024 à 09:30") {
                r.lastRefresh = "02/02/2024 à 09:30";
                needsSave = true;
            }
        }
    });

    if (needsSave) {
        saveReportsToStorage();
    }

    evaluateArchiveWorkflow();

    const savedLogs = localStorage.getItem("cfl_bi_logs");
    if (savedLogs) {
        try {
            logs = JSON.parse(savedLogs);
        } catch(e) {
            logs = [...INITIAL_LOGS];
            saveLogsToStorage();
        }
    } else {
        logs = [...INITIAL_LOGS];
        saveLogsToStorage();
    }

    const savedRole = localStorage.getItem("cfl_bi_current_role");
    currentRole = savedRole ? savedRole : "Standard";

    const savedFavs = localStorage.getItem("cfl_bi_favorites");
    favorites = savedFavs ? JSON.parse(savedFavs) : ["rep-12", "rep-18"];
    favorites = favorites.filter(id => reports.some(r => r.id === id));
    if (favorites.length === 0 && reports.length >= 18) {
        const rep12 = reports.find(r => r.id === "rep-12") || reports[0];
        const rep18 = reports.find(r => r.id === "rep-18") || reports[1];
        favorites = [rep12.id, rep18.id];
    }

    const savedHist = localStorage.getItem("cfl_bi_history");
    history = savedHist ? JSON.parse(savedHist) : ["rep-12", "rep-9", "rep-21"];
    history = history.filter(id => reports.some(r => r.id === id));
    if (history.length === 0 && reports.length >= 22) {
        const rep12 = reports.find(r => r.id === "rep-12") || reports[0];
        const rep9 = reports.find(r => r.id === "rep-9") || reports[1];
        const rep21 = reports.find(r => r.id === "rep-21") || reports[2];
        history = [rep12.id, rep9.id, rep21.id];
    }

    // Update Role Selector UI
    setTimeout(() => {
        const selector = document.getElementById("user-role-selector");
        if (selector) {
            selector.value = currentRole;
            updateAvatarIcon();
        }
    }, 50);

    loadRecertifications();
    loadSyncLogs();
}

function saveReportsToStorage() {
    localStorage.setItem("cfl_bi_reports", JSON.stringify(reports));
}

function saveLogsToStorage() {
    localStorage.setItem("cfl_bi_logs", JSON.stringify(logs));
}



function saveFavoritesToStorage() {
    localStorage.setItem("cfl_bi_favorites", JSON.stringify(favorites));
}

function saveHistoryToStorage() {
    localStorage.setItem("cfl_bi_history", JSON.stringify(history));
}

function updateAvatarIcon() {
    const avatar = document.getElementById("user-avatar");
    if (!avatar) return;
    switch (currentRole) {
        case "Steward": avatar.textContent = "DS"; break;
        case "Owner": avatar.textContent = "BO"; break;
        case "Admin": avatar.textContent = "AB"; break;
        default: avatar.textContent = "DG"; break;
    }
}

// 5. DOM Event Listeners binding
function initEventListeners() {
    // Toggle Data Galaxy sync status simulation
    const dgBadge = document.getElementById("header-datagalaxy-badge");
    if (dgBadge) {
        dgBadge.addEventListener("click", () => {
            const dot = document.getElementById("header-dg-status-dot");
            const text = document.getElementById("header-dg-status-text");
            if (dot.classList.contains("error")) {
                dot.classList.remove("error");
                text.textContent = "Synchronisé";
                dgBadge.setAttribute("title", "Cliquez pour simuler une erreur de synchronisation Data Galaxy");
            } else {
                dot.classList.add("error");
                text.textContent = "Erreur";
                dgBadge.setAttribute("title", "Cliquez pour reconnecter à Data Galaxy");
            }
        });
    }

    // Tabs selection in sidebar
    document.querySelectorAll('#nav-prototype-group .nav-item').forEach(item => {
        item.addEventListener("click", (e) => {
            const tabId = e.currentTarget.getAttribute("data-tab-target");
            switchTab(tabId);
        });
    });

    // Role Switcher Simulator
    const roleSelector = document.getElementById("user-role-selector");
    if (roleSelector) {
        roleSelector.addEventListener("change", (e) => {
            currentRole = e.target.value;
            localStorage.setItem("cfl_bi_current_role", currentRole);
            updateAvatarIcon();
            
            // Refresh details drawer if open (permissions changes layout)
            const drawer = document.getElementById("report-drawer");
            if (drawer && drawer.classList.contains("open")) {
                const favBtn = document.getElementById("drawer-fav-action-btn");
                if (favBtn) {
                    const activeId = favBtn.getAttribute("data-report-id");
                    openDrawer(activeId);
                }
            }

            renderAll();
        });
    }

    // Collapsible cards toggle listeners
    const recertToggle = document.getElementById("recert-toggle-header");
    if (recertToggle) {
        recertToggle.addEventListener("click", () => {
            const content = document.getElementById("recert-collapse-content");
            const arrow = recertToggle.querySelector(".toggle-arrow");
            if (content.style.display === "none") {
                content.style.display = "block";
                arrow.style.transform = "rotate(0deg)";
            } else {
                content.style.display = "none";
                arrow.style.transform = "rotate(-90deg)";
            }
        });
    }

    // Anomaly Bug report triggers
    const bugBtn = document.getElementById("viewer-bug-report-btn");
    if (bugBtn) bugBtn.addEventListener("click", openBugReportModal);

    const bugClose = document.getElementById("bug-close-btn");
    const bugCancel = document.getElementById("bug-cancel-btn");
    if (bugClose) bugClose.addEventListener("click", closeBugReportModal);
    if (bugCancel) bugCancel.addEventListener("click", closeBugReportModal);

    const bugSubmit = document.getElementById("bug-submit-btn");
    if (bugSubmit) bugSubmit.addEventListener("click", submitBugReport);

    // Recertify modal triggers
    const recertClose = document.getElementById("recert-close-btn");
    const recertCancel = document.getElementById("recert-cancel-btn");
    if (recertClose) recertClose.addEventListener("click", closeRecertifyModal);
    if (recertCancel) recertCancel.addEventListener("click", closeRecertifyModal);

    const recertSubmit = document.getElementById("recert-submit-btn");
    if (recertSubmit) recertSubmit.addEventListener("click", submitRecertification);

    // Manual sync trigger
    const syncBtn = document.getElementById("admin-sync-now-btn");
    if (syncBtn) syncBtn.addEventListener("click", forceManualSync);

    // Collapsible cards toggle listeners
    const wfToggle = document.getElementById("wf-toggle-header");
    if (wfToggle) {
        wfToggle.addEventListener("click", () => {
            const content = document.getElementById("wf-collapse-content");
            const arrow = wfToggle.querySelector(".toggle-arrow");
            if (content.style.display === "none") {
                content.style.display = "block";
                arrow.style.transform = "rotate(0deg)";
            } else {
                content.style.display = "none";
                arrow.style.transform = "rotate(-90deg)";
            }
        });
    }

    const logsToggle = document.getElementById("logs-toggle-header");
    if (logsToggle) {
        logsToggle.addEventListener("click", () => {
            const content = document.getElementById("logs-collapse-content");
            const arrow = logsToggle.querySelector(".toggle-arrow");
            if (content.style.display === "none") {
                content.style.display = "block";
                arrow.style.transform = "rotate(0deg)";
            } else {
                content.style.display = "none";
                arrow.style.transform = "rotate(-90deg)";
            }
        });
    }

    // Dashboard Links
    document.querySelectorAll('[data-go-to]').forEach(link => {
        link.addEventListener("click", (e) => {
            const targetTab = e.currentTarget.getAttribute("data-go-to");
            const filterType = e.currentTarget.getAttribute("data-filter");
            
            switchTab(targetTab);
            if (filterType === "favorites") {
                searchQuery = "";
                selectedService = "all";
                selectedClassification = "all";
                selectedPssi = "all";
                document.getElementById("catalog-search").value = "";
                filterCatalogByFavorites();
            }
        });
    });

    // Catalog Search
    const searchInput = document.getElementById("catalog-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderCatalog();
        });
    }

    // Service Filters
    document.querySelectorAll('#filter-services-container .filter-pill').forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedService = e.currentTarget.getAttribute("data-service");
            renderCatalog();
        });
    });

    // Classification Filters
    document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedClassification = e.currentTarget.getAttribute("data-classif");
            renderCatalog();
        });
    });

    // PSSI Sensitivity Filters
    document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedPssi = e.currentTarget.getAttribute("data-pssi");
            renderCatalog();
        });
    });

    // Clear Filters Button
    const clearFiltersBtn = document.getElementById("clear-filters-btn");
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", clearCatalogFilters);
    }

    // Drawer Close Buttons
    const drawerClose = document.getElementById("drawer-close-btn");
    const drawerOverlay = document.getElementById("drawer-overlay");
    if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
    if (drawerOverlay) {
        drawerOverlay.addEventListener("click", () => {
            closeDrawer();
            closeReportViewer();
        });
    }

    // Favorite button inside Drawer
    const drawerFavBtn = document.getElementById("drawer-fav-action-btn");
    if (drawerFavBtn) {
        drawerFavBtn.addEventListener("click", () => {
            const reportId = drawerFavBtn.getAttribute("data-report-id");
            toggleFavorite(reportId);
            updateDrawerFavButton(reportId);
        });
    }

    // Direct Report Viewer Triggers
    const openReportBtn = document.getElementById("drawer-open-report-btn");
    if (openReportBtn) {
        openReportBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const reportId = drawerFavBtn.getAttribute("data-report-id");
            openReportViewer(reportId);
        });
    }

    const viewerBackBtn = document.getElementById("viewer-back-btn");
    if (viewerBackBtn) {
        viewerBackBtn.addEventListener("click", closeReportViewer);
    }

    // Rights Management Panel Event Listeners
    const rightsSelect = document.getElementById("rights-select-report");
    if (rightsSelect) {
        rightsSelect.addEventListener("change", () => {
            renderCurrentRightsTable();
        });
    }

    const rightsGrantBtn = document.getElementById("rights-grant-btn");
    if (rightsGrantBtn) {
        rightsGrantBtn.addEventListener("click", grantAccess);
    }

    const matrixSearchInput = document.getElementById("matrix-search-input");
    if (matrixSearchInput) {
        matrixSearchInput.addEventListener("input", renderGlobalMatrix);
    }

    const matrixFilterType = document.getElementById("matrix-filter-type");
    if (matrixFilterType) {
        matrixFilterType.addEventListener("change", renderGlobalMatrix);
    }

    // Administration Form
    const adminSelect = document.getElementById("admin-select-report");
    if (adminSelect) {
        adminSelect.addEventListener("change", (e) => {
            loadReportInAdminForm(e.target.value);
        });
    }

    const adminSaveBtn = document.getElementById("admin-save-btn");
    if (adminSaveBtn) {
        adminSaveBtn.addEventListener("click", saveReportMetadataFromAdmin);
    }

    const adminCancelBtn = document.getElementById("admin-cancel-btn");
    if (adminCancelBtn) {
        adminCancelBtn.addEventListener("click", () => {
            if (adminSelect) loadReportInAdminForm(adminSelect.value);
        });
    }

    // Modern Tag Pills Editor
    initTagEditorEvents();

    // Drawer Tabs Event Listeners
    const drawerTabBtns = document.querySelectorAll(".drawer-tab-btn");
    drawerTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-drawer-tab");
            
            // Remove active classes from buttons and contents
            drawerTabBtns.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".drawer-tab-content").forEach(c => {
                c.classList.remove("active");
                c.style.display = "none";
            });
            
            // Activate current button and content
            btn.classList.add("active");
            const targetContent = document.getElementById(`drawer-tab-content-${tabId}`);
            if (targetContent) {
                targetContent.classList.add("active");
                targetContent.style.display = "block";
            }
        });
    });
}

function switchTab(tabId) {
    activeTab = tabId;
    
    document.querySelectorAll('#nav-prototype-group .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute("data-tab-target") === tabId) {
            item.classList.add('active');
        }
    });

    document.getElementById("section-dashboard").classList.remove("active");
    document.getElementById("section-catalog").classList.remove("active");
    
    const rightsSec = document.getElementById("section-rights");
    if (rightsSec) rightsSec.classList.remove("active");
    
    document.getElementById("section-governance").classList.remove("active");
    
    const adminSec = document.getElementById("section-admin-console");
    if (adminSec) {
        adminSec.classList.remove("active");
    }

    const targetSection = document.getElementById(`section-${tabId}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    if (tabId === "dashboard") {
        renderDashboard();
    } else if (tabId === "catalog") {
        renderCatalog();
    } else if (tabId === "rights") {
        renderRightsPanel();
    } else if (tabId === "governance") {
        renderAdminPanel();
    } else if (tabId === "admin-console") {
        renderAdminConsole();
    }
}

// 6. Rendering Engine
function renderAll() {
    updateTabPermissions();
    renderDashboard();
    renderCatalog();
    if (currentRole === "Steward" || currentRole === "Owner" || currentRole === "Admin") {
        renderRightsPanel();
    }
    renderAdminPanel();
    if (currentRole === "Admin") {
        renderAdminConsole();
    }
}

// --- DASHBOARD RENDERING ---
function renderDashboard() {
    const activeReports = reports.filter(r => !r.isPurged && isUserAuthorizedForReport(r));
    document.getElementById("kpi-total-reports").textContent = activeReports.length;
    
    const certifiedReports = activeReports.filter(r => r.classification === "dwh");
    document.getElementById("kpi-total-certified").textContent = certifiedReports.length;
    
    const activeFavorites = favorites.filter(favId => reports.some(r => r.id === favId && !r.isPurged && isUserAuthorizedForReport(r)));
    document.getElementById("kpi-total-favorites").textContent = activeFavorites.length;

    // Render Favorites List (Dashboard Panel)
    const favListContainer = document.getElementById("dashboard-favorites-list");
    favListContainer.innerHTML = "";
    
    const favReports = activeReports.filter(r => activeFavorites.includes(r.id));
    if (favReports.length === 0) {
        favListContainer.innerHTML = `<p class="text-secondary" style="font-size: 14px; font-style: italic; padding: 10px 0;">Vous n'avez aucun rapport en favori. Allez dans le catalogue pour en ajouter.</p>`;
    } else {
        favReports.forEach(r => {
            const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
            const pssiLabel = r.pssi.toUpperCase();
            const item = document.createElement("div");
            item.className = "list-item-row";
            item.innerHTML = `
                <div class="item-left">
                    <span class="nav-icon" style="color: #ff9500;">
                        <svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </span>
                    <div>
                        <span class="item-title">${r.title}</span>
                        <span class="item-meta"> | Classif: <strong>${classifLabel}</strong> | PSSI: <strong style="color:var(--cfl-crimson);">${pssiLabel}</strong></span>
                    </div>
                </div>
                <span class="service-badge ${r.service}">${r.service.toUpperCase()}</span>
            `;
            item.addEventListener("click", () => openDrawer(r.id));
            favListContainer.appendChild(item);
        });
    }

    // Render Popular / Most Viewed List
    const popularContainer = document.getElementById("dashboard-popular-list");
    popularContainer.innerHTML = "";
    
    const popularReports = [...activeReports].sort((a, b) => b.viewCount - a.viewCount).slice(0, 3);
    popularReports.forEach((r, idx) => {
        const item = document.createElement("div");
        item.className = "list-item-row";
        item.innerHTML = `
            <div class="item-left">
                <span class="item-number">#${idx + 1}</span>
                <div>
                    <span class="item-title">${r.title}</span>
                    <span class="item-meta">${r.viewCount} vues</span>
                </div>
            </div>
            <span class="service-badge ${r.service}">${r.service.toUpperCase()}</span>
        `;
        item.addEventListener("click", () => openDrawer(r.id));
        popularContainer.appendChild(item);
    });

    // Render Recently Viewed History (5 elements as requested)
    const historyContainer = document.getElementById("dashboard-history-list");
    historyContainer.innerHTML = "";
    
    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="text-secondary" style="font-size: 13px; font-style: italic;">Aucun rapport consulté récemment.</p>`;
    } else {
        const historyReports = history
            .map(id => activeReports.find(r => r.id === id))
            .filter(r => r !== undefined)
            .reverse()
            .slice(0, 5); // Extended to 5 elements

        historyReports.forEach(r => {
            const item = document.createElement("div");
            item.className = "list-item-row";
            item.innerHTML = `
                <div class="item-left">
                    <span class="nav-icon" style="color: var(--voyageurs-color);">
                        <svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </span>
                    <span class="item-title">${r.title}</span>
                </div>
                <span class="item-meta">PSSI: <strong>${r.pssi.toUpperCase()}</strong></span>
            `;
            item.addEventListener("click", () => openDrawer(r.id));
            historyContainer.appendChild(item);
        });
    }
}

// --- CATALOGUE RENDERING ---
function renderCatalog() {
    const tagsContainer = document.getElementById("filter-tags-container");
    const allTags = new Set();
    reports.filter(r => !r.isPurged && isUserAuthorizedForReport(r)).forEach(r => r.tags.forEach(t => allTags.add(t)));
    
    const prevSelectedTags = [...selectedTags];
    tagsContainer.innerHTML = "";
    
    allTags.forEach(tag => {
        const isActive = prevSelectedTags.includes(tag);
        const pill = document.createElement("button");
        pill.className = `filter-pill ${isActive ? 'active' : ''}`;
        pill.textContent = tag;
        pill.addEventListener("click", () => toggleTagFilter(tag));
        tagsContainer.appendChild(pill);
    });

    const grid = document.getElementById("catalog-reports-grid");
    grid.innerHTML = "";

    let filteredReports = reports.filter(r => {
        if (r.isPurged || !isUserAuthorizedForReport(r)) return false;
        
        if (selectedService !== "all" && r.service !== selectedService) {
            return false;
        }

        if (selectedClassification !== "all" && r.classification !== selectedClassification) {
            return false;
        }

        if (selectedPssi !== "all" && r.pssi !== selectedPssi) {
            return false;
        }

        if (selectedTags.length > 0) {
            const hasAllTags = selectedTags.every(tag => r.tags.includes(tag));
            if (!hasAllTags) return false;
        }

        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase();
            const matchTitle = r.title.toLowerCase().includes(q);
            const matchDesc = r.desc.toLowerCase().includes(q);
            const matchOwner = r.owner.toLowerCase().includes(q);
            const matchTags = r.tags.some(tag => tag.toLowerCase().includes(q));
            const matchService = r.service.toLowerCase().includes(q);
            
            if (!matchTitle && !matchDesc && !matchOwner && !matchTags && !matchService) {
                return false;
            }
        }

        return true;
    });

    const activeFiltersInfo = document.getElementById("active-filters-info");
    const activeFiltersText = document.getElementById("active-filters-text");
    
    let activeFiltersList = [];
    if (selectedService !== "all") activeFiltersList.push(`Service: ${selectedService.toUpperCase()}`);
    if (selectedClassification !== "all") {
        const classifLabel = selectedClassification === "dwh" ? "Certifié DWH" : (selectedClassification === "self-service" ? "Self-Service" : "Public");
        activeFiltersList.push(`Classif: ${classifLabel}`);
    }
    if (selectedPssi !== "all") {
        activeFiltersList.push(`PSSI: ${selectedPssi.toUpperCase()}`);
    }
    if (selectedTags.length > 0) activeFiltersList.push(`Tags: [${selectedTags.join(', ')}]`);
    if (searchQuery.trim() !== "") activeFiltersList.push(`Recherche: "${searchQuery}"`);
    
    if (activeFiltersList.length > 0 && activeFiltersInfo) {
        activeFiltersInfo.style.display = "block";
        activeFiltersText.textContent = activeFiltersList.join(" | ");
    } else if (activeFiltersInfo) {
        activeFiltersInfo.style.display = "none";
    }

    if (filteredReports.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">Aucun rapport trouvé</div>
                <p class="text-secondary" style="font-size: 14px;">Ajustez vos filtres ou modifiez votre requête de recherche.</p>
            </div>
        `;
        return;
    }

    // Dynamic View by service (Grouped Layout dynamically populated from config)
    if (selectedService === "all") {
        const services = {};
        portalConfig.services.forEach(s => {
            services[s.id] = { label: `Service ${s.label}`, color: s.id, list: [] };
        });

        filteredReports.forEach(r => {
            if (services[r.service]) {
                services[r.service].list.push(r);
            }
        });

        Object.keys(services).forEach(key => {
            const group = services[key];
            if (group.list.length === 0) return;

            const section = document.createElement("div");
            section.className = "catalog-service-section";
            section.innerHTML = `
                <div class="catalog-service-title ${group.color}">
                    <span>${group.label}</span>
                    <span class="tag-badge" style="font-size: 11px; padding: 2px 8px; border-radius: 10px; background-color: var(--cfl-gray-light); color: var(--text-secondary);">${group.list.length}</span>
                </div>
                <div class="reports-grid" id="service-grid-${key}"></div>
            `;
            grid.appendChild(section);

            const sectionGrid = section.querySelector(`#service-grid-${key}`);
            group.list.forEach(r => {
                const card = createReportCardDOM(r);
                sectionGrid.appendChild(card);
            });
        });
    } else {
        const singleGrid = document.createElement("div");
        singleGrid.className = "reports-grid";
        grid.appendChild(singleGrid);

        filteredReports.forEach(r => {
            const card = createReportCardDOM(r);
            singleGrid.appendChild(card);
        });
    }
}

function createReportCardDOM(r) {
    const isFav = favorites.includes(r.id);
    const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
    const classifClass = r.classification;
    const pssiLabel = `PSSI: ${r.pssi.toUpperCase()}`;
    const pssiClass = r.pssi;
    
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
        <div class="report-header">
            <div class="report-title-area">
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom: 6px;">
                    <span class="classif-badge ${classifClass}" style="padding: 2px 6px; font-size: 9px;">${classifLabel}</span>
                    <span class="pssi-badge ${pssiClass}" style="padding: 2px 6px; font-size: 9px;">${pssiLabel}</span>
                </div>
                <span class="report-card-title">${r.title}</span>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-report-id="${r.id}" aria-label="Favori">
                ${isFav ? '★' : '☆'}
            </button>
        </div>
        <p class="report-card-desc">${r.desc}</p>
        <div class="report-meta-row">
            <span class="service-badge ${r.service}">${r.service.toUpperCase()}</span>
            <div class="card-tags">
                ${r.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
            </div>
        </div>
    `;
    
    card.addEventListener("click", (e) => {
        if (e.target.classList.contains("fav-btn")) {
            e.stopPropagation();
            toggleFavorite(r.id);
            return;
        }
        openDrawer(r.id);
    });
    
    return card;
}

function filterCatalogByFavorites() {
    selectedService = "all";
    selectedClassification = "all";
    selectedPssi = "all";
    selectedTags = [];
    searchQuery = "";
    
    document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#filter-services-container [data-service="all"]').classList.add('active');

    document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#filter-classifications-container [data-classif="all"]').classList.add('active');

    document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#filter-pssi-container [data-pssi="all"]').classList.add('active');
    
    const grid = document.getElementById("catalog-reports-grid");
    grid.innerHTML = "";
    
    const filteredReports = reports.filter(r => favorites.includes(r.id) && !r.isPurged && isUserAuthorizedForReport(r));
    
    const activeFiltersInfo = document.getElementById("active-filters-info");
    const activeFiltersText = document.getElementById("active-filters-text");
    if (activeFiltersInfo) {
        activeFiltersInfo.style.display = "block";
        activeFiltersText.textContent = "Filtré par : Favoris";
    }

    if (filteredReports.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <div class="empty-state-title">Aucun favori</div>
                <p class="text-secondary" style="font-size: 14px;">Ajoutez des favoris en cliquant sur l'étoile d'un rapport dans le catalogue.</p>
            </div>
        `;
    } else {
        const singleGrid = document.createElement("div");
        singleGrid.className = "reports-grid";
        grid.appendChild(singleGrid);

        filteredReports.forEach(r => {
            const card = createReportCardDOM(r);
            singleGrid.appendChild(card);
        });
    }
}

function toggleTagFilter(tag) {
    const idx = selectedTags.indexOf(tag);
    if (idx === -1) {
        selectedTags.push(tag);
    } else {
        selectedTags.splice(idx, 1);
    }
    renderCatalog();
}

function clearCatalogFilters() {
    selectedService = "all";
    selectedClassification = "all";
    selectedPssi = "all";
    selectedTags = [];
    searchQuery = "";
    
    const searchInput = document.getElementById("catalog-search");
    if (searchInput) searchInput.value = "";
    
    document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
    const allServBtn = document.querySelector('#filter-services-container [data-service="all"]');
    if (allServBtn) allServBtn.classList.add('active');

    document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
    const allClassBtn = document.querySelector('#filter-classifications-container [data-classif="all"]');
    if (allClassBtn) allClassBtn.classList.add('active');

    document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
    const allPssiBtn = document.querySelector('#filter-pssi-container [data-pssi="all"]');
    if (allPssiBtn) allPssiBtn.classList.add('active');
    
    renderCatalog();
}

// --- RIGHTS MANAGEMENT MODULE LOGIC ---
const SIMULATED_USER_GROUPS = {
    "laurent.leclerc@cfl.lu": ["CFL-Voyageurs-Editeurs", "DW_POWERBI_QUALITE_BO"],
    "jean-paul.weber@cfl.lu": ["CFL-Data-Analysts", "DW_POWERBI_QUALITE_ALL_STAFF"],
    "sophie.martin@cfl.lu": ["DW_POWERBI_IT_ADMIN"],
    "michel.becker@cfl.lu": ["DW_POWERBI_QUALITE_ANALYSESADHOC"],
    "damien.g@cfl.lu": ["DW_POWERBI_IT_ADMIN"]
};

function renderRightsPanel() {
    const reportSelect = document.getElementById("rights-select-report");
    if (!reportSelect) return;

    // 1. Populate reports dropdown sorted alphabetically
    const prevVal = reportSelect.value;
    reportSelect.innerHTML = "";
    const sortedReports = reports.filter(r => !r.isPurged && isUserAuthorizedForReport(r)).sort((a, b) => a.title.localeCompare(b.title));
    sortedReports.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `${r.title} [${r.service.toUpperCase()}]`;
        reportSelect.appendChild(opt);
    });

    if (prevVal && sortedReports.some(r => r.id === prevVal)) {
        reportSelect.value = prevVal;
    } else if (sortedReports.length > 0) {
        reportSelect.value = sortedReports[0].id;
    }

    // 2. Adjust role specific UI elements in Rights form
    const newGroupOption = document.getElementById("rights-option-new-group");
    if (newGroupOption) {
        newGroupOption.style.display = currentRole === "Admin" ? "block" : "none";
    }

    // Populate existing groups datalist
    const groupsDatalist = document.getElementById("rights-existing-groups-datalist");
    if (groupsDatalist) {
        const uniqueGroups = new Set();
        reports.forEach(r => {
            if (r.adGroups) {
                r.adGroups.forEach(g => uniqueGroups.add(g));
            }
        });
        groupsDatalist.innerHTML = "";
        uniqueGroups.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g;
            groupsDatalist.appendChild(opt);
        });
    }

    // 3. Render current rights table for selected report
    renderCurrentRightsTable();

    // 4. Render Matrix 360 (Only visible to Admin)
    const matrixCard = document.getElementById("rights-matrix-card");
    if (matrixCard) {
        if (currentRole === "Admin") {
            matrixCard.style.display = "block";
            renderGlobalMatrix();
        } else {
            matrixCard.style.display = "none";
        }
    }
}

function renderCurrentRightsTable() {
    const reportSelect = document.getElementById("rights-select-report");
    if (!reportSelect) return;
    const reportId = reportSelect.value;
    const r = reports.find(item => item.id === reportId);
    const tbody = document.getElementById("rights-current-tbody");
    if (!tbody || !r) return;

    tbody.innerHTML = "";

    // Show active groups
    if (r.adGroups) {
        r.adGroups.forEach(g => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span style="background-color: rgba(52, 199, 89, 0.1); color: #34c759; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Groupe AD</span></td>
                <td><code style="font-family: monospace; font-size: 12px;">${g}</code></td>
                <td style="text-align: center;">
                    <button class="btn-sm-action danger" onclick="revokeAccess('${r.id}', 'group', '${g}')" style="padding: 4px 8px; font-size: 11px;">Révoquer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Show active individual users
    if (r.users) {
        r.users.forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span style="background-color: rgba(0, 122, 255, 0.1); color: #007aff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Utilisateur</span></td>
                <td><code style="font-family: monospace; font-size: 12px;">${u}</code></td>
                <td style="text-align: center;">
                    <button class="btn-sm-action danger" onclick="revokeAccess('${r.id}', 'user', '${u}')" style="padding: 4px 8px; font-size: 11px;">Révoquer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    if ((!r.adGroups || r.adGroups.length === 0) && (!r.users || r.users.length === 0)) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); font-style: italic;">Aucun droit configuré sur ce rapport.</td></tr>`;
    }
}

function grantAccess() {
    const reportSelect = document.getElementById("rights-select-report");
    if (!reportSelect) return;
    const reportId = reportSelect.value;
    const rIdx = reports.findIndex(item => item.id === reportId);
    if (rIdx === -1) return;

    const entityType = document.getElementById("rights-entity-type").value;
    const entityName = document.getElementById("rights-entity-name").value.trim();

    if (!entityName) {
        alert("Veuillez saisir un nom ou un e-mail d'entité.");
        return;
    }

    if (entityType === "group-new" && currentRole !== "Admin") {
        alert("Seuls les administrateurs BI peuvent créer de nouveaux groupes AD.");
        return;
    }

    if (entityType === "group-exist") {
        // Verify group exists
        const uniqueGroups = new Set();
        reports.forEach(r => {
            if (r.adGroups) {
                r.adGroups.forEach(g => uniqueGroups.add(g));
            }
        });
        if (!uniqueGroups.has(entityName)) {
            alert(`Le groupe AD "${entityName}" n'existe pas. Les stewards/owners peuvent uniquement associer des groupes existants. Si vous devez créer un nouveau groupe AD, veuillez contacter un administrateur BI.`);
            return;
        }
    }

    // Add access
    let added = false;
    if (entityType === "user") {
        if (!reports[rIdx].users) reports[rIdx].users = [];
        if (!reports[rIdx].users.includes(entityName)) {
            reports[rIdx].users.push(entityName);
            added = true;
        }
    } else { // group-exist or group-new
        if (!reports[rIdx].adGroups) reports[rIdx].adGroups = [];
        if (!reports[rIdx].adGroups.includes(entityName)) {
            reports[rIdx].adGroups.push(entityName);
            added = true;
        }
    }

    if (added) {
        saveReportsToStorage();
        
        // Log event
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        logs.unshift({
            timestamp: formattedDate,
            user: "Damien G.",
            event: "Ajout Accès",
            target: `${reports[rIdx].title} (${entityType === 'user' ? 'User' : 'Group'}: ${entityName})`,
            status: "Succès"
        });
        saveLogsToStorage();
        
        document.getElementById("rights-entity-name").value = "";
        renderRightsPanel();
        alert(`L'accès pour "${entityName}" a été octroyé avec succès au rapport "${reports[rIdx].title}".`);
    } else {
        alert(`"${entityName}" possède déjà cet accès.`);
    }
}

function revokeAccess(reportId, type, name) {
    const rIdx = reports.findIndex(item => item.id === reportId);
    if (rIdx === -1) return;

    if (!confirm(`Confirmez-vous la révocation de l'accès de "${name}" au rapport "${reports[rIdx].title}" ?`)) {
        return;
    }

    if (type === "user") {
        reports[rIdx].users = reports[rIdx].users.filter(u => u !== name);
    } else {
        reports[rIdx].adGroups = reports[rIdx].adGroups.filter(g => g !== name);
    }

    saveReportsToStorage();

    // Log event
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    logs.unshift({
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Révoc. Accès",
        target: `${reports[rIdx].title} (${type === 'user' ? 'User' : 'Group'}: ${name})`,
        status: "Succès"
    });
    saveLogsToStorage();

    renderRightsPanel();
}

function renderGlobalMatrix() {
    const tbody = document.getElementById("matrix-tbody");
    if (!tbody) return;

    const searchQuery = (document.getElementById("matrix-search-input")?.value || "").toLowerCase().trim();
    const filterType = document.getElementById("matrix-filter-type")?.value || "all";

    tbody.innerHTML = "";

    // Gather unique entities
    const entitiesMap = new Map();

    reports.forEach(r => {
        if (r.adGroups) {
            r.adGroups.forEach(g => {
                if (!entitiesMap.has(g)) {
                    entitiesMap.set(g, { name: g, type: "group", reports: new Set() });
                }
                entitiesMap.get(g).reports.add(r.title);
            });
        }
        if (r.users) {
            r.users.forEach(u => {
                if (!entitiesMap.has(u)) {
                    entitiesMap.set(u, { name: u, type: "user", reports: new Set() });
                }
                entitiesMap.get(u).reports.add(r.title);
            });
        }
    });

    Object.keys(SIMULATED_USER_GROUPS).forEach(u => {
        if (!entitiesMap.has(u)) {
            entitiesMap.set(u, { name: u, type: "user", reports: new Set() });
        }
        const userGroups = SIMULATED_USER_GROUPS[u];
        reports.forEach(r => {
            if (r.adGroups && r.adGroups.some(g => userGroups.includes(g))) {
                entitiesMap.get(u).reports.add(r.title);
            }
        });
    });

    let entities = Array.from(entitiesMap.values());
    entities.sort((a, b) => a.name.localeCompare(b.name));

    if (filterType === "user") {
        entities = entities.filter(e => e.type === "user");
    } else if (filterType === "group") {
        entities = entities.filter(e => e.type === "group");
    }

    if (searchQuery !== "") {
        entities = entities.filter(e => {
            const matchName = e.name.toLowerCase().includes(searchQuery);
            const matchReports = Array.from(e.reports).some(title => title.toLowerCase().includes(searchQuery));
            return matchName || matchReports;
        });
    }

    entities.forEach(e => {
        const tr = document.createElement("tr");
        const typeBadge = e.type === "user" 
            ? `<span style="background-color: rgba(0, 122, 255, 0.1); color: #007aff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Utilisateur</span>`
            : `<span style="background-color: rgba(52, 199, 89, 0.1); color: #34c759; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Groupe AD</span>`;
        
        let reportPills = "";
        if (e.reports.size === 0) {
            reportPills = `<em style="color: var(--text-secondary);">Aucun rapport accessible</em>`;
        } else {
            Array.from(e.reports).forEach(title => {
                let indirectText = "";
                if (e.type === "user") {
                    const r = reports.find(item => item.title === title);
                    const isDirect = r && r.users && r.users.includes(e.name);
                    if (!isDirect) {
                        const userGroups = SIMULATED_USER_GROUPS[e.name] || [];
                        const groupSrc = r && r.adGroups ? r.adGroups.find(g => userGroups.includes(g)) : null;
                        indirectText = groupSrc ? ` (via ${groupSrc})` : " (via Groupe)";
                    } else {
                        indirectText = " (Direct)";
                    }
                }
                reportPills += `<span style="display: inline-block; background-color: var(--cfl-gray-light); color: var(--cfl-gray-dark); border: 1px solid var(--cfl-gray-border); padding: 2px 8px; border-radius: 4px; font-size: 11.5px; margin: 2px; font-weight: 500;">${title}<small style="color: var(--text-secondary); font-weight:normal;">${indirectText}</small></span>`;
            });
        }

        tr.innerHTML = `
            <td><strong>${e.name}</strong></td>
            <td>${typeBadge}</td>
            <td>${reportPills}</td>
        `;
        tbody.appendChild(tr);
    });

    if (entities.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); font-style: italic;">Aucune entité ne correspond à la recherche.</td></tr>`;
    }
}

window.grantAccess = grantAccess;
window.revokeAccess = revokeAccess;
window.renderCurrentRightsTable = renderCurrentRightsTable;

// --- ADMIN / GESTION DES RAPPORTS TAB RENDERING ---
function renderAdminPanel() {
    const adminSelect = document.getElementById("admin-select-report");
    if (!adminSelect) return;
    
    const prevSelectedValue = adminSelect.value;
    adminSelect.innerHTML = "";

    // Sort reports alphabetically by title
    const sortedReports = [...reports].sort((a, b) => a.title.localeCompare(b.title));
    sortedReports.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `${r.title} [${r.service.toUpperCase()}]`;
        adminSelect.appendChild(opt);
    });

    if (prevSelectedValue && reports.some(r => r.id === prevSelectedValue)) {
        adminSelect.value = prevSelectedValue;
    } else if (reports.length > 0) {
        adminSelect.value = sortedReports[0].id;
    }

    if (adminSelect.value) {
        loadReportInAdminForm(adminSelect.value);
    }

    const logsTbody = document.getElementById("admin-logs-tbody");
    if (logsTbody) {
        logsTbody.innerHTML = "";
        logs.forEach(log => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${log.timestamp}</strong></td>
                <td>${log.user}</td>
                <td><span style="font-weight:600; color:var(--cfl-gray-dark);">${log.event}</span></td>
                <td>${log.target}</td>
                <td><span style="color:#34c759; font-weight:600;">● ${log.status}</span></td>
            `;
            logsTbody.appendChild(tr);
        });
    }
    renderRecertificationTable();
}

function loadReportInAdminForm(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("admin-report-owner").value = r.owner || "";
    document.getElementById("admin-report-service").value = r.service;
    document.getElementById("admin-report-classif").value = r.classification;
    document.getElementById("admin-report-pssi").value = r.pssi;
    document.getElementById("admin-report-freq").value = r.frequency;
    
    // Steward, summary
    const stewardEl = document.getElementById("admin-report-steward");
    if (stewardEl) stewardEl.value = r.steward || "";
    
    const summaryEl = document.getElementById("admin-report-summary");
    if (summaryEl) summaryEl.value = r.summary || "";

    // Contenteditable rich text editor
    const descEditor = document.getElementById("admin-report-desc-editor");
    if (descEditor) {
        descEditor.innerHTML = r.desc || "";
    }

    // Modern tags
    currentEditingTags = [...(r.tags || [])];
    renderTagPills();
}

function saveReportMetadataFromAdmin() {
    const reportId = document.getElementById("admin-select-report").value;
    const rIdx = reports.findIndex(item => item.id === reportId);
    if (rIdx === -1) return;

    const owner = document.getElementById("admin-report-owner").value.trim();
    const service = document.getElementById("admin-report-service").value;
    const classif = document.getElementById("admin-report-classif").value;
    const pssi = document.getElementById("admin-report-pssi").value;
    const freq = document.getElementById("admin-report-freq").value;
    
    const stewardEl = document.getElementById("admin-report-steward");
    const steward = stewardEl ? stewardEl.value.trim() : "";
    
    const summaryEl = document.getElementById("admin-report-summary");
    const summary = summaryEl ? summaryEl.value.trim() : "";

    const descEditor = document.getElementById("admin-report-desc-editor");
    const desc = descEditor ? descEditor.innerHTML.trim() : "";
    
    const tags = [...currentEditingTags];

    if (owner === "" || desc === "") {
        alert("Veuillez remplir le propriétaire métier et la description.");
        return;
    }

    reports[rIdx].owner = owner;
    reports[rIdx].service = service;
    reports[rIdx].classification = classif;
    reports[rIdx].pssi = pssi;
    reports[rIdx].frequency = freq;
    reports[rIdx].desc = desc;
    reports[rIdx].steward = steward;
    reports[rIdx].summary = summary;
    reports[rIdx].tags = tags;
    reports[rIdx].lastRefresh = "Modifié à l'instant (Sync Data Galaxy)";

    saveReportsToStorage();

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const newLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Modif. Métadonnées",
        target: reports[rIdx].title,
        status: "Succès"
    };

    logs.unshift(newLog);
    saveLogsToStorage();

    renderAll();
    
    alert(`Les métadonnées du rapport "${reports[rIdx].title}" ont été enregistrées avec succès.`);
}

// 9. Drawer Actions (Open, Populate, Close)
function openDrawer(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    r.viewCount += 1;
    saveReportsToStorage();

    const histIdx = history.indexOf(reportId);
    if (histIdx !== -1) {
        history.splice(histIdx, 1);
    }
    history.push(reportId);
    if (history.length > 15) history.shift();
    saveHistoryToStorage();

    // Reset drawer tabs to default (Details/Fiche Métier)
    const tabBtns = document.querySelectorAll(".drawer-tab-btn");
    tabBtns.forEach(btn => {
        if (btn.getAttribute("data-drawer-tab") === "details") {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const detailsTab = document.getElementById("drawer-tab-content-details");
    if (detailsTab) {
        detailsTab.classList.add("active");
        detailsTab.style.display = "block";
    }
    const lineageTab = document.getElementById("drawer-tab-content-lineage");
    if (lineageTab) {
        lineageTab.classList.remove("active");
        lineageTab.style.display = "none";
    }

    const drawerTitle = document.getElementById("drawer-report-title");
    const drawerTitleHeading = document.getElementById("drawer-title-heading");
    const drawerBadge = document.getElementById("drawer-service-badge");
    const drawerClassBadge = document.getElementById("drawer-classification-badge");
    const drawerPssiBadge = document.getElementById("drawer-pssi-badge");
    const drawerDesc = document.getElementById("drawer-description");
    
    const drawerOwner = document.getElementById("drawer-owner");
    const drawerFreq = document.getElementById("drawer-frequency");
    const drawerPath = document.getElementById("drawer-pbirs-path");
    const drawerTags = document.getElementById("drawer-tags-container");
    const drawerAccessList = document.getElementById("drawer-access-list");

    if (drawerTitle) drawerTitle.textContent = "Fiche d'identité Rapport";
    if (drawerTitleHeading) drawerTitleHeading.textContent = r.title;
    
    if (drawerBadge) {
        drawerBadge.className = `service-badge ${r.service}`;
        drawerBadge.textContent = r.service.toUpperCase();
    }

    if (drawerClassBadge) {
        const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
        drawerClassBadge.className = `classif-badge ${r.classification}`;
        drawerClassBadge.textContent = classifLabel;
    }

    if (drawerPssiBadge) {
        const pssiLabel = `PSSI: ${r.pssi.toUpperCase()}`;
        drawerPssiBadge.className = `pssi-badge ${r.pssi}`;
        drawerPssiBadge.textContent = pssiLabel;
    }

    if (drawerDesc) drawerDesc.innerHTML = r.desc;
    
    const drawerSummary = document.getElementById("drawer-summary");
    if (drawerSummary) drawerSummary.textContent = r.summary || `Résumé analytique du rapport : Suivi et pilotage de l'activité ${r.title || ""} pour les équipes CFL.`;
    
    if (drawerOwner) drawerOwner.textContent = r.owner;
    if (drawerFreq) drawerFreq.textContent = r.frequency;
    if (drawerPath) drawerPath.textContent = r.pbirsPath;
    
    const drawerSteward = document.getElementById("drawer-steward");
    const drawerCustodian = document.getElementById("drawer-custodian");
    if (drawerSteward) drawerSteward.textContent = r.steward || "N/A";
    if (drawerCustodian) drawerCustodian.textContent = r.custodian || "N/A";
    
    if (drawerTags) {
        drawerTags.innerHTML = "";
        r.tags.forEach(t => {
            const span = document.createElement("span");
            span.className = "drawer-tag";
            span.textContent = t;
            drawerTags.appendChild(span);
        });
    }

    if (drawerAccessList) {
        drawerAccessList.innerHTML = "";
        if (r.adGroups) {
            r.adGroups.forEach(grp => {
                const li = document.createElement("li");
                li.className = "access-user-item";
                li.innerHTML = `<span class="access-user-dot" style="background-color: #34c759;"></span> Groupe AD '${grp}'`;
                drawerAccessList.appendChild(li);
            });
        }
        if (r.users) {
            r.users.forEach(usr => {
                const li = document.createElement("li");
                li.className = "access-user-item";
                li.innerHTML = `<span class="access-user-dot" style="background-color: #007aff;"></span> Utilisateur '${usr}'`;
                drawerAccessList.appendChild(li);
            });
        }
    }

    // Populate view count
    const drawerViews = document.getElementById("drawer-viewcount");
    if (drawerViews) drawerViews.textContent = r.viewCount;

    // Role-based visibility rules:
    // "Emplacement technique" and "Accès autorisés" are only visible to Steward, Owner, and Admin.
    const hasAdvancedAccess = (currentRole === "Steward" || currentRole === "Owner" || currentRole === "Admin");
    
    const pathContainer = document.getElementById("drawer-technical-path-container");
    const accessContainer = document.getElementById("drawer-access-list-container");
    const viewCountContainer = document.getElementById("drawer-viewcount-container");

    if (pathContainer) pathContainer.style.display = hasAdvancedAccess ? "block" : "none";
    if (accessContainer) accessContainer.style.display = hasAdvancedAccess ? "block" : "none";
    if (viewCountContainer) viewCountContainer.style.display = hasAdvancedAccess ? "block" : "none";

    const favActionBtn = document.getElementById("drawer-fav-action-btn");
    if (favActionBtn) {
        favActionBtn.setAttribute("data-report-id", r.id);
        updateDrawerFavButton(r.id);
    }

    const drawer = document.getElementById("report-drawer");
    const overlay = document.getElementById("drawer-overlay");
    if (drawer) {
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
    }
    if (overlay) overlay.classList.add("open");

    // Render lineage data
    renderReportLineage(r);
}

function renderReportLineage(r) {
    const canvasContainer = document.getElementById("lineage-canvas");
    const detailsPanel = document.getElementById("lineage-details-panel");
    if (!canvasContainer || !detailsPanel) return;

    // Reset details panel
    detailsPanel.style.display = "none";
    detailsPanel.innerHTML = "";

    // Determine mock lineage data based on report service
    const serviceName = r.service || "qualite";
    let dbName = "CFL_PROD_DWH";
    let dbType = "SQL Server (Production DWH)";
    let connString = "Server=cfl-dwh-prod.cfl.lu;Database=CFL_PROD_DWH;Trusted_Connection=True;";
    let dwhTable = "DWH_GOUV.T_KPI_REPORT_STATS";
    let dwhSQL = "SELECT \n  ReportId,\n  MetricValue,\n  SnapshotDate \nFROM DWH_GOUV.T_KPI_REPORT_STATS \nWHERE SnapshotDate >= DATEADD(month, -12, GETDATE());";
    let cubeName = "CUBE_GOUVERNANCE_BI";
    let measureName = "[Taux de Complétion]";
    let daxFormula = "Taux de Complétion := \nDIVIDE(\n  CALCULATE(COUNT(T_KPI_REPORT_STATS[ReportId]), T_KPI_REPORT_STATS[HasSteward] = 1),\n  COUNT(T_KPI_REPORT_STATS[ReportId]),\n  0\n)";

    // Customize based on service
    if (serviceName === "qualite") {
        dbName = "CFL_TRAFFIC_DB";
        dbType = "SQL Server (Traffic Ferroviaire)";
        connString = "Server=cfl-db-traffic.cfl.lu;Database=CFL_TRAFFIC_DB;Integrated Security=SSPI;";
        dwhTable = "DWH_QUALITE.T_FACT_TRAIN_DELAY";
        dwhSQL = "SELECT \n  TrainId,\n  StationId,\n  DelayMinutes,\n  PlannedTime,\n  ActualTime\nFROM DWH_QUALITE.T_FACT_TRAIN_DELAY\nWHERE PlannedTime >= '2026-01-01';";
        cubeName = "CUBE_QUALITE_PERFORMANCE";
        measureName = "[Taux de Ponctualité]";
        daxFormula = "Taux de Ponctualité := \nDIVIDE(\n  CALCULATE(\n    COUNTROWS(T_FACT_TRAIN_DELAY),\n    T_FACT_TRAIN_DELAY[DelayMinutes] <= 5\n  ),\n  COUNTROWS(T_FACT_TRAIN_DELAY),\n  0\n)";
    } else if (serviceName === "finances") {
        dbName = "CFL_ERP_FINANCE";
        dbType = "Oracle Database (ERP)";
        connString = "Data Source=cfl-oracle-erp.cfl.lu:1521/FINPROD;User Id=bi_user;Password=********;";
        dwhTable = "DWH_FINANCE.FACT_GL_BALANCES";
        dwhSQL = "SELECT \n  ACCOUNT_ID,\n  PERIOD_NAME,\n  DEBIT_AMOUNT,\n  CREDIT_AMOUNT\nFROM DWH_FINANCE.FACT_GL_BALANCES\nWHERE FISCAL_YEAR = 2026;";
        cubeName = "CUBE_FINANCIAL_ANALYTICS";
        measureName = "[Montant Dépenses Réelles]";
        daxFormula = "Montant Dépenses Réelles := \nCALCULATE(\n  SUM(FACT_GL_BALANCES[DEBIT_AMOUNT]) - SUM(FACT_GL_BALANCES[CREDIT_AMOUNT]),\n  T_DIM_ACCOUNT[Type] = \"Expense\"\n)";
    } else if (serviceName === "rh") {
        dbName = "CFL_HR_PROD";
        dbType = "Oracle Database (PeopleSoft)";
        connString = "Data Source=cfl-oracle-hr.cfl.lu:1521/HRPROD;User Id=hr_bi;Password=********;";
        dwhTable = "DWH_HR.FACT_EMPLOYEE_TURNOVER";
        dwhSQL = "SELECT \n  EMPLOYEE_ID,\n  DEPARTMENT_ID,\n  HIRE_DATE,\n  TERMINATION_DATE\nFROM DWH_HR.FACT_EMPLOYEE_TURNOVER;";
        cubeName = "CUBE_HR_ANALYTICS";
        measureName = "[Taux de Rotation RH]";
        daxFormula = "Taux de Rotation RH := \nDIVIDE(\n  COUNTROWS(CALCULATETABLE(FACT_EMPLOYEE_TURNOVER, NOT ISBLANK(FACT_EMPLOYEE_TURNOVER[TERMINATION_DATE]))),\n  AVERAGEX(VALUES(T_DIM_DATE[MonthKey]), [ActiveEmployees]),\n  0\n)";
    } else if (serviceName === "voyageurs") {
        dbName = "CFL_TICKETING_DB";
        dbType = "PostgreSQL (Ticketing Ventes)";
        connString = "Host=cfl-pg-ticket.cfl.lu;Port=5432;Database=ticketing;Username=bi_reader;Password=********;";
        dwhTable = "DWH_VOYAGEURS.F_TICKET_SALES";
        dwhSQL = "SELECT \n  ticket_id,\n  sale_date,\n  passenger_category,\n  amount_eur\nFROM DWH_VOYAGEURS.F_TICKET_SALES\nWHERE sale_date >= CURRENT_DATE - INTERVAL '1 year';";
        cubeName = "CUBE_COMMERCIAL_SALES";
        measureName = "[Revenu Total Billetterie]";
        daxFormula = "Revenu Total Billetterie := \nSUM(F_TICKET_SALES[amount_eur])";
    } else if (serviceName === "informatique") {
        dbName = "CFL_INFRA_MONITORING";
        dbType = "PostgreSQL (Monitoring Sys)";
        connString = "Host=cfl-pg-infra.cfl.lu;Database=syslog;Username=bi_infra;Password=********;";
        dwhTable = "DWH_INFRA.F_SERVER_METRICS";
        dwhSQL = "SELECT \n  server_id,\n  timestamp,\n  cpu_usage_pct,\n  ram_usage_pct\nFROM DWH_INFRA.F_SERVER_METRICS\nWHERE timestamp >= NOW() - INTERVAL '30 days';";
        cubeName = "CUBE_SYSTEM_PERFORMANCE";
        measureName = "[Disponibilité Système]";
        daxFormula = "Disponibilité Système := \nAVERAGE(F_SERVER_METRICS[cpu_usage_pct])";
    }

    // Nodes definition for Vis.js
    const rawNodes = [
        {
            id: 1,
            label: `🗄️\n${dbName}`,
            type: "db",
            typeLabel: "Base de Données Source",
            name: dbName,
            desc: `Base opérationnelle source (${dbType}) contenant les données brutes.`,
            techTitle: "Chaîne de connexion (Connection String)",
            techCode: connString,
            color: { background: "#e1f5fe", border: "#007aff", hover: { background: "#b3e5fc", border: "#0056b3" }, highlight: { background: "#b3e5fc", border: "#0056b3" } }
        },
        {
            id: 2,
            label: `📊\n${dwhTable}`,
            type: "table",
            typeLabel: "Table DWH / Requête M",
            name: dwhTable,
            desc: "Table de faits ou dimensions stockée dans le Data Warehouse CFL après extraction ETL.",
            techTitle: "Requête SQL Source d'alimentation",
            techCode: dwhSQL,
            color: { background: "#fbebe6", border: "#e37e5f", hover: { background: "#f7d7cd", border: "#a04328" }, highlight: { background: "#f7d7cd", border: "#a04328" } }
        },
        {
            id: 3,
            label: `🧊\n${cubeName}`,
            type: "cube",
            typeLabel: "Modèle Sémantique SSAS",
            name: cubeName,
            desc: "Modèle tabulaire SSAS hébergé en mémoire. Gère la sémantique et les relations.",
            techTitle: "Partition & TMSL JSON",
            techCode: `{\n  "name": "${dwhTable.split('.')[1] || 'Partition'}",\n  "source": {\n    "type": "query",\n    "query": "SELECT * FROM ${dwhTable}",\n    "dataSource": "SqlServerProdDWH"\n  }\n}`,
            color: { background: "#f7effc", border: "#af52de", hover: { background: "#eddff7", border: "#7b29a8" }, highlight: { background: "#eddff7", border: "#7b29a8" } }
        },
        {
            id: 4,
            label: `📐\n${measureName}`,
            type: "measure",
            typeLabel: "Objet Sémantique (Mesure)",
            name: measureName,
            desc: `Mesure analytique métier pré-calculée en langage DAX sur le serveur SSAS.`,
            techTitle: "Formule DAX (Calcul Sémantique)",
            techCode: daxFormula,
            color: { background: "#fdecf0", border: "#c41039", hover: { background: "#fad6de", border: "#9c0d2d" }, highlight: { background: "#fad6de", border: "#9c0d2d" } }
        },
        {
            id: 5,
            label: `📈\n${r.title}`,
            type: "report",
            typeLabel: "Rapport Power BI (PBIRS)",
            name: r.title,
            desc: `Rapport de visualisation final hébergé sur Power BI Report Server.`,
            techTitle: "Métadonnées de Restitution PBIRS",
            techCode: `ID Unique: ${r.id}\nChemin: ${r.pbirsPath}\nDernier rafraîchissement: ${r.lastRefresh}\nPropriétaire: ${r.owner}\nGroupe de sécurité AD: ${r.adGroups ? r.adGroups.join(', ') : 'Aucun'}`,
            color: { background: "#fef9e8", border: "#f2c811", hover: { background: "#fdf0c2", border: "#8c7000" }, highlight: { background: "#fdf0c2", border: "#8c7000" } }
        }
    ];

    // Edges definition for Vis.js (connecting step-by-step)
    const rawEdges = [
        { from: 1, to: 2, arrows: "to", color: { color: "#8e8e93", hover: "#c41039", highlight: "#c41039" }, width: 2 },
        { from: 2, to: 3, arrows: "to", color: { color: "#8e8e93", hover: "#c41039", highlight: "#c41039" }, width: 2 },
        { from: 3, to: 4, arrows: "to", color: { color: "#8e8e93", hover: "#c41039", highlight: "#c41039" }, width: 2 },
        { from: 4, to: 5, arrows: "to", color: { color: "#8e8e93", hover: "#c41039", highlight: "#c41039" }, width: 2 }
    ];

    // Create node datasets for Vis.js
    const nodes = new vis.DataSet(rawNodes.map(n => ({
        id: n.id,
        label: n.label,
        shape: "box",
        font: {
            face: "Outfit, sans-serif",
            size: 11,
            bold: { color: "#141414", size: 12, face: "Outfit" },
            color: "#141414"
        },
        margin: 10,
        shapeProperties: {
            borderRadius: 8
        },
        borderWidth: 1.5,
        borderWidthSelected: 2.5,
        color: n.color,
        shadow: {
            enabled: true,
            color: "rgba(0,0,0,0.06)",
            size: 4,
            x: 0,
            y: 2
        }
    })));

    const edges = new vis.DataSet(rawEdges);

    const data = { nodes, edges };

    // Network options
    const options = {
        nodes: {
            chosen: true
        },
        edges: {
            smooth: {
                type: "cubicBezier",
                forceDirection: "vertical",
                roundness: 0.5
            }
        },
        interaction: {
            hover: true,
            zoomView: true,
            dragView: true,
            selectConnectedEdges: false
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: "UD", // Up-Down flow
                sortMethod: "directed",
                nodeSpacing: 110,
                levelSeparation: 80
            }
        },
        physics: {
            enabled: false // Static hierarchical layout is cleaner inside a small drawer
        }
    };

    // Render Vis.js Network
    // Timeout helps ensure canvas element is visible and has layouts computed before vis.js draws
    setTimeout(() => {
        const network = new vis.Network(canvasContainer, data, options);

        // Click event on nodes
        network.on("selectNode", function (params) {
            const nodeId = params.nodes[0];
            const nodeData = rawNodes.find(n => n.id === nodeId);
            if (nodeData) {
                // Populate details panel
                detailsPanel.innerHTML = `
                    <div class="lineage-details-header type-${nodeData.type}">
                        <span style="font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${nodeData.typeLabel}</span>
                        <span style="font-family: monospace; font-size: 11px; font-weight: bold;">[ID Nœud: #${nodeData.id}]</span>
                    </div>
                    <div class="lineage-details-body">
                        <div class="lineage-details-name">${nodeData.name}</div>
                        <div class="lineage-details-desc">${nodeData.desc}</div>
                        <div class="lineage-details-tech">
                            <div class="lineage-tech-title">${nodeData.techTitle}</div>
                            <pre class="lineage-tech-code"><code>${nodeData.techCode}</code></pre>
                        </div>
                    </div>
                `;
                detailsPanel.style.display = "block";
            }
        });

        // Deselect event (click on empty space in canvas)
        network.on("deselectNode", function () {
            detailsPanel.style.display = "none";
            detailsPanel.innerHTML = "";
        });
        
    }, 100);
}

function updateDrawerFavButton(reportId) {
    const isFav = favorites.includes(reportId);
    const favText = document.getElementById("drawer-fav-text");
    const favIcon = document.getElementById("drawer-fav-icon");
    const favActionBtn = document.getElementById("drawer-fav-action-btn");
    
    if (favText) favText.textContent = isFav ? "Retirer des Favoris" : "Ajouter aux Favoris";
    if (favIcon) favIcon.textContent = isFav ? "★" : "☆";
    
    if (favActionBtn) {
        if (isFav) {
            favActionBtn.style.color = "#ff9500";
            favActionBtn.style.borderColor = "#ff9500";
        } else {
            favActionBtn.style.color = "var(--text-secondary)";
            favActionBtn.style.borderColor = "var(--cfl-gray-border)";
        }
    }
}

function closeDrawer() {
    const drawer = document.getElementById("report-drawer");
    const overlay = document.getElementById("drawer-overlay");
    if (drawer) {
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
    }
    if (overlay) overlay.classList.remove("open");
    
    renderAll();
}

// 10. Report Viewer Simulator Logic (Direct Visualization)
// Build URL with rs:Embed=true, active filters and user RLS roles
function buildEmbedUrl(r) {
    let embedUrl = r.pbirsUrl;
    
    // Check for query parameters and append rs:Embed=true
    const separator = embedUrl.includes('?') ? '&' : '?';
    embedUrl += `${separator}rs:Embed=true`;
    
    // Construct OData active filters
    let odataFilters = [];
    if (selectedService !== "all") {
        const servName = selectedService === "qualite" ? "Qualité" : "Informatique";
        odataFilters.push(`Service/Name eq '${servName}'`);
    }
    if (selectedClassification !== "all") {
        odataFilters.push(`Classification/Type eq '${selectedClassification}'`);
    }
    if (selectedPssi !== "all") {
        odataFilters.push(`PSSI/Sensitivity eq '${selectedPssi}'`);
    }
    
    if (odataFilters.length > 0) {
        embedUrl += `&$filter=${encodeURIComponent(odataFilters.join(' and '))}`;
    }
    
    // Append RLS simulation parameters
    embedUrl += `&username=damien.g@cfl.lu&roles=${encodeURIComponent(currentRole)}`;
    
    return embedUrl;
}

function getCurrentUserEmail() {
    if (currentRole === "Admin") return "damien.g@cfl.lu";
    if (currentRole === "Owner") return "laurent.leclerc@cfl.lu";
    if (currentRole === "Steward") return "sophie.martin@cfl.lu";
    return "jean-paul.weber@cfl.lu"; // Standard
}

function isUserAuthorizedForReport(r) {
    if (currentRole === "Admin") return true;
    
    const email = getCurrentUserEmail();
    
    if (r.users && r.users.includes(email)) {
        return true;
    }
    
    const groups = SIMULATED_USER_GROUPS[email] || [];
    if (r.adGroups && r.adGroups.some(g => groups.includes(g))) {
        return true;
    }
    
    if ((!r.adGroups || r.adGroups.length === 0) && (!r.users || r.users.length === 0)) {
        return true;
    }
    
    return false;
}

function openReportViewer(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    // 1. Accessibility Check
    const isArchived = r.archivedDate !== null || r.pbirsPath.includes("_Archives");
    const isInvalidUrl = !r.pbirsUrl || r.pbirsUrl === "#" || r.pbirsUrl === "";
    const isAccessible = !isArchived && !isInvalidUrl;

    // 2. Authorization Check
    const isAuthorized = isUserAuthorizedForReport(r);

    // Populate metadata in report viewer header
    const viewerTitle = document.getElementById("viewer-report-title");
    const viewerClassBadge = document.getElementById("viewer-classif-badge");
    const viewerRefreshDate = document.getElementById("viewer-refresh-date");
    
    if (viewerTitle) viewerTitle.textContent = r.title;
    if (viewerRefreshDate) viewerRefreshDate.textContent = r.lastRefresh;
    
    if (viewerClassBadge) {
        const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
        viewerClassBadge.className = `classif-badge ${r.classification}`;
        viewerClassBadge.textContent = classifLabel;
    }

    // Populate filters chips display
    const chipsContainer = document.getElementById("viewer-active-filters-chips");
    if (chipsContainer) {
        chipsContainer.innerHTML = "";
        
        const addChip = (label) => {
            const span = document.createElement("span");
            span.style.padding = "3px 10px";
            span.style.fontSize = "11.5px";
            span.style.fontWeight = "500";
            span.style.borderRadius = "4px";
            span.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
            span.style.color = "rgba(255, 255, 255, 0.9)";
            span.style.border = "1px solid rgba(255, 255, 255, 0.2)";
            span.style.whiteSpace = "nowrap";
            span.textContent = label;
            chipsContainer.appendChild(span);
        };

        let hasActiveFilters = false;
        
        if (selectedService !== "all") {
            addChip(`Service : ${selectedService === "qualite" ? "Qualité" : "Informatique"}`);
            hasActiveFilters = true;
        }
        if (selectedClassification !== "all") {
            const classifLabel = selectedClassification === "dwh" ? "Certifié DWH" : (selectedClassification === "self-service" ? "Self-Service" : "Public");
            addChip(`Classification : ${classifLabel}`);
            hasActiveFilters = true;
        }
        if (selectedPssi !== "all") {
            addChip(`PSSI : ${selectedPssi.toUpperCase()}`);
            hasActiveFilters = true;
        }
        if (selectedTags && selectedTags.length > 0) {
            selectedTags.forEach(t => {
                addChip(`Tag : ${t}`);
                hasActiveFilters = true;
            });
        }
        if (searchQuery && searchQuery.trim() !== "") {
            addChip(`Recherche : "${searchQuery.trim()}"`);
            hasActiveFilters = true;
        }

        if (!hasActiveFilters) {
            addChip("Aucun filtre appliqué");
        }
    }

    const iframeEl = document.getElementById("report-iframe");
    const errContainer = document.getElementById("viewer-error-container");
    const errIconBox = document.getElementById("viewer-error-icon-box");
    const errTitle = document.getElementById("viewer-error-title");
    const errMsg = document.getElementById("viewer-error-message");
    const errActionBtn = document.getElementById("viewer-error-action-btn");

    if (errContainer) errContainer.style.display = "none";
    if (iframeEl) iframeEl.style.display = "block";

    if (!isAuthorized) {
        // Log access denied
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        logs.unshift({
            timestamp: formattedDate,
            user: getCurrentUserEmail(),
            event: "Accès Refusé",
            target: r.title,
            status: "Échec (Habilitation)"
        });
        saveLogsToStorage();

        // Show authorization error
        if (iframeEl) iframeEl.style.display = "none";
        if (errContainer) {
            errContainer.style.display = "flex";
            errIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="40" height="40" stroke="#dc3545" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
            errIconBox.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
            errTitle.textContent = "Accès Refusé : Habilitations Insuffisantes";
            errMsg.innerHTML = `Vous ne disposez pas des droits d'accès nécessaires (habilitation nominative ou appartenance au groupe Active Directory autorisé) pour visualiser le rapport <strong>"${r.title}"</strong>.<br><br>Veuillez contacter le Data Steward (<strong>${r.steward || "N/A"}</strong>) ou soumettre une demande via le guichet de droits d'accès.`;
            errActionBtn.style.display = "none";
        }
    } else if (!isAccessible) {
        // Log accessibility error
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        logs.unshift({
            timestamp: formattedDate,
            user: getCurrentUserEmail(),
            event: "Erreur Accès",
            target: r.title,
            status: "Échec (Inaccessible)"
        });
        saveLogsToStorage();

        // Show accessibility error
        if (iframeEl) iframeEl.style.display = "none";
        if (errContainer) {
            errContainer.style.display = "flex";
            errIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="40" height="40" stroke="#ff9500" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            errIconBox.style.backgroundColor = "rgba(255, 149, 0, 0.1)";
            errTitle.textContent = "Rapport Non Accessible";
            
            if (isArchived) {
                errMsg.innerHTML = `Le rapport <strong>"${r.title}"</strong> a été temporairement déplacé vers le sous-dossier <code>_Archives</code> pour inactivité ou obsolescence.<br><br>Veuillez contacter le Data Steward ou l'Administrateur BI pour le restaurer.`;
                if (currentRole === "Admin") {
                    errActionBtn.style.display = "block";
                    errActionBtn.textContent = "Restaurer maintenant";
                    errActionBtn.style.border = "none";
                    errActionBtn.style.color = "white";
                    errActionBtn.style.backgroundColor = "var(--cfl-crimson)";
                    errActionBtn.style.cursor = "pointer";
                    errActionBtn.onclick = () => {
                        restoreFromArchive(r.id);
                        closeReportViewer();
                    };
                } else {
                    errActionBtn.style.display = "none";
                }
            } else {
                errMsg.innerHTML = `Le lien d'intégration Power BI Report Server pour le rapport <strong>"${r.title}"</strong> n'est pas configuré ou est invalide.<br><br>Veuillez contacter le support technique BI.`;
                errActionBtn.style.display = "none";
            }
        }
    } else {
        // Log access success
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        logs.unshift({
            timestamp: formattedDate,
            user: getCurrentUserEmail(),
            event: "Visualisation Rapport",
            target: r.title,
            status: "Succès (SSO Actif)"
        });
        saveLogsToStorage();

        // Build embed URL and update iframe
        const embedUrl = buildEmbedUrl(r);
        if (iframeEl) iframeEl.src = embedUrl;
    }

    closeDrawer();

    // Show report viewer pop-in drawer with sliding right transition
    const container = document.getElementById("report-viewer-container");
    const overlay = document.getElementById("drawer-overlay");
    if (container) {
        container.style.display = "flex";
        // Force reflow
        container.offsetWidth;
        container.classList.add("open");
    }
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden"; // disable body scrolling
}

function closeReportViewer() {
    const iframeEl = document.getElementById("report-iframe");
    if (iframeEl) {
        iframeEl.src = "about:blank"; // clear iframe context
        iframeEl.style.display = "block";
    }

    const errContainer = document.getElementById("viewer-error-container");
    if (errContainer) {
        errContainer.style.display = "none";
    }

    const container = document.getElementById("report-viewer-container");
    const overlay = document.getElementById("drawer-overlay");
    const detailsDrawer = document.getElementById("report-drawer");
    
    if (container) {
        container.classList.remove("open");
        setTimeout(() => {
            if (!container.classList.contains("open")) {
                container.style.display = "none";
            }
        }, 300);
    }
    
    if (overlay && (!detailsDrawer || !detailsDrawer.classList.contains("open"))) {
        overlay.classList.remove("open");
    }
    document.body.style.overflow = ""; // restore body scrolling
    renderAll();
}



function toggleFavorite(reportId) {
    const idx = favorites.indexOf(reportId);
    if (idx === -1) {
        favorites.push(reportId);
    } else {
        favorites.splice(idx, 1);
    }
    saveFavoritesToStorage();
    renderAll();
}

// ========================================================
// 15. ANOMALY REPORTING LOGIC (FEEDBACK LOOP)
// ========================================================
function openBugReportModal() {
    const container = document.getElementById("report-viewer-container");
    const reportId = container ? container.getAttribute("data-report-id") : null;
    if (!reportId) return;

    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("bug-report-id").value = reportId;
    document.getElementById("bug-description").value = "";
    document.getElementById("bug-type").value = "Données incorrectes";

    const modal = document.getElementById("bug-report-modal");
    if (modal) modal.style.display = "flex";
}

function closeBugReportModal() {
    const modal = document.getElementById("bug-report-modal");
    if (modal) modal.style.display = "none";
}

function submitBugReport() {
    const reportId = document.getElementById("bug-report-id").value;
    const type = document.getElementById("bug-type").value;
    const desc = document.getElementById("bug-description").value.trim();

    if (desc === "") {
        alert("Veuillez saisir une description de l'anomalie.");
        return;
    }

    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const newLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Signalement Anomalie",
        target: r.title,
        status: `Transmis (${type})`
    };
    logs.unshift(newLog);
    saveLogsToStorage();

    addSyncLog(formattedDate, "Feedback Loop", `Signalement anomalie transmis pour "${r.title}". Destinataires : Steward et Owner (${r.owner}).`, "Succès");

    alert(`Votre signalement pour le rapport "${r.title}" a été envoyé avec succès. Le Steward et le Business Owner ont été notifiés.`);
    closeBugReportModal();
    renderAll();
}

// ========================================================
// 16. ACCESS RECERTIFICATION LOGIC
// ========================================================
let recertifications = [
    { id: "recert-1", reportId: "rep-1", adGroup: "DW_POWERBI_QUALITE_ANALYSESADHOC", lastControl: "12/03/2026", status: "Conforme" },
    { id: "recert-2", reportId: "rep-4", adGroup: "DW_POWERBI_QUALITE_BO", lastControl: "18/02/2026", status: "Conforme" },
    { id: "recert-3", reportId: "rep-12", adGroup: "DW_POWERBI_IT_ADMIN", lastControl: "04/05/2026", status: "Conforme" },
    { id: "recert-4", reportId: "rep-18", adGroup: "DW_POWERBI_QUALITE_ALL_STAFF", lastControl: "10/01/2026", status: "Recertification requise" }
];

function loadRecertifications() {
    const savedRecerts = localStorage.getItem("cfl_bi_recertifications");
    if (savedRecerts) {
        recertifications = JSON.parse(savedRecerts);
    } else {
        saveRecertifications();
    }
}

function saveRecertifications() {
    localStorage.setItem("cfl_bi_recertifications", JSON.stringify(recertifications));
}

function renderRecertificationTable() {
    const tbody = document.getElementById("recertification-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    recertifications.forEach(rec => {
        const r = reports.find(item => item.id === rec.reportId);
        if (!r) return;

        const membersCount = rec.id === "recert-1" ? 5 : (rec.id === "recert-2" ? 3 : (rec.id === "recert-3" ? 2 : 6));
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${r.title}</strong></td>
            <td><code style="font-family: monospace; font-size: 11.5px; background: #e0e0e0; padding: 2px 4px; border-radius: 3px;">${rec.adGroup}</code></td>
            <td>${membersCount} utilisateurs</td>
            <td>${rec.lastControl}</td>
            <td>
                <button class="btn-sm-action primary" onclick="openRecertifyModal('${rec.id}')">Contrôler</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let activeRecertId = null;
const simulatedAdUsers = [
    { name: "Laurent Leclerc", email: "laurent.leclerc@cfl.lu" },
    { name: "Jean-Paul Weber", email: "jean-paul.weber@cfl.lu" },
    { name: "Sophie Martin", email: "sophie.martin@cfl.lu" },
    { name: "Michel Becker", email: "michel.becker@cfl.lu" }
];

function openRecertifyModal(recertId) {
    const rec = recertifications.find(item => item.id === recertId);
    if (!rec) return;

    activeRecertId = recertId;
    const r = reports.find(item => item.id === rec.reportId);
    if (!r) return;

    document.getElementById("recert-report-title").textContent = r.title;
    document.getElementById("recert-ad-group").textContent = rec.adGroup;

    const tbody = document.getElementById("recert-users-tbody");
    if (tbody) {
        tbody.innerHTML = "";
        simulatedAdUsers.forEach((usr, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${usr.name}</strong></td>
                <td><code style="font-family: monospace; font-size: 11.5px;">${usr.email}</code></td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; border: 1px solid var(--cfl-gray-border); border-radius: 4px; overflow: hidden;">
                        <button class="btn-decision active" id="dec-keep-${idx}" onclick="setDecision(${idx}, 'keep')" style="background-color: #34c759; color: white; border: none; padding: 4px 10px; font-size: 11px; cursor: pointer; font-weight:600;">Conserver</button>
                        <button class="btn-decision" id="dec-revoke-${idx}" onclick="setDecision(${idx}, 'revoke')" style="background-color: #f4f4f4; color: #333; border: none; padding: 4px 10px; font-size: 11px; cursor: pointer; font-weight:600;">Révoquer</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const modal = document.getElementById("recertify-modal");
    if (modal) modal.style.display = "flex";
}

function setDecision(idx, type) {
    const btnKeep = document.getElementById(`dec-keep-${idx}`);
    const btnRevoke = document.getElementById(`dec-revoke-${idx}`);
    if (type === "keep") {
        btnKeep.style.backgroundColor = "#34c759";
        btnKeep.style.color = "white";
        btnRevoke.style.backgroundColor = "#f4f4f4";
        btnRevoke.style.color = "#333";
    } else {
        btnKeep.style.backgroundColor = "#f4f4f4";
        btnKeep.style.color = "#333";
        btnRevoke.style.backgroundColor = "#ff3b30";
        btnRevoke.style.color = "white";
    }
}

function closeRecertifyModal() {
    const modal = document.getElementById("recertify-modal");
    if (modal) modal.style.display = "none";
}

function submitRecertification() {
    if (!activeRecertId) return;

    const rec = recertifications.find(item => item.id === activeRecertId);
    if (!rec) return;

    const r = reports.find(item => item.id === rec.reportId);
    if (!r) return;

    const now = new Date();
    const formattedDateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    const formattedTimeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    rec.lastControl = formattedDateStr;
    rec.status = "Conforme";
    saveRecertifications();

    const newLog = {
        timestamp: formattedTimeStr,
        user: currentRole === "Steward" ? "Steward BI" : "Business Owner",
        event: "Recertification Accès",
        target: r.title,
        status: "Révisé (AD)"
    };
    logs.unshift(newLog);
    saveLogsToStorage();

    addSyncLog(formattedTimeStr, "Active Directory", `Recertification complétée pour le groupe "${rec.adGroup}" (Rapport : ${r.title}).`, "Succès");

    alert(`La recertification du groupe d'accès AD "${rec.adGroup}" a été enregistrée avec succès.`);
    closeRecertifyModal();
    renderAll();
}

// Expose decisions helper globally
window.openRecertifyModal = openRecertifyModal;
window.setDecision = setDecision;
window.archiveReport = archiveReport;
window.notifySteward = notifySteward;

// ========================================================
// 17. ADMIN BI CONSOLE LOGIC (TELEMETRY, SYNC LOGS, PSSI ALERT)
// ========================================================
let syncLogs = [
    { timestamp: "2026-07-24 14:00", flow: "Active Directory", message: "Synchro réussie. 182 comptes vérifiés.", status: "Succès" },
    { timestamp: "2026-07-24 12:00", flow: "Data Galaxy", message: "Mise à jour des tags. 34 rapports synchronisés.", status: "Succès" },
    { timestamp: "2026-07-24 10:00", flow: "Active Directory", message: "Synchro réussie. 182 comptes vérifiés.", status: "Succès" },
    { timestamp: "2026-07-24 08:00", flow: "Data Galaxy", message: "Erreur de connexion (Timeout serveur api.datagalaxy.com). Retrying in 15min.", status: "Échec" }
];

function addSyncLog(timestamp, flow, message, status) {
    syncLogs.unshift({ timestamp, flow, message, status });
    if (syncLogs.length > 30) syncLogs.pop();
    localStorage.setItem("cfl_bi_sync_logs", JSON.stringify(syncLogs));
}

function loadSyncLogs() {
    const saved = localStorage.getItem("cfl_bi_sync_logs");
    if (saved) {
        syncLogs = JSON.parse(saved);
    }
}

function renderAdminConsole() {
    const slowQueriesTbody = document.getElementById("telemetry-slow-queries-tbody");
    if (slowQueriesTbody) {
        slowQueriesTbody.innerHTML = `
            <tr>
                <td><strong>rep-12 Analyse retards</strong></td>
                <td>damien.g@cfl.lu</td>
                <td style="color: #ff9500; font-weight: bold;">4.2s</td>
            </tr>
            <tr>
                <td><strong>rep-18 Qualité données</strong></td>
                <td>jean-paul.w@cfl.lu</td>
                <td style="color: #ff3b30; font-weight: bold;">6.8s</td>
            </tr>
            <tr>
                <td><strong>rep-4 Suivi RH hebdo</strong></td>
                <td>sophie.m@cfl.lu</td>
                <td style="color: #ff9500; font-weight: bold;">3.9s</td>
            </tr>
        `;
    }

    const syncTbody = document.getElementById("sync-logs-tbody");
    if (syncTbody) {
        syncTbody.innerHTML = "";
        syncLogs.forEach(log => {
            const statusClass = log.status === "Succès" ? "color: #248a3d;" : "color: #dc3545; font-weight: bold;";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${log.timestamp}</td>
                <td><strong>${log.flow}</strong></td>
                <td>${log.message}</td>
                <td style="${statusClass}">${log.status}</td>
            `;
            syncTbody.appendChild(tr);
        });
    }

function checkObsolescenceInactive(r) {
    if (!r.lastRefresh) return false;
    if (r.lastRefresh.includes("Modifié à l'instant")) return false;
    const match = r.lastRefresh.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return false;
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    const refreshDate = new Date(year, month, day);
    const now = new Date(2026, 6, 30); // Simulation: July 30, 2026
    const diffTime = now - refreshDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > (365 * 2); // Inactif > 24 mois (environ 730 jours)
}

function checkVersioningKeywords(r) {
    const rx = /\b(test|old|backup|bk)\b/i;
    return rx.test(r.title);
}

function checkPastYear(r) {
    const match = r.title.match(/\b(19\d{2}|20\d{2})\b/);
    if (match) {
        const year = parseInt(match[1]);
        return year < 2026;
    }
    return false;
}

function checkTempFolder(r) {
    if (!r.pbirsPath) return false;
    const pathUpper = r.pbirsPath.toUpperCase();
    return pathUpper.includes("/OLD") || pathUpper.includes("/ARCHIVE") || pathUpper.includes("/BACKUP");
}

function getReportQualityIssues(r) {
    const issues = [];
    if (checkObsolescenceInactive(r)) {
        issues.push({ category: "Obsolescence", rule: "Rapport inactif", criterion: "Inactif > 24 mois" });
    }
    if (checkVersioningKeywords(r)) {
        issues.push({ category: "Obsolescence", rule: "Mots-clés de versioning", criterion: "Nom contient test, old, backup, bk..." });
    }
    if (checkPastYear(r)) {
        issues.push({ category: "Obsolescence", rule: "Année dépassée", criterion: "Année dans le nom antérieure à 2026" });
    }
    if (checkTempFolder(r)) {
        issues.push({ category: "Obsolescence", rule: "Dossier temporaire", criterion: "Présent dans /OLD, /Archive ou /Backup" });
    }
    return issues;
}

    const govTbody = document.getElementById("governance-quality-tbody");
    const summaryCard = document.getElementById("pssi-compliance-alert-summary");
    const summaryText = document.getElementById("pssi-compliance-alert-text");

    if (govTbody) {
        govTbody.innerHTML = "";
        let violationsCount = 0;

        reports.forEach(r => {
            const issues = getReportQualityIssues(r);
            if (issues.length === 0) return;

            violationsCount++;

            const rulesStr = issues.map(i => i.rule).join(", ");
            const criteriaStr = issues.map(i => i.criterion).join(", ");

            const tr = document.createElement("tr");
            
            // Build action buttons
            const notifyBtn = `<button class="btn-sm-action primary" onclick="notifySteward('${r.id}', '${rulesStr}')" style="margin-right: 6px; font-size: 11px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--cfl-gray-border); background: white; cursor: pointer;">Notifier Steward</button>`;
            const archiveBtn = `<button class="btn-sm-action danger" onclick="archiveReport('${r.id}')" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background-color: var(--cfl-crimson); color: white; border: none; cursor: pointer;">Archiver</button>`;

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 700; color: var(--cfl-gray-dark);">${r.title}</div>
                    <span class="service-badge ${r.service}" style="font-size: 9px; padding: 1px 4px; margin-top: 4px; display: inline-block;">${r.service.toUpperCase()}</span>
                </td>
                <td><code style="font-family: monospace; font-size: 11px; color: var(--text-secondary);">${r.pbirsPath}</code></td>
                <td><span style="color: #dc3545; font-weight: 600;">${rulesStr}</span></td>
                <td style="font-size: 12px; color: var(--cfl-gray-dark);">${criteriaStr}</td>
                <td style="text-align: center; white-space: nowrap;">
                    ${notifyBtn}
                    ${archiveBtn}
                </td>
            `;
            govTbody.appendChild(tr);
        });

        if (summaryCard && summaryText) {
            if (violationsCount > 0) {
                summaryCard.style.display = "block";
                summaryText.innerHTML = `Gouvernance de qualité : <strong>${violationsCount} anomalie(s) active(s)</strong> d'obsolescence ou de versioning détectée(s).`;
            } else {
                summaryCard.style.display = "none";
            }
        }
    }
    renderArchiveWorkflow();
}

function archiveReport(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    if (!r.pbirsPath.toUpperCase().includes("/ARCHIVE")) {
        const parts = r.pbirsPath.split("/");
        const filename = parts.pop();
        r.pbirsPath = parts.join("/") + "/Archive/" + filename;
    }

    saveReportsToStorage();

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    logs.unshift({
        timestamp: formattedDate,
        user: "Admin BI",
        event: "Archivage Rapport",
        target: r.title,
        status: "Succès"
    });
    saveLogsToStorage();

    addSyncLog(formattedDate, "Système", `Archivage du rapport "${r.title}" pour obsolescence (Chemin mis à jour).`, "Succès");

    alert(`Le rapport "${r.title}" a été déplacé sous le dossier technique des archives :\n${r.pbirsPath}`);
    renderAll();
}

function notifySteward(reportId, ruleName) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    logs.unshift({
        timestamp: formattedDate,
        user: "Admin BI",
        event: "Alerte Obsolescence",
        target: r.title,
        status: "Steward Notifié"
    });
    saveLogsToStorage();

    addSyncLog(formattedDate, "Notification", `Alerte de gouvernance (${ruleName}) transmise au Data Steward ${r.steward}.`, "Succès");

    alert(`Notification envoyée par Teams & E-mail au Data Steward (${r.steward}) pour le rapport "${r.title}".`);
    renderAll();
}

function forceManualSync() {
    const btn = document.getElementById("admin-sync-now-btn");
    const dgBadge = document.getElementById("admin-dg-sync-badge");

    if (btn) {
        const prevText = btn.textContent;
        btn.textContent = "Synchronisation...";
        btn.disabled = true;
        btn.style.opacity = "0.7";
        if (dgBadge) {
            dgBadge.textContent = "Synchro en cours...";
            dgBadge.style.backgroundColor = "rgba(255, 149, 0, 0.1)";
            dgBadge.style.color = "#c67c00";
        }

        setTimeout(() => {
            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

            addSyncLog(formattedDate, "Active Directory", "Synchro manuelle forcée : 182 comptes utilisateurs AD et 44 groupes vérifiés.", "Succès");
            addSyncLog(formattedDate, "Data Galaxy", "Synchro manuelle forcée : 44 fiches d'identité et 25 tags mis à jour.", "Succès");

            btn.textContent = prevText;
            btn.disabled = false;
            btn.style.opacity = "";
            if (dgBadge) {
                dgBadge.textContent = "Opérationnel";
                dgBadge.style.backgroundColor = "";
                dgBadge.style.color = "";
            }

            alert("La synchronisation manuelle des habilitations Active Directory et du dictionnaire Data Galaxy s'est déroulée avec succès.");
            renderAll();
        }, 1200);
    }
}

// ========================================================
// MODERN TAG PILLS EDITOR LOGIC
// ========================================================
let currentEditingTags = [];

function renderTagPills() {
    const editor = document.getElementById("admin-tags-pill-editor");
    if (!editor) return;
    
    const pills = editor.querySelectorAll(".tag-pill");
    pills.forEach(p => p.remove());
    
    const input = document.getElementById("admin-tag-input");
    
    currentEditingTags.forEach(tag => {
        const pill = document.createElement("span");
        pill.className = "tag-pill";
        pill.innerHTML = `${tag} <button type="button" class="tag-remove-btn" onclick="removeEditingTag('${tag}')">&times;</button>`;
        editor.insertBefore(pill, input);
    });
}

function removeEditingTag(tag) {
    currentEditingTags = currentEditingTags.filter(t => t !== tag);
    renderTagPills();
}

function initTagEditorEvents() {
    const input = document.getElementById("admin-tag-input");
    if (!input) return;
    
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const tagValue = input.value.trim().replace(/,/g, "");
            if (tagValue && !currentEditingTags.includes(tagValue)) {
                currentEditingTags.push(tagValue);
                renderTagPills();
            }
            input.value = "";
        }
    });

    const editor = document.getElementById("admin-tags-pill-editor");
    if (editor) {
        editor.addEventListener("click", () => {
            input.focus();
        });
    }
}

// Expose decisions helper globally
window.openRecertifyModal = openRecertifyModal;
window.setDecision = setDecision;
window.removeEditingTag = removeEditingTag;

// Helper for days difference
function getDaysDiff(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffTime = d2 - d1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function evaluateArchiveWorkflow() {
    let needsSave = false;
    const nowSim = "2026-08-03";
    
    reports.forEach(r => {
        if (r.isPurged) return;

        // Ensure lastViewed is set
        if (!r.lastViewed) {
            if (r.id === "rep-13") r.lastViewed = "2025-05-15";
            else if (r.id === "rep-14") r.lastViewed = "2024-05-10";
            else if (r.id === "rep-33") r.lastViewed = "2024-03-10";
            else r.lastViewed = "2026-07-01";
            needsSave = true;
        }

        const daysInactive = getDaysDiff(r.lastViewed, nowSim);
        const titleLower = r.title.toLowerCase();
        const hasNamingTerm = titleLower.includes("backup") || titleLower.includes("old") || titleLower.includes("archive");

        const shouldArchiveGeneral = daysInactive >= (30 * 24); // 24 months
        const shouldArchiveNaming = hasNamingTerm && daysInactive >= (30 * 6); // 6 months

        if (r.archivedDate === undefined) {
            r.archivedDate = null;
            needsSave = true;
        }

        if (r.archivedDate === null) {
            // Check if it should be archived
            if (shouldArchiveGeneral || shouldArchiveNaming) {
                r.originalPath = r.pbirsPath;
                
                const parts = r.pbirsPath.split("/");
                const filename = parts.pop();
                r.pbirsPath = parts.join("/") + "/_Archives/" + filename;
                
                if (r.id === "rep-13") {
                    r.archivedDate = "2026-01-15"; // 200 days ago (Notified, purge in 10 days)
                } else if (r.id === "rep-33") {
                    r.archivedDate = "2026-06-03"; // 61 days ago (Archived, waiting notification)
                } else {
                    r.archivedDate = nowSim; // Newly archived today
                }
                
                needsSave = true;

                const logTime = "2026-08-03 09:00";
                logs.unshift({
                    timestamp: logTime,
                    user: "Système",
                    event: "Archivage Auto",
                    target: r.title,
                    status: "Déplacé dans _Archives"
                });
                saveLogsToStorage();
                
                addSyncLog(logTime, "Système", `Déplacement automatique de "${r.title}" vers le sous-dossier _Archives pour inactivité (${Math.floor(daysInactive/30)} mois).`, "Succès");
            }
        } else {
            const daysInArchive = getDaysDiff(r.archivedDate, nowSim);
            if (daysInArchive >= 210) { // 6 months + 30 days
                r.isPurged = true;
                needsSave = true;
                
                const logTime = "2026-08-03 10:00";
                logs.unshift({
                    timestamp: logTime,
                    user: "Système",
                    event: "Purge Auto",
                    target: r.title,
                    status: "Rapport Supprimé"
                });
                saveLogsToStorage();
                
                addSyncLog(logTime, "Système", `Purge définitive du rapport "${r.title}" après 6 mois d'archivage et 30 jours sans réponse.`, "Succès");
            } else if (daysInArchive >= 180) {
                if (!r.ownerNotified) {
                    r.ownerNotified = true;
                    needsSave = true;
                    
                    const logTime = "2026-08-03 09:30";
                    logs.unshift({
                        timestamp: logTime,
                        user: "Système",
                        event: "Notification Propriétaire",
                        target: r.title,
                        status: "Notifié"
                    });
                    saveLogsToStorage();
                    
                    addSyncLog(logTime, "Système", `Notification automatique envoyée à ${r.steward} (propriétaire) pour le rapport "${r.title}" archivé depuis 6 mois.`, "Succès");
                }
            }
        }
    });

    if (needsSave) {
        saveReportsToStorage();
    }
}

function renderArchiveWorkflow() {
    const tbody = document.getElementById("archive-workflow-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const nowSim = "2026-08-03";
    let count = 0;

    reports.forEach(r => {
        if (r.archivedDate === null && !r.isPurged) return;

        count++;
        const tr = document.createElement("tr");

        let statusBadge = "";
        let actionCell = "";
        let durationStr = "N/A";
        let archiveDateStr = r.archivedDate || "N/A";
        let triggerStr = "";

        const daysInactive = getDaysDiff(r.lastViewed || r.lastRefresh || "2026-07-01", r.archivedDate || nowSim);
        const monthsInactive = Math.floor(daysInactive / 30);
        const titleLower = r.title.toLowerCase();
        const hasNamingTerm = titleLower.includes("backup") || titleLower.includes("old") || titleLower.includes("archive");

        if (hasNamingTerm && daysInactive >= 180) {
            triggerStr = `Inactivité Naming (${monthsInactive} mois)`;
        } else {
            triggerStr = `Inactivité Générale (${monthsInactive} mois)`;
        }

        if (r.isPurged) {
            statusBadge = `<span style="background-color: rgba(220, 53, 69, 0.1); color: #dc3545; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Purgé (Définitif)</span>`;
            actionCell = `<span style="color: var(--text-secondary); font-size: 11.5px;">Supprimé de la plateforme</span>`;
            durationStr = "Purgé";
        } else {
            const daysInArchive = getDaysDiff(r.archivedDate, nowSim);
            durationStr = `${daysInArchive} jours`;

            if (daysInArchive >= 180) {
                const daysLeft = 210 - daysInArchive;
                const displayDaysLeft = daysLeft > 0 ? daysLeft : 0;
                statusBadge = `<span style="background-color: rgba(255, 149, 0, 0.1); color: #ff9500; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Alerte Propriétaire (Purge sous ${displayDaysLeft}j)</span>`;
                actionCell = `
                    <button class="btn-sm-action primary" onclick="restoreFromArchive('${r.id}')" style="margin-right: 6px; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; border: 1px solid var(--cfl-gray-border); background: white;">Restaurer</button>
                    <button class="btn-sm-action danger" onclick="purgeImmediately('${r.id}')" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background-color: var(--cfl-crimson); color: white; border: none; cursor: pointer;">Purger</button>
                `;
            } else {
                statusBadge = `<span style="background-color: rgba(0, 122, 255, 0.1); color: #007aff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Archivé (_Archives)</span>`;
                actionCell = `
                    <button class="btn-sm-action primary" onclick="restoreFromArchive('${r.id}')" style="margin-right: 6px; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; border: 1px solid var(--cfl-gray-border); background: white;">Restaurer</button>
                    <button class="btn-sm-action" onclick="simulateOwnerNotification('${r.id}')" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; border: 1px solid var(--cfl-gray-border); background: white;">Simuler Alerte</button>
                `;
            }
        }

        tr.innerHTML = `
            <td>
                <div style="font-weight: 700; color: var(--cfl-gray-dark);">${r.title}</div>
                <span class="service-badge ${r.service}" style="font-size: 9px; padding: 1px 4px; margin-top: 4px; display: inline-block;">${r.service.toUpperCase()}</span>
            </td>
            <td><span style="font-size: 12px; font-weight: 500; color: var(--cfl-gray-dark);">${triggerStr}</span></td>
            <td><code style="font-family: monospace; font-size: 11.5px;">${archiveDateStr}</code></td>
            <td><strong style="color: var(--cfl-crimson);">${durationStr}</strong></td>
            <td>${statusBadge}</td>
            <td style="text-align: center; white-space: nowrap;">${actionCell}</td>
        `;
        tbody.appendChild(tr);
    });

    if (count === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); font-style: italic; padding: 15px 0;">Aucun rapport dans le cycle d'archivage.</td></tr>`;
    }
}

function restoreFromArchive(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    if (r.originalPath) {
        r.pbirsPath = r.originalPath;
    } else {
        r.pbirsPath = r.pbirsPath.replace("/_Archives/", "/");
    }

    r.archivedDate = null;
    r.ownerNotified = false;
    r.lastViewed = "2026-08-03";
    r.isPurged = false;

    saveReportsToStorage();

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    logs.unshift({
        timestamp: formattedDate,
        user: "Admin BI",
        event: "Restauration Rapport",
        target: r.title,
        status: "Succès (Actif)"
    });
    saveLogsToStorage();

    addSyncLog(formattedDate, "Système", `Le rapport "${r.title}" a été restauré par l'administrateur (Déplacé hors de _Archives et inactivité réinitialisée).`, "Succès");

    alert(`Le rapport "${r.title}" a été restauré avec succès dans son dossier d'origine.`);
    renderAll();
}

function purgeImmediately(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    if (confirm(`Voulez-vous vraiment purger définitivement le rapport "${r.title}" de la plateforme ? Cette action est irréversible.`)) {
        r.isPurged = true;
        saveReportsToStorage();

        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        logs.unshift({
            timestamp: formattedDate,
            user: "Admin BI",
            event: "Purge Rapport",
            target: r.title,
            status: "Purgé"
        });
        saveLogsToStorage();

        addSyncLog(formattedDate, "Système", `Purge manuelle définitive du rapport "${r.title}".`, "Succès");

        alert(`Le rapport "${r.title}" a été purgé définitivement.`);
        renderAll();
    }
}

function simulateOwnerNotification(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    r.ownerNotified = true;
    r.archivedDate = "2026-01-15"; // 200 days ago
    saveReportsToStorage();

    logs.unshift({
        timestamp: formattedDate,
        user: "Système",
        event: "Notification Force",
        target: r.title,
        status: "Propriétaire Notifié"
    });
    saveLogsToStorage();

    addSyncLog(formattedDate, "Notification", `Simulation d'alerte d'archivage envoyée au propriétaire ${r.steward} pour le rapport "${r.title}".`, "Succès");

    alert(`Alerte de cycle de vie simulée : E-mail de notification envoyé au propriétaire ${r.steward}.\nLe rapport est passé au statut "Alerte Propriétaire" avec 30 jours de délai de relance.`);
    renderAll();
}

window.restoreFromArchive = restoreFromArchive;
window.purgeImmediately = purgeImmediately;
window.simulateOwnerNotification = simulateOwnerNotification;
