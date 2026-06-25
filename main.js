import { loadData, filterData, counter, miniMax, getBestCategory, dataMapper } from "./tools.js";

const API_URL = "https://raw.githubusercontent.com/germanter/apiEngine/refs/heads/main/api.json";

// Dashboard Global State
let rawData = [];
let selectedCategories = [];
let selectedStatuses = [];
let selectedCosts = [];

let gaugeChartInstance = null;
let costChartInstance = null;

// --- DİL VƏ RƏNG MAPPERİ ---
function translate(entry, type = "aze") {
    const res = dataMapper(entry, type);
    const val = res && res.status ? res.content : entry;
    
    // Tərcümələrin avtomatik böyük hərflə başlamasını təmin edirik
    if (typeof val === 'string' && type === "aze" && val.length > 0) {
        return val.charAt(0).toUpperCase() + val.slice(1);
    }
    return val;
}

// --- TƏŞBİT (INITIALIZATION) ---
document.addEventListener("DOMContentLoaded", async () => {
    await initDashboard();
    setupEventListeners();
});

async function initDashboard() {
    const loadingBtn = document.getElementById("refresh-btn");
    loadingBtn.innerText = "Yüklənir...";
    
    const result = await loadData(API_URL);
    if (result.status && Array.isArray(result.content)) {
        rawData = result.content;
    } else {
        console.error("initDashboard failed");
    }
    
    loadingBtn.innerHTML = `
        <svg class="btn-svg-icon loading-active" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg> 
        Yenilə
    `;    
    renderAll();
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Yenilə düyməsi
    document.getElementById("refresh-btn").addEventListener("click", async () => {
        selectedCategories = [];
        selectedStatuses = [];
        selectedCosts = [];
        await initDashboard();
    });

    // Aktiv status düymələri
    document.getElementById("status-filter-buttons").addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;
        const status = btn.dataset.status;
        toggleFilter(selectedStatuses, status);
        renderAll();
    });

    // Aktiv cost düymələri
    document.getElementById("cost-filter-buttons").addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;
        const cost = btn.dataset.cost;
        toggleFilter(selectedCosts, cost);
        renderAll();
    });

    // Sol blok: Kateqoriyalara klikləmə
    document.getElementById("category-bars-container").addEventListener("click", (e) => {
        const row = e.target.closest(".category-bar-wrapper");
        if (!row) return;
        const category = row.dataset.category;
        toggleFilter(selectedCategories, category);
        renderAll();
    });
}

function toggleFilter(array, value) {
    const index = array.indexOf(value);
    if (index > -1) {
        array.splice(index, 1);
    } else {
        array.push(value);
    }
}

// --- RENDER ALL COMPONENTS ---
function renderAll() {
    renderKPIs();
    renderGaugeChartAndFilters();
    renderCostChartAndFilters();
    renderCategories();
    renderApiTable();
}

// --- 1. KPI PANELİ (Dəqiqləşdirilmiş hesablama məntiqi) ---
function renderKPIs() {
    // KART 1: Ən çox API sayı olan kateqoriya adı və onun sayı (miniMax istifadəsi)
    const catGroup = counter(rawData, "category");
    if (catGroup.status) {
        const maxCat = miniMax(catGroup.content, "max");
        if (maxCat.status && maxCat.content) {
            const translatedCat = translate(maxCat.content.field, "aze");
            document.getElementById("total-apis-count").innerText = `${translatedCat} (${maxCat.content.value})`;
        } else {
            document.getElementById("total-apis-count").innerText = "-";
        }
    } else {
        document.getElementById("total-apis-count").innerText = "-";
    }

    // KART 2: Ən Yaxşı Kateqoriya (getBestCategory)
    const bestCatRes = getBestCategory(rawData);
    if (bestCatRes.status && bestCatRes.content !== "NONE") {
        document.getElementById("best-category-value").innerText = translate(bestCatRes.content, "aze");
    } else {
        document.getElementById("best-category-value").innerText = "-";
    }

    // KART 3: Ən çox aktiv API sayı olan kateqoriya və onun sayı (miniMax istifadəsi)
    const aliveAPIs = rawData.filter(item => item.status === "ALIVE");
    const aliveCatGroup = counter(aliveAPIs, "category");
    if (aliveCatGroup.status) {
        const maxAliveCat = miniMax(aliveCatGroup.content, "max");
        if (maxAliveCat.status && maxAliveCat.content) {
            const translatedAliveCat = translate(maxAliveCat.content.field, "aze");
            document.getElementById("alive-apis-count").innerText = `${translatedAliveCat} (${maxAliveCat.content.value})`;
        } else {
            document.getElementById("alive-apis-count").innerText = "-";
        }
    } else {
        document.getElementById("alive-apis-count").innerText = "-";
    }
}

// --- 2. GAUGE CHART & FILTERS (Daha böyük vizual ölçüdə) ---
function renderGaugeChartAndFilters() {
    const gaugeFilter = {};
    if (selectedCategories.length > 0) gaugeFilter.category = selectedCategories;
    if (selectedCosts.length > 0) gaugeFilter.cost = selectedCosts;

    const filteredResult = filterData(rawData, gaugeFilter);
    const filteredForGauge = filteredResult.status ? filteredResult.content : [];

    const statusCounts = counter(filteredForGauge, "status").content || {};
    const aliveCount = statusCounts["ALIVE"] || 0;
    const deadCount = statusCounts["DEAD"] || 0;
    const unknownCount = statusCounts["UNKNOWN"] || 0;

    const gaugeOptions = {
        series: [aliveCount, deadCount, unknownCount],
        chart: {
            type: 'donut',
            height: 165, // Diaqramın vizual hündürlüyü böyüdüldü
            sparkline: { enabled: true }
        },
        plotOptions: {
            pie: {
                startAngle: -90,
                endAngle: 90,
                offsetY: 15,
                donut: {
                    size: '78%', // Diaqram həlqəsinin nisbi qalınlığı artırıldı
                    labels: {
                        show: true,
                        name: { show: false },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#252423',
                            offsetY: -5,
                            formatter: function (val) { return val; }
                        },
                        total: {
                            show: true,
                            label: 'Cəmi',
                            color: '#605e5c',
                            fontSize: '10px',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        colors: [
            translate("ALIVE", "colors"),
            translate("DEAD", "colors"),
            translate("UNKNOWN", "colors")
        ],
        labels: [
            translate("ALIVE", "aze"),
            translate("DEAD", "aze"),
            translate("UNKNOWN", "aze")
        ],
        legend: { show: false },
        dataLabels: { enabled: false },
        tooltip: {
            enabled: true,
            y: { formatter: (val) => `${val} API` }
        }
    };

    if (!gaugeChartInstance) {
        gaugeChartInstance = new ApexCharts(document.querySelector("#gauge-chart"), gaugeOptions);
        gaugeChartInstance.render();
    } else {
        gaugeChartInstance.updateOptions(gaugeOptions);
    }

    const btnContainer = document.getElementById("status-filter-buttons");
    btnContainer.innerHTML = `
        <button class="filter-btn status-btn ${selectedStatuses.includes('ALIVE') ? 'active' : ''}" data-status="ALIVE">
            <span class="badge-dot" style="background-color: ${translate("ALIVE", "colors")}"></span>
            ${translate("ALIVE", "aze")} (${aliveCount})
        </button>
        <button class="filter-btn status-btn ${selectedStatuses.includes('DEAD') ? 'active' : ''}" data-status="DEAD">
            <span class="badge-dot" style="background-color: ${translate("DEAD", "colors")}"></span>
            ${translate("DEAD", "aze")} (${deadCount})
        </button>
        <button class="filter-btn status-btn ${selectedStatuses.includes('UNKNOWN') ? 'active' : ''}" data-status="UNKNOWN">
            <span class="badge-dot" style="background-color: ${translate("UNKNOWN", "colors")}"></span>
            ${translate("UNKNOWN", "aze")} (${unknownCount})
        </button>
    `;
}

// --- 3. COST CHART & FILTERS ---
function renderCostChartAndFilters() {
    const costFilter = {};
    if (selectedCategories.length > 0) costFilter.category = selectedCategories;
    if (selectedStatuses.length > 0) costFilter.status = selectedStatuses;

    const filteredResult = filterData(rawData, costFilter);
    const filteredForCost = filteredResult.status ? filteredResult.content : [];

    const costCounts = counter(filteredForCost, "cost").content || {};
    const freeCount = costCounts["free"] || 0;
    const freemiumCount = costCounts["freemium"] || 0;
    const premiumCount = costCounts["premium"] || 0;

    const costOptions = {
        series: [{
            name: 'API Sayı',
            data: [freeCount, freemiumCount, premiumCount]
        }],
        chart: {
            type: 'bar',
            height: 130, // Standart yığcam ölçüdə saxlanılıb
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '50%',
                distributed: true,
                borderRadius: 3
            }
        },
        dataLabels: { enabled: true },
        colors: [
            translate("free", "colors"),
            translate("freemium", "colors"),
            translate("premium", "colors")
        ],
        xaxis: {
            categories: [
                translate("free", "aze"),
                translate("freemium", "aze"),
                translate("premium", "aze")
            ],
            labels: { style: { colors: '#605e5c', fontSize: '9px' } }
        },
        grid: {
            borderColor: '#f3f2f1',
            strokeDashArray: 4
        },
        legend: { show: false },
        tooltip: {
            enabled: true,
            y: { formatter: (val) => `${val} API` }
        }
    };

    if (!costChartInstance) {
        costChartInstance = new ApexCharts(document.querySelector("#cost-chart"), costOptions);
        costChartInstance.render();
    } else {
        costChartInstance.updateOptions(costOptions);
    }

    const btnContainer = document.getElementById("cost-filter-buttons");
    btnContainer.innerHTML = `
        <button class="filter-btn cost-btn ${selectedCosts.includes('free') ? 'active' : ''}" data-cost="free">
            <span class="badge-dot" style="background-color: ${translate("free", "colors")}"></span>
            ${translate("free", "aze")} (${freeCount})
        </button>
        <button class="filter-btn cost-btn ${selectedCosts.includes('freemium') ? 'active' : ''}" data-cost="freemium">
            <span class="badge-dot" style="background-color: ${translate("freemium", "colors")}"></span>
            ${translate("freemium", "aze")} (${freemiumCount})
        </button>
        <button class="filter-btn cost-btn ${selectedCosts.includes('premium') ? 'active' : ''}" data-cost="premium">
            <span class="badge-dot" style="background-color: ${translate("premium", "colors")}"></span>
            ${translate("premium", "aze")} (${premiumCount})
        </button>
    `;
}

// --- 4. KATEQORİYALAR (Sıralanmış Blok) ---
function renderCategories() {
    const categoryFilter = {};
    if (selectedStatuses.length > 0) categoryFilter.status = selectedStatuses;
    if (selectedCosts.length > 0) categoryFilter.cost = selectedCosts;

    const filteredResult = filterData(rawData, categoryFilter);
    const filteredForCategories = filteredResult.status ? filteredResult.content : [];

    const catCounts = counter(filteredForCategories, "category").content || {};

    const container = document.getElementById("category-bars-container");
    container.innerHTML = "";

    const sortedCategories = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
    
    const counts = Object.values(catCounts);
    const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

    sortedCategories.forEach(cat => {
        const count = catCounts[cat];
        const percent = (count / maxCount) * 100;

        const row = document.createElement("div");
        row.className = `category-bar-wrapper ${selectedCategories.includes(cat) ? 'active' : ''}`;
        row.dataset.category = cat;

        row.innerHTML = `
            <div class="category-bar-info">
                <span class="category-name">${translate(cat, "aze")}</span>
                <span class="category-count">${count}</span>
            </div>
            <div class="category-bar-bg">
                <div class="category-bar-fill" style="width: ${percent}%"></div>
            </div>
        `;
        container.appendChild(row);
    });
}

// --- 5. CƏDVƏL RENDERİ ---
function renderApiTable() {
    const finalFilter = {};
    if (selectedCategories.length > 0) finalFilter.category = selectedCategories;
    if (selectedStatuses.length > 0) finalFilter.status = selectedStatuses;
    if (selectedCosts.length > 0) finalFilter.cost = selectedCosts;

    const filteredResult = filterData(rawData, finalFilter);
    const filteredData = filteredResult.status ? filteredResult.content : [];

    document.getElementById("filtered-count-label").innerText = `Göstərilir: ${filteredData.length} / ${rawData.length}`;

    const mappedForTable = filteredData.map(item => {
        let numericStatus = 2; // UNKNOWN (Sarı)
        if (item.status === "ALIVE") numericStatus = 1;
        if (item.status === "DEAD") numericStatus = 0;

        return {
            n: item.name || "",
            d: item.desc || "",
            m: translate(item.cost, "aze") || item.cost,
            a: item.auth,
            c: translate(item.category, "aze") || item.category,
            s: numericStatus,
            u: item.url || ""
        };
    });

    const table = document.getElementById("api-table");
    renderTableRows(table, mappedForTable);
}

// --- HELPERS (Cədvəl funksiyaları) ---
function renderTableRows(table, data) {
    const headName = translate("name", "aze");
    const headDesc = translate("desc", "aze");
    const headCost = translate("cost", "aze");
    const headAuth = translate("auth", "aze");
    const headCategory = translate("category", "aze");
    const headStatus = translate("status", "aze");

    table.innerHTML = `
        <thead>
            <tr>
                <th style="text-transform: capitalize;">${headName}</th>
                <th style="text-transform: capitalize;">${headDesc}</th>
                <th style="text-transform: capitalize;">${headCost}</th>
                <th style="text-transform: capitalize;">${headAuth}</th>
                <th style="text-transform: capitalize;">${headCategory}</th>
                <th style="text-transform: capitalize;">${headStatus}</th>
                <th>Keçid</th>
            </tr>
        </thead>
        <tbody id="tableBody"></tbody>
    `;

    const tbody = table.querySelector('tbody');
    data.forEach((item) => {
        const row = document.createElement("tr");
        
        const statusColor = item.s === 1 ? "green" : (item.s === 0 ? "red" : "yellow");
        const authColor = item.a === true ? "green" : "red";
        
        const shortDesc = item.d.length > 30 ? item.d.substring(0, 30) + "..." : item.d;
        const shortCat = item.c.length > 12 ? item.c.substring(0, 12) + "..." : item.c;
        const shortName = item.n.length > 20 ? item.n.substring(0, 20) + "..." : item.n;

        row.innerHTML = `
            <td title="${item.n}"><strong>${shortName}</strong></td>
            <td class="desc" title="${item.d}">${shortDesc}</td>
            <td style="text-transform: capitalize;">${item.m}</td>
            <td title="Yaşıl=(Auth Var) | Qırmızı=(NoAuth)">Auth: <span class="dot ${authColor}"></span></td>
            <td title="${item.c}">${shortCat}</td>
            <td title="Yaşıl=Aktiv | Qırmızı=Deaktiv | Sarı=Bilinmir">Status <span class="dot ${statusColor}"></span></td>
            <td>
                <a href="${item.u}" target="_blank" class="url-link">URL</a>
                <button class="copy-btn" data-url="${item.u}">Kopyala</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    setupCopyButtons();
}

function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = (e) => {
            const url = e.target.getAttribute('data-url');
            navigator.clipboard.writeText(url).then(() => {
                const originalText = e.target.innerText;
                e.target.innerText = "Kopyalandı!";
                setTimeout(() => { e.target.innerText = originalText; }, 1500);
            });
        };
    });
}