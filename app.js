// app.js - CFL Analysis Interactive Engine

// 1. Initial Mock Database of CFL Reports with Classifications and PSSI Sensitivity
const INITIAL_REPORTS = [
    {
        id: "rep-1",
        title: "Rapport Ponctualité Voyageurs",
        desc: "Suivi quotidien du taux de ponctualité des trains de voyageurs (TER, TGV, Transfrontaliers). Analyse par ligne, par gare et par tranche horaire.",
        service: "voyageurs",
        classification: "dwh", // Certifié DWH
        pssi: "interne", // PSSI: Interne
        tags: ["KPI", "Temps réel", "Critique"],
        owner: "Jean-Marc Muller (Service Voyageurs)",
        frequency: "Quotidien",
        lastRefresh: "Aujourd'hui à 14:15",
        pbirsPath: "/Voyageurs/Exploitation/Taux_Ponctualite",
        viewCount: 1420,
        adGroups: ["CFL-Voyageurs-Editeurs", "CFL-Data-Analysts", "CFL-Direction-Generale"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/Voyageurs/Taux_Ponctualite"
    },
    {
        id: "rep-2",
        title: "Suivi Maintenance Matériel Roulant",
        desc: "État de la flotte de locomotives et voitures voyageurs. Planification de la maintenance préventive et suivi en temps réel des pannes critiques.",
        service: "infra",
        classification: "dwh", // Certifié DWH
        pssi: "restreint", // PSSI: Restreint
        tags: ["Sécurité", "KPI", "Temps réel"],
        owner: "Marc Weber (Direction Matériel)",
        frequency: "Quotidien",
        lastRefresh: "Aujourd'hui à 13:50",
        pbirsPath: "/Infra/Technique/Maintenance_Roulant",
        viewCount: 980,
        adGroups: ["CFL-Infra-Techniciens", "CFL-Data-Analysts", "CFL-Voyageurs-Editeurs"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/Infra/Maintenance_Roulant"
    },
    {
        id: "rep-3",
        title: "KPI Fret Cargo - Tonnage & CA",
        desc: "Suivi mensuel du volume de fret transporté en tonnes-kilomètres et du chiffre d'affaires associé par corridor européen de fret.",
        service: "fret",
        classification: "dwh", // Certifié DWH
        pssi: "interne", // PSSI: Interne
        tags: ["KPI", "Mensuel", "Budget"],
        owner: "Sandrine Schultz (CFL Cargo)",
        frequency: "Mensuel",
        lastRefresh: "Le 12/07/2026 à 09:30",
        pbirsPath: "/Fret/Financier/KPI_Tonnage_CA",
        viewCount: 750,
        adGroups: ["CFL-Fret-Managers", "CFL-Finances-Controleurs"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/Fret/KPI_Tonnage_CA"
    },
    {
        id: "rep-4",
        title: "Registre & Conformité RGPD",
        desc: "Suivi de la conformité du traitement des données personnelles des agents et clients CFL. Contient des informations sensibles soumises à habilitation stricte.",
        service: "rh",
        classification: "self-service", // Self-Service
        pssi: "confidentiel", // PSSI: Confidentiel
        tags: ["RGPD", "Critique", "Sécurité"],
        owner: "Laura Ries (DPO Groupe)",
        frequency: "Mensuel",
        lastRefresh: "Le 01/07/2026 à 08:00",
        pbirsPath: "/RH/Gouvernance/Registre_RGPD",
        viewCount: 120,
        adGroups: ["CFL-RH-Dirigeants", "CFL-DPO-Groupe"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/RH/Registre_RGPD"
    },
    {
        id: "rep-5",
        title: "Exécution Budgétaire & Écarts",
        desc: "Analyse budgétaire globale du groupe CFL. Comparaison entre les prévisions annuelles et les dépenses réelles par service et projet.",
        service: "finances",
        classification: "dwh", // Certifié DWH
        pssi: "restreint", // PSSI: Restreint
        tags: ["Budget", "KPI", "Mensuel"],
        owner: "Pierre Wagner (Direction Financière)",
        frequency: "Mensuel",
        lastRefresh: "Le 10/07/2026 à 17:45",
        pbirsPath: "/Finances/Controle/Suivi_Budgetaire",
        viewCount: 1100,
        adGroups: ["CFL-Finances-Controleurs", "CFL-Direction-Generale"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/Finances/Suivi_Budgetaire"
    },
    {
        id: "rep-6",
        title: "Taux d'Absentéisme & Santé au Travail",
        desc: "Indicateurs d'absentéisme par type de cause (maladie, accident de travail) et par catégorie professionnelle. Permet de piloter les plans de prévention.",
        service: "rh",
        classification: "self-service", // Self-Service
        pssi: "restreint", // PSSI: Restreint
        tags: ["KPI", "Mensuel", "RGPD"],
        owner: "Sophie Mertens (RH Groupe)",
        frequency: "Mensuel",
        lastRefresh: "Le 05/07/2026 à 10:15",
        pbirsPath: "/RH/Sante/Taux_Absenteisme",
        viewCount: 450,
        adGroups: ["CFL-RH-Dirigeants", "CFL-RH-Sante"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/RH/Taux_Absenteisme"
    },
    {
        id: "rep-7",
        title: "Consommation Énergétique des Trains",
        desc: "Analyse de la consommation d'énergie (électricité de traction, gasoil) par type de matériel roulant. Outil de pilotage de l'éco-conduite.",
        service: "infra",
        classification: "self-service", // Self-Service
        pssi: "interne", // PSSI: Interne
        tags: ["Temps réel", "KPI"],
        owner: "Luc Nicolas (Transition Énergétique)",
        frequency: "Quotidien",
        lastRefresh: "Aujourd'hui à 12:00",
        pbirsPath: "/Infra/Energie/Consommation_Traction",
        viewCount: 680,
        adGroups: ["CFL-Infra-Techniciens", "CFL-Data-Analysts"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/Infra/Consommation_Traction"
    },
    {
        id: "rep-8",
        title: "Plan de Recrutement & Effectifs",
        desc: "Suivi des recrutements en cours par rapport au plan annuel de dotation. Gestion prévisionnelle des emplois et des départs à la retraite.",
        service: "rh",
        classification: "public", // Public
        pssi: "public", // PSSI: Public
        tags: ["Budget", "Mensuel"],
        owner: "Sophie Mertens (RH Groupe)",
        frequency: "Mensuel",
        lastRefresh: "Le 14/07/2026 à 15:20",
        pbirsPath: "/RH/Recrutement/Effectifs_Recrutement",
        viewCount: 380,
        adGroups: ["CFL-RH-Dirigeants", "CFL-Finances-Controleurs"],
        pbirsUrl: "https://pbirs.cfl.lu/reports/powerbi/RH/Effectifs_Recrutement"
    }
];

// Audit logs base
const INITIAL_LOGS = [
    { timestamp: "2026-07-16 15:10", user: "Damien G.", event: "Sync Data Galaxy", target: "Rapport Ponctualité Voyageurs", status: "Succès" },
    { timestamp: "2026-07-16 14:32", user: "Sophie M.", event: "Workflow Partage", target: "Plan de Recrutement -> L.Faber", status: "Approuvé" },
    { timestamp: "2026-07-16 11:15", user: "Marc W.", event: "Modif. Métadonnées", target: "Suivi Maintenance Matériel Roulant", status: "Succès" },
    { timestamp: "2026-07-16 09:05", user: "System", event: "Auto-sync Data Galaxy", target: "18 tags synchronisés", status: "Succès" }
];

// 2. Global State Variables
let reports = [];
let logs = [];
let activeTab = "dashboard"; // "dashboard", "catalog", "governance"
let selectedService = "all";
let selectedClassification = "all";
let selectedPssi = "all"; // PSSI filter
let selectedTags = [];
let searchQuery = "";
let favorites = [];
let history = [];

// 3. Initialize App
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    initEventListeners();
    renderAll();
});

// 4. State Persistence Helpers
function loadState() {
    const savedReports = localStorage.getItem("cfl_bi_reports");
    if (savedReports) {
        reports = JSON.parse(savedReports);
    } else {
        reports = [...INITIAL_REPORTS];
        saveReportsToStorage();
    }

    const savedLogs = localStorage.getItem("cfl_bi_logs");
    if (savedLogs) {
        logs = JSON.parse(savedLogs);
    } else {
        logs = [...INITIAL_LOGS];
        saveLogsToStorage();
    }

    const savedFavs = localStorage.getItem("cfl_bi_favorites");
    favorites = savedFavs ? JSON.parse(savedFavs) : ["rep-1", "rep-2"];

    const savedHist = localStorage.getItem("cfl_bi_history");
    history = savedHist ? JSON.parse(savedHist) : ["rep-1", "rep-3", "rep-5"];
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

// 5. DOM Event Listeners binding
function initEventListeners() {
    // Tabs selection in sidebar
    document.querySelectorAll('#nav-prototype-group .nav-item').forEach(item => {
        item.addEventListener("click", (e) => {
            const tabId = e.currentTarget.getAttribute("data-tab-target");
            switchTab(tabId);
        });
    });

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
    if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

    // Favorite button inside Drawer
    const drawerFavBtn = document.getElementById("drawer-fav-action-btn");
    if (drawerFavBtn) {
        drawerFavBtn.addEventListener("click", () => {
            const reportId = drawerFavBtn.getAttribute("data-report-id");
            toggleFavorite(reportId);
            updateDrawerFavButton(reportId);
        });
    }

    // Share button inside Drawer -> Open Modal
    const drawerShareBtn = document.getElementById("drawer-share-action-btn");
    if (drawerShareBtn) {
        drawerShareBtn.addEventListener("click", () => {
            const reportId = drawerFavBtn.getAttribute("data-report-id");
            openShareModal(reportId);
        });
    }

    // Modal Close
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalCancelBtn = document.getElementById("share-cancel-btn");
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeShareModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeShareModal);

    // Modal Submit
    const modalSubmitBtn = document.getElementById("share-submit-btn");
    if (modalSubmitBtn) {
        modalSubmitBtn.addEventListener("click", submitShareWorkflow);
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
    document.getElementById("section-governance").classList.remove("active");

    const targetSection = document.getElementById(`section-${tabId}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    if (tabId === "dashboard") {
        renderDashboard();
    } else if (tabId === "catalog") {
        renderCatalog();
    } else if (tabId === "governance") {
        renderAdminPanel();
    }
}

// 8. Rendering Engine
function renderAll() {
    renderDashboard();
    renderCatalog();
    renderAdminPanel();
}

// --- DASHBOARD RENDERING ---
function renderDashboard() {
    document.getElementById("kpi-total-reports").textContent = reports.length;
    
    const certifiedReports = reports.filter(r => r.classification === "dwh");
    document.getElementById("kpi-total-certified").textContent = certifiedReports.length;
    
    document.getElementById("kpi-total-favorites").textContent = favorites.length;

    // Render Favorites List (Dashboard Panel)
    const favListContainer = document.getElementById("dashboard-favorites-list");
    favListContainer.innerHTML = "";
    
    const favReports = reports.filter(r => favorites.includes(r.id));
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
                    <span class="nav-icon">⭐</span>
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
    
    const popularReports = [...reports].sort((a, b) => b.viewCount - a.viewCount).slice(0, 3);
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

    // Render Recently Viewed History
    const historyContainer = document.getElementById("dashboard-history-list");
    historyContainer.innerHTML = "";
    
    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="text-secondary" style="font-size: 13px; font-style: italic;">Aucun rapport consulté récemment.</p>`;
    } else {
        const historyReports = history
            .map(id => reports.find(r => r.id === id))
            .filter(r => r !== undefined)
            .reverse()
            .slice(0, 3);

        historyReports.forEach(r => {
            const item = document.createElement("div");
            item.className = "list-item-row";
            item.innerHTML = `
                <div class="item-left">
                    <span class="nav-icon">🕒</span>
                    <span class="item-title">${r.title}</span>
                </div>
                <span class="item-meta">Refresh: ${r.frequency}</span>
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
    reports.forEach(r => r.tags.forEach(t => allTags.add(t)));
    
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
    } else {
        filteredReports.forEach(r => {
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
            
            grid.appendChild(card);
        });
    }
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
    
    const filteredReports = reports.filter(r => favorites.includes(r.id));
    
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
        filteredReports.forEach(r => {
            const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
            const classifClass = r.classification;
            const pssiLabel = `PSSI: ${r.pssi.toUpperCase()}`;
            const pssiClass = r.pssi;
            
            const card = document.createElement("div");
            card.className = "report-card";
            card.innerHTML = `
                <div class="report-header">
                    <div class="report-title-area">
                        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom: 4px;">
                            <span class="classif-badge ${classifClass}" style="padding: 2px 6px; font-size: 9px;">${classifLabel}</span>
                            <span class="pssi-badge ${pssiClass}" style="padding: 2px 6px; font-size: 9px;">${pssiLabel}</span>
                        </div>
                        <span class="report-card-title">${r.title}</span>
                    </div>
                    <button class="fav-btn active" data-report-id="${r.id}" aria-label="Favori">★</button>
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
                    filterCatalogByFavorites();
                    return;
                }
                openDrawer(r.id);
            });
            grid.appendChild(card);
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

// --- ADMIN / GOVERNANCE TAB RENDERING ---
function renderAdminPanel() {
    const adminSelect = document.getElementById("admin-select-report");
    if (!adminSelect) return;
    
    const prevSelectedValue = adminSelect.value;
    adminSelect.innerHTML = "";

    reports.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `${r.title} [${r.service.toUpperCase()}]`;
        adminSelect.appendChild(opt);
    });

    if (prevSelectedValue && reports.some(r => r.id === prevSelectedValue)) {
        adminSelect.value = prevSelectedValue;
    } else if (reports.length > 0) {
        adminSelect.value = reports[0].id;
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
}

function loadReportInAdminForm(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("admin-report-owner").value = r.owner;
    document.getElementById("admin-report-service").value = r.service;
    document.getElementById("admin-report-classif").value = r.classification;
    document.getElementById("admin-report-pssi").value = r.pssi;
    document.getElementById("admin-report-freq").value = r.frequency;
    document.getElementById("admin-report-desc").value = r.desc;
    document.getElementById("admin-report-tags").value = r.tags.join(", ");
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
    const desc = document.getElementById("admin-report-desc").value.trim();
    
    const rawTags = document.getElementById("admin-report-tags").value;
    const tags = rawTags.split(",")
        .map(t => t.trim())
        .filter(t => t !== "");

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
    reports[rIdx].tags = tags;
    reports[rIdx].lastRefresh = "Modifié à l'instant (Sync Data Galaxy)";

    saveReportsToStorage();

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const newLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Sync Data Galaxy",
        target: reports[rIdx].title,
        status: "Succès"
    };

    logs.unshift(newLog);
    saveLogsToStorage();

    renderAll();
    
    alert(`Les métadonnées du rapport "${reports[rIdx].title}" ont été enregistrées et synchronisées avec Data Galaxy !`);
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
    if (history.length > 10) history.shift();
    saveHistoryToStorage();

    const drawerTitle = document.getElementById("drawer-report-title");
    const drawerTitleHeading = document.getElementById("drawer-title-heading");
    const drawerBadge = document.getElementById("drawer-service-badge");
    const drawerClassBadge = document.getElementById("drawer-classification-badge");
    const drawerPssiBadge = document.getElementById("drawer-pssi-badge");
    const drawerDesc = document.getElementById("drawer-description");
    
    const drawerOwner = document.getElementById("drawer-owner");
    const drawerFreq = document.getElementById("drawer-frequency");
    const drawerRefresh = document.getElementById("drawer-last-refresh");
    const drawerPath = document.getElementById("drawer-pbirs-path");
    const drawerTags = document.getElementById("drawer-tags-container");
    const drawerAccessList = document.getElementById("drawer-access-list");
    const pbirsLinkBtn = document.getElementById("drawer-open-report-btn");

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

    if (drawerDesc) drawerDesc.textContent = r.desc;
    
    if (drawerOwner) drawerOwner.textContent = r.owner;
    if (drawerFreq) drawerFreq.textContent = r.frequency;
    if (drawerRefresh) drawerRefresh.textContent = r.lastRefresh;
    if (drawerPath) drawerPath.textContent = r.pbirsPath;
    
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
        r.adGroups.forEach(grp => {
            const li = document.createElement("li");
            li.className = "access-user-item";
            li.innerHTML = `<span class="access-user-dot"></span> Groupe AD '${grp}'`;
            drawerAccessList.appendChild(li);
        });
    }

    if (pbirsLinkBtn) {
        pbirsLinkBtn.href = r.pbirsUrl;
        pbirsLinkBtn.onclick = () => {
            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            const linkLog = {
                timestamp: formattedDate,
                user: "Damien G.",
                event: "Accès SSO Rapport",
                target: r.title,
                status: "Succès"
            };
            logs.unshift(linkLog);
            saveLogsToStorage();
            renderAdminPanel();
        };
    }

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

// 10. Share Modal Logic
function openShareModal(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("modal-report-id").value = reportId;
    document.getElementById("share-user").value = "";
    document.getElementById("share-reason").value = "";
    document.getElementById("share-workflow").value = "direct";

    const modal = document.getElementById("share-modal");
    if (modal) modal.style.display = "flex";
}

function closeShareModal() {
    const modal = document.getElementById("share-modal");
    if (modal) modal.style.display = "none";
}

function submitShareWorkflow() {
    const reportId = document.getElementById("modal-report-id").value;
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    const shareUser = document.getElementById("share-user").value.trim();
    const shareReason = document.getElementById("share-reason").value.trim();
    const workflowType = document.getElementById("share-workflow").value;

    if (shareUser === "") {
        alert("Veuillez renseigner le nom ou l'e-mail du collaborateur.");
        return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const workflowLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Workflow Partage",
        target: `${r.title} -> ${shareUser}`,
        status: "En attente d'approbation"
    };

    logs.unshift(workflowLog);
    saveLogsToStorage();

    closeShareModal();
    renderAll();

    alert(`Le workflow de partage pour "${r.title}" vers "${shareUser}" a été initié. Le Business Owner (${r.owner.split(' (')[0]}) a été notifié par e-mail pour approbation.`);
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
