/* ========================================================================
   FleetPulse — Dashboard & Visualization Module
   Charts, KPIs, tables, and real-time rendering
   ======================================================================== */

class DashboardRenderer {
    constructor() {
        this.charts = {};
        this.chartInitialized = false;
    }

    /**
     * Initialize all Chart.js instances
     */
    initCharts() {
        if (this.chartInitialized) return;

        // Global Chart.js defaults
        Chart.defaults.color = '#8892a8';
        Chart.defaults.borderColor = 'rgba(99, 115, 171, 0.1)';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 11;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
        Chart.defaults.plugins.legend.labels.padding = 16;
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17, 24, 39, 0.95)';
        Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '600' };
        Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.borderColor = 'rgba(99, 115, 171, 0.2)';
        Chart.defaults.plugins.tooltip.borderWidth = 1;

        this._initEmissionTrendChart();
        this._initFleetStatusChart();
        this._initIdleRankChart();
        this._initFuelAnalysisChart();
        this._initDailyIdleChart();
        this._initAnalyticsCharts();

        this.chartInitialized = true;
    }

    /**
     * Update Chart.js themes when switching between dark and light modes
     */
    updateChartTheme(theme) {
        const isLight = theme === 'light';
        const textColor = isLight ? '#475569' : '#8892a8';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(99, 115, 171, 0.08)';

        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;

        Object.values(this.charts).forEach(chart => {
            if (!chart || !chart.options) return;
            if (chart.options.scales) {
                if (chart.options.scales.x && chart.options.scales.x.ticks) {
                    chart.options.scales.x.ticks.color = textColor;
                }
                if (chart.options.scales.y) {
                    if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = textColor;
                    if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor;
                }
            }
            if (chart.options.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            chart.update();
        });
    }

    /* ---- Dashboard Charts ---- */

    _initEmissionTrendChart() {
        const ctx = document.getElementById('emissionTrendChart');
        if (!ctx) return;
        this.charts.emissionTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'CO₂ Emissions (kg)',
                        data: [],
                        borderColor: CONFIG.chartColors.cyan,
                        backgroundColor: 'rgba(6, 182, 212, 0.08)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Fuel Wasted (L)',
                        data: [],
                        borderColor: CONFIG.chartColors.amber,
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: { maxRotation: 0, maxTicksLimit: 8, font: { size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(99, 115, 171, 0.06)' },
                        ticks: { font: { size: 10 } }
                    }
                },
                plugins: {
                    legend: { position: 'top', align: 'end' }
                }
            }
        });
    }

    _initFleetStatusChart() {
        const ctx = document.getElementById('fleetStatusChart');
        if (!ctx) return;
        this.charts.fleetStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Running', 'Idle', 'Excessive Idle', 'Stopped'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        CONFIG.chartColors.emerald,
                        CONFIG.chartColors.amber,
                        CONFIG.chartColors.rose,
                        '#4b5563'
                    ],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } }
                }
            }
        });
    }

    _initIdleRankChart() {
        const ctx = document.getElementById('idleRankChart');
        if (!ctx) return;
        this.charts.idleRank = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Idle Time (min)',
                    data: [],
                    backgroundColor: this._generateGradientColors(10, CONFIG.chartColors.rose, CONFIG.chartColors.amber),
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: 18
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(99, 115, 171, 0.06)' },
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10, weight: '600' } }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    _initFuelAnalysisChart() {
        const ctx = document.getElementById('fuelAnalysisChart');
        if (!ctx) return;
        this.charts.fuelAnalysis = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Fuel Wasted (L)',
                    data: [],
                    backgroundColor: CONFIG.chartColors.amber + '80',
                    borderColor: CONFIG.chartColors.amber,
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 18
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(99, 115, 171, 0.06)' },
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10, weight: '600' } }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    _initDailyIdleChart() {
        const ctx = document.getElementById('dailyIdleChart');
        if (!ctx) return;
        this.charts.dailyIdle = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Idle Events',
                        data: [42, 38, 55, 47, 61, 33, 28],
                        backgroundColor: CONFIG.chartColors.violet + '60',
                        borderColor: CONFIG.chartColors.violet,
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Excessive Idle',
                        data: [8, 12, 15, 10, 18, 6, 5],
                        backgroundColor: CONFIG.chartColors.rose + '60',
                        borderColor: CONFIG.chartColors.rose,
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { beginAtZero: true, grid: { color: 'rgba(99, 115, 171, 0.06)' }, ticks: { font: { size: 10 } } }
                },
                plugins: {
                    legend: { position: 'top', align: 'end' }
                }
            }
        });
    }

    /* ---- Analytics Charts ---- */

    _initAnalyticsCharts() {
        // Vehicle Idle Ranking (larger)
        const ctx1 = document.getElementById('vehicleIdleRankingChart');
        if (ctx1) {
            this.charts.vehicleIdleRanking = new Chart(ctx1, {
                type: 'bar',
                data: { labels: [], datasets: [{ label: 'Total Idle Time (min)', data: [], backgroundColor: [], borderRadius: 4, barThickness: 14 }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { beginAtZero: true, grid: { color: 'rgba(99, 115, 171, 0.06)' } },
                        y: { grid: { display: false }, ticks: { font: { size: 10, weight: '500' } } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Emission by type
        const ctx2 = document.getElementById('emissionByTypeChart');
        if (ctx2) {
            this.charts.emissionByType = new Chart(ctx2, {
                type: 'polarArea',
                data: {
                    labels: ['Buses', 'Garbage Trucks', 'Water Tankers', 'Service Vehicles'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            CONFIG.chartColors.blue + '80',
                            CONFIG.chartColors.emerald + '80',
                            CONFIG.chartColors.cyan + '80',
                            CONFIG.chartColors.violet + '80'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 10, font: { size: 10 } } }
                    },
                    scales: { r: { display: false } }
                }
            });
        }

        // Cumulative emissions
        const ctx3 = document.getElementById('cumulativeEmissionChart');
        if (ctx3) {
            this.charts.cumulativeEmission = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Cumulative CO₂ (kg)',
                        data: [],
                        borderColor: CONFIG.chartColors.rose,
                        backgroundColor: 'rgba(244, 63, 94, 0.08)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { display: true, grid: { display: false }, ticks: { maxTicksLimit: 6, font: { size: 10 } } },
                        y: { beginAtZero: true, grid: { color: 'rgba(99, 115, 171, 0.06)' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Driver scores
        const ctx4 = document.getElementById('driverScoreChart');
        if (ctx4) {
            this.charts.driverScore = new Chart(ctx4, {
                type: 'radar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Driver Efficiency',
                        data: [],
                        borderColor: CONFIG.chartColors.emerald,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: CONFIG.chartColors.emerald
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(99, 115, 171, 0.1)' },
                            ticks: { display: false },
                            pointLabels: { font: { size: 9 } }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Vehicle performance
        const ctx5 = document.getElementById('vehiclePerfChart');
        if (ctx5) {
            this.charts.vehiclePerf = new Chart(ctx5, {
                type: 'radar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Vehicle Performance',
                        data: [],
                        borderColor: CONFIG.chartColors.indigo,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: CONFIG.chartColors.indigo
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(99, 115, 171, 0.1)' },
                            ticks: { display: false },
                            pointLabels: { font: { size: 9 } }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    /* ---- Update Methods ---- */

    updateKPIs(snapshot, alertCount) {
        this._animateValue('kpiTotal', snapshot.total);
        this._animateValue('kpiRunning', snapshot.running);
        this._animateValue('kpiIdle', snapshot.idle);
        this._animateValue('kpiExcessive', snapshot.excessive);
        this._animateValue('kpiFuel', snapshot.totalFuelWasted.toFixed(1));
        this._animateValue('kpiCO2', snapshot.totalCO2.toFixed(1));
        this._animateValue('kpiAlerts', alertCount);
        this._animateValue('kpiHealth', snapshot.healthScore);

        // Update nav badge
        const badge = document.getElementById('alertNavBadge');
        if (badge) badge.textContent = alertCount;
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) notifBadge.textContent = alertCount;
    }

    updateEmissionTrend(emissionTrend) {
        const chart = this.charts.emissionTrend;
        if (!chart || emissionTrend.length === 0) return;

        const labels = emissionTrend.map(e => {
            const d = new Date(e.timestamp);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        });

        chart.data.labels = labels;
        chart.data.datasets[0].data = emissionTrend.map(e => e.totalCO2);
        chart.data.datasets[1].data = emissionTrend.map(e => e.totalFuel);
        chart.update('none');
    }

    updateFleetStatus(snapshot) {
        const chart = this.charts.fleetStatus;
        if (!chart) return;
        chart.data.datasets[0].data = [snapshot.running, snapshot.idle, snapshot.excessive, snapshot.stopped];
        chart.update('none');
    }

    updateIdleRank(topIdlers) {
        const chart = this.charts.idleRank;
        if (!chart) return;
        chart.data.labels = topIdlers.map(v => v.id);
        chart.data.datasets[0].data = topIdlers.map(v => Math.round(v.totalIdleTime / 60000));
        chart.data.datasets[0].backgroundColor = this._generateGradientColors(topIdlers.length, CONFIG.chartColors.rose, CONFIG.chartColors.amber);
        chart.update('none');
    }

    updateFuelAnalysis(topFuelWasters) {
        const chart = this.charts.fuelAnalysis;
        if (!chart) return;
        chart.data.labels = topFuelWasters.map(v => v.id);
        chart.data.datasets[0].data = topFuelWasters.map(v => parseFloat(v.totalFuelWasted.toFixed(2)));
        chart.update('none');
    }

    updateLiveTelemetry(vehicles, searchFilter = '') {
        const tbody = document.getElementById('liveTelemetryBody');
        if (!tbody) return;

        let filtered = vehicles;
        if (searchFilter) {
            const q = searchFilter.toLowerCase();
            filtered = vehicles.filter(v =>
                v.id.toLowerCase().includes(q) ||
                v.driver.toLowerCase().includes(q) ||
                v.type.toLowerCase().includes(q)
            );
        }

        // Sort: excessive first, then idle, then running, then stopped
        const statusOrder = { excessive_idle: 0, idle: 1, running: 2, stopped: 3 };
        filtered.sort((a, b) => (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3));

        // Only show top 30 in live feed to avoid DOM thrash
        const show = filtered.slice(0, 30);

        tbody.innerHTML = show.map(v => {
            const statusClass = v.status === 'excessive_idle' ? 'excessive' : v.status;
            const statusLabel = v.status === 'excessive_idle' ? 'EXCESS IDLE' : v.status.toUpperCase();
            const idleStr = (v.status === 'idle' || v.status === 'excessive_idle')
                ? IdleDetectionEngine.formatDuration(v.currentIdleDuration) : '—';
            const scoreClass = v.driverScore >= 70 ? 'high' : v.driverScore >= 40 ? 'medium' : 'low';
            const typeIcon = this._getTypeIcon(v.type);

            return `<tr data-vehicle-id="${v.id}" onclick="window.APP.showVehicleModal('${v.id}')">
                <td><strong>${v.id}</strong></td>
                <td><span class="vehicle-type-icon ${v.type}">${typeIcon}</span> ${v.typeLabel || v.type}</td>
                <td><span class="status-badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span></td>
                <td>${v.speed} km/h</td>
                <td>${Math.round(v.rpm)}</td>
                <td>${v.fuelRate} L/h</td>
                <td>${idleStr}</td>
                <td>${v.totalCO2.toFixed(1)} kg</td>
                <td><span class="score-indicator ${scoreClass}">${Math.round(v.driverScore)}%</span></td>
            </tr>`;
        }).join('');
    }

    updateDashAlertFeed(alerts) {
        const feed = document.getElementById('dashAlertFeed');
        if (!feed) return;

        const recent = alerts.slice(0, 15);
        if (recent.length === 0) {
            feed.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-check-circle" style="font-size:2rem;margin-bottom:10px;display:block;color:var(--accent-emerald);"></i>No active alerts</div>';
            return;
        }

        feed.innerHTML = recent.map(a => {
            const time = new Date(a.timestamp).toLocaleTimeString();
            return `<div class="alert-item ${a.severity}">
                <div class="alert-header">
                    <span class="alert-type">${a.type.replace(/_/g, ' ')}</span>
                    <span class="alert-time">${time}</span>
                </div>
                <div class="alert-message"><span class="alert-vehicle">${a.vehicleId}</span> — ${a.message}</div>
                <div class="alert-action">↳ ${a.action}</div>
            </div>`;
        }).join('');
    }

    /* ---- Analytics View Updates ---- */

    updateAnalytics(simulator, emissionEngine) {
        // Vehicle idle ranking (top 15)
        const topIdlers = simulator.getTopIdlers(15);
        if (this.charts.vehicleIdleRanking) {
            this.charts.vehicleIdleRanking.data.labels = topIdlers.map(v => v.id);
            this.charts.vehicleIdleRanking.data.datasets[0].data = topIdlers.map(v => Math.round(v.totalIdleTime / 60000));
            this.charts.vehicleIdleRanking.data.datasets[0].backgroundColor = this._generateGradientColors(
                topIdlers.length, CONFIG.chartColors.rose, CONFIG.chartColors.violet
            );
            this.charts.vehicleIdleRanking.update('none');
        }

        // Emission by type
        const byType = simulator.getEmissionsByType();
        if (this.charts.emissionByType) {
            this.charts.emissionByType.data.datasets[0].data = byType.map(t => parseFloat(t.totalCO2.toFixed(1)));
            this.charts.emissionByType.update('none');
        }

        // Cumulative emission
        const cumulative = emissionEngine.getCumulativeTrend();
        if (this.charts.cumulativeEmission && cumulative.length > 0) {
            this.charts.cumulativeEmission.data.labels = cumulative.map(c => {
                const d = new Date(c.timestamp);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
            this.charts.cumulativeEmission.data.datasets[0].data = cumulative.map(c => parseFloat(c.co2.toFixed(1)));
            this.charts.cumulativeEmission.update('none');
        }

        // Driver scores (sample 8 random)
        const sampleDrivers = this._sampleArray(simulator.vehicles, 8);
        if (this.charts.driverScore) {
            this.charts.driverScore.data.labels = sampleDrivers.map(v => v.id);
            this.charts.driverScore.data.datasets[0].data = sampleDrivers.map(v => Math.round(v.driverScore));
            this.charts.driverScore.update('none');
        }

        // Vehicle performance (sample 8)
        const sampleVehicles = this._sampleArray(simulator.vehicles, 8);
        if (this.charts.vehiclePerf) {
            this.charts.vehiclePerf.data.labels = sampleVehicles.map(v => v.id);
            this.charts.vehiclePerf.data.datasets[0].data = sampleVehicles.map(v => Math.round(v.vehiclePerformanceScore));
            this.charts.vehiclePerf.update('none');
        }

        // Hotspots
        this.updateHotspots(simulator.getIdleHotspots());
    }

    updateHotspots(hotspots) {
        const grid = document.getElementById('hotspotGrid');
        if (!grid) return;

        if (hotspots.length === 0) {
            grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">No idle hotspots detected</div>';
            return;
        }

        grid.innerHTML = hotspots.slice(0, 8).map(h => `
            <div class="hotspot-card">
                <div class="hotspot-location"><i class="fas fa-map-pin"></i> ${h.name}</div>
                <div class="hotspot-coords">${h.lat.toFixed(4)}°N, ${h.lng.toFixed(4)}°E</div>
                <div class="hotspot-stats">
                    <div>
                        <div class="hotspot-stat-label">Vehicles</div>
                        <div class="hotspot-stat-value">${h.vehicleCount}</div>
                    </div>
                    <div>
                        <div class="hotspot-stat-label">Idle Time</div>
                        <div class="hotspot-stat-value">${IdleDetectionEngine.formatDuration(h.totalIdleTime)}</div>
                    </div>
                    <div>
                        <div class="hotspot-stat-label">Fuel Wasted</div>
                        <div class="hotspot-stat-value">${h.totalFuelWasted.toFixed(1)}L</div>
                    </div>
                    <div>
                        <div class="hotspot-stat-label">IDs</div>
                        <div class="hotspot-stat-value" style="font-size:0.72rem;">${h.vehicles.slice(0, 3).join(', ')}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /* ---- Alerts View ---- */

    updateAlertsView(alerts, stats) {
        // Stats bar
        const statsEl = document.getElementById('alertStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div class="alert-stat"><span class="alert-stat-dot critical"></span><span class="alert-stat-count">${stats.critical}</span><span class="alert-stat-label">Critical</span></div>
                <div class="alert-stat"><span class="alert-stat-dot warning"></span><span class="alert-stat-count">${stats.warning}</span><span class="alert-stat-label">Warning</span></div>
                <div class="alert-stat"><span class="alert-stat-dot info"></span><span class="alert-stat-count">${stats.info}</span><span class="alert-stat-label">Info</span></div>
            `;
        }

        // Alert cards
        const list = document.getElementById('alertsList');
        if (!list) return;

        if (alerts.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><i class="fas fa-shield-check" style="font-size:3rem;margin-bottom:12px;display:block;color:var(--accent-emerald);"></i><p>All systems operational — no alerts</p></div>';
            return;
        }

        list.innerHTML = alerts.slice(0, 50).map(a => {
            const time = new Date(a.timestamp).toLocaleTimeString();
            const idleStr = IdleDetectionEngine.formatDuration(a.idleDuration);
            return `<div class="alert-card ${a.severity}">
                <div class="alert-card-header">
                    <div class="alert-card-title">
                        <span class="alert-severity-badge ${a.severity}">${a.severity}</span>
                        <span class="alert-card-vehicle">${a.vehicleId}</span>
                    </div>
                    <span class="alert-card-time">${time}</span>
                </div>
                <div class="alert-card-body">
                    <div class="alert-detail"><span class="alert-detail-label">Type</span><span class="alert-detail-value">${a.type.replace(/_/g, ' ')}</span></div>
                    <div class="alert-detail"><span class="alert-detail-label">Idle Duration</span><span class="alert-detail-value">${idleStr}</span></div>
                    <div class="alert-detail"><span class="alert-detail-label">Fuel Wasted</span><span class="alert-detail-value">${a.fuelWasted.toFixed(2)} L</span></div>
                    <div class="alert-detail"><span class="alert-detail-label">CO₂</span><span class="alert-detail-value">${a.co2.toFixed(2)} kg</span></div>
                </div>
                <div class="alert-card-action"><i class="fas fa-lightbulb"></i> ${a.action}</div>
            </div>`;
        }).join('');
    }

    /* ---- Insights View ---- */

    updateInsights(recommendations, predictions, simulator) {
        // Recommendations
        const recList = document.getElementById('recommendationsList');
        if (recList) {
            recList.innerHTML = recommendations.map(r => `
                <div class="recommendation-item">
                    <div class="rec-title"><i class="fas ${r.icon}"></i> ${r.title}</div>
                    <div class="rec-desc">${r.desc}</div>
                    <span class="rec-impact ${r.impact}"><i class="fas fa-arrow-up"></i> ${r.impactLabel}</span>
                </div>
            `).join('');
        }

        // Predictions
        const predList = document.getElementById('predictionsList');
        if (predList) {
            predList.innerHTML = predictions.map(p => `
                <div class="prediction-item">
                    <div class="pred-title"><i class="fas ${p.icon}"></i> ${p.title}</div>
                    <div class="pred-desc">${p.desc}</div>
                </div>
            `).join('');
        }

        // Leaderboard
        const lb = document.getElementById('leaderboardGrid');
        if (lb) {
            const bestDrivers = simulator.getTopDriverScores(5);
            const worstDrivers = simulator.getWorstDriverScores(5);

            lb.innerHTML = `
                <div class="leaderboard-section">
                    <h4><i class="fas fa-trophy" style="color:var(--accent-amber);"></i> Top Performing Drivers</h4>
                    ${bestDrivers.map((v, i) => this._renderLeaderboardItem(v, i, 'driver', true)).join('')}
                </div>
                <div class="leaderboard-section">
                    <h4><i class="fas fa-triangle-exclamation" style="color:var(--accent-rose);"></i> Drivers Needing Improvement</h4>
                    ${worstDrivers.map((v, i) => this._renderLeaderboardItem(v, i, 'driver', false)).join('')}
                </div>
            `;
        }
    }

    _renderLeaderboardItem(v, index, type, isTop) {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default';
        const score = Math.round(v.driverScore);
        const scoreColor = isTop ? 'var(--accent-emerald)' : 'var(--accent-rose)';

        return `<div class="leaderboard-item">
            <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${v.driver}</div>
                <div class="leaderboard-meta">${v.id} · ${v.typeLabel}</div>
            </div>
            <div class="leaderboard-score" style="color:${scoreColor}">${score}%</div>
        </div>`;
    }

    /* ---- Fleet View ---- */

    updateFleetView(vehicles, viewMode = 'table', typeFilter = 'all', statusFilter = 'all') {
        let filtered = vehicles;
        if (typeFilter !== 'all') filtered = filtered.filter(v => v.type === typeFilter);
        if (statusFilter !== 'all') filtered = filtered.filter(v => v.status === statusFilter);

        const container = document.getElementById('fleetContent');
        if (!container) return;

        if (viewMode === 'grid') {
            container.innerHTML = `<div class="fleet-grid">${filtered.map(v => this._renderFleetCard(v)).join('')}</div>`;
        } else {
            container.innerHTML = `
                <div class="telemetry-table-wrap" style="max-height:calc(100vh - 220px);">
                    <table class="data-table">
                        <thead><tr>
                            <th>Vehicle ID</th><th>Type</th><th>Driver</th><th>Status</th>
                            <th>Speed</th><th>RPM</th><th>Fuel Rate</th><th>Idle Time</th>
                            <th>Fuel Wasted</th><th>CO₂</th><th>Driver Score</th><th>Location</th>
                        </tr></thead>
                        <tbody>${filtered.map(v => this._renderFleetRow(v)).join('')}</tbody>
                    </table>
                </div>
            `;
        }
    }

    _renderFleetCard(v) {
        const statusClass = v.status === 'excessive_idle' ? 'excessive' : v.status;
        const statusLabel = v.status === 'excessive_idle' ? 'EXCESS IDLE' : v.status.toUpperCase();
        const idleStr = (v.status === 'idle' || v.status === 'excessive_idle')
            ? IdleDetectionEngine.formatDuration(v.currentIdleDuration) : '—';

        return `<div class="fleet-card" onclick="window.APP.showVehicleModal('${v.id}')">
            <div class="fleet-card-header">
                <div>
                    <div class="fleet-card-id">${v.id}</div>
                    <div class="fleet-card-type">${v.typeLabel}</div>
                </div>
                <span class="status-badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span>
            </div>
            <div class="fleet-card-stats">
                <div class="fleet-stat"><span class="fleet-stat-label">Speed</span><span class="fleet-stat-value">${v.speed} km/h</span></div>
                <div class="fleet-stat"><span class="fleet-stat-label">RPM</span><span class="fleet-stat-value">${Math.round(v.rpm)}</span></div>
                <div class="fleet-stat"><span class="fleet-stat-label">Idle Time</span><span class="fleet-stat-value">${idleStr}</span></div>
                <div class="fleet-stat"><span class="fleet-stat-label">CO₂</span><span class="fleet-stat-value">${v.totalCO2.toFixed(1)} kg</span></div>
                <div class="fleet-stat"><span class="fleet-stat-label">Driver</span><span class="fleet-stat-value" style="font-family:Inter;font-size:0.78rem;">${v.driver.split(' ')[0]}</span></div>
                <div class="fleet-stat"><span class="fleet-stat-label">Score</span><span class="fleet-stat-value">${Math.round(v.driverScore)}%</span></div>
            </div>
        </div>`;
    }

    _renderFleetRow(v) {
        const statusClass = v.status === 'excessive_idle' ? 'excessive' : v.status;
        const statusLabel = v.status === 'excessive_idle' ? 'EXCESS IDLE' : v.status.toUpperCase();
        const idleStr = (v.status === 'idle' || v.status === 'excessive_idle')
            ? IdleDetectionEngine.formatDuration(v.currentIdleDuration) : '—';
        const scoreClass = v.driverScore >= 70 ? 'high' : v.driverScore >= 40 ? 'medium' : 'low';

        return `<tr onclick="window.APP.showVehicleModal('${v.id}')">
            <td><strong>${v.id}</strong></td>
            <td>${v.typeLabel}</td>
            <td style="font-family:Inter;">${v.driver}</td>
            <td><span class="status-badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span></td>
            <td>${v.speed} km/h</td>
            <td>${Math.round(v.rpm)}</td>
            <td>${v.fuelRate} L/h</td>
            <td>${idleStr}</td>
            <td>${v.totalFuelWasted.toFixed(2)} L</td>
            <td>${v.totalCO2.toFixed(1)} kg</td>
            <td><span class="score-indicator ${scoreClass}">${Math.round(v.driverScore)}%</span></td>
            <td style="font-family:Inter;font-size:0.75rem;">${v.locationName}</td>
        </tr>`;
    }

    /* ---- Vehicle Modal ---- */

    showVehicleModal(vehicle) {
        const overlay = document.getElementById('vehicleModalOverlay');
        const title = document.getElementById('modalVehicleTitle');
        const body = document.getElementById('modalBody');

        title.textContent = `${vehicle.id} — ${vehicle.typeLabel}`;
        const statusClass = vehicle.status === 'excessive_idle' ? 'excessive' : vehicle.status;
        const statusLabel = vehicle.status === 'excessive_idle' ? 'EXCESS IDLE' : vehicle.status.toUpperCase();
        const idleStr = (vehicle.status === 'idle' || vehicle.status === 'excessive_idle')
            ? IdleDetectionEngine.formatDuration(vehicle.currentIdleDuration) : '—';
        const scoreClass = vehicle.driverScore >= 70 ? 'high' : vehicle.driverScore >= 40 ? 'medium' : 'low';
        const perfClass = vehicle.vehiclePerformanceScore >= 70 ? 'high' : vehicle.vehiclePerformanceScore >= 40 ? 'medium' : 'low';

        body.innerHTML = `
            <div style="margin-bottom:16px;">
                <span class="status-badge ${statusClass}" style="font-size:0.82rem;padding:6px 14px;">
                    <span class="status-dot"></span>${statusLabel}
                </span>
            </div>
            <div class="modal-stats-grid">
                <div class="modal-stat">
                    <div class="modal-stat-value">${vehicle.speed} <small>km/h</small></div>
                    <div class="modal-stat-label">Speed</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${Math.round(vehicle.rpm)}</div>
                    <div class="modal-stat-label">RPM</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${vehicle.fuelRate} <small>L/h</small></div>
                    <div class="modal-stat-label">Fuel Rate</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value" style="color:var(--accent-rose);">${vehicle.totalCO2.toFixed(1)} <small>kg</small></div>
                    <div class="modal-stat-label">CO₂ Emitted</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value" style="color:var(--accent-amber);">${vehicle.totalFuelWasted.toFixed(2)} <small>L</small></div>
                    <div class="modal-stat-label">Fuel Wasted</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${idleStr}</div>
                    <div class="modal-stat-label">Current Idle</div>
                </div>
            </div>
            <div class="modal-detail-grid">
                <div class="modal-detail"><span class="modal-detail-label">Driver</span><span class="modal-detail-value" style="font-family:Inter;">${vehicle.driver}</span></div>
                <div class="modal-detail"><span class="modal-detail-label">Route</span><span class="modal-detail-value">${vehicle.route}</span></div>
                <div class="modal-detail"><span class="modal-detail-label">Location</span><span class="modal-detail-value" style="font-family:Inter;font-size:0.75rem;">${vehicle.locationName}</span></div>
                <div class="modal-detail"><span class="modal-detail-label">GPS</span><span class="modal-detail-value">${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}</span></div>
                <div class="modal-detail"><span class="modal-detail-label">Driver Score</span><span class="modal-detail-value"><span class="score-indicator ${scoreClass}">${Math.round(vehicle.driverScore)}%</span></span></div>
                <div class="modal-detail"><span class="modal-detail-label">Vehicle Score</span><span class="modal-detail-value"><span class="score-indicator ${perfClass}">${Math.round(vehicle.vehiclePerformanceScore)}%</span></span></div>
                <div class="modal-detail"><span class="modal-detail-label">Idle Events</span><span class="modal-detail-value">${vehicle.idleEventCount}</span></div>
                <div class="modal-detail"><span class="modal-detail-label">Excessive Idles</span><span class="modal-detail-value">${vehicle.excessiveIdleCount}</span></div>
                <div class="modal-detail"><span class="modal-detail-label">Total Idle Time</span><span class="modal-detail-value">${IdleDetectionEngine.formatDuration(vehicle.totalIdleTime)}</span></div>
                <div class="modal-detail"><span class="modal-detail-label">Behavior</span><span class="modal-detail-value" style="text-transform:capitalize;">${vehicle.behaviorPattern}</span></div>
            </div>
        `;

        overlay.classList.add('open');
    }

    /* ---- Utility ---- */

    _animateValue(elementId, value) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const currentText = el.textContent;
        const newText = String(value);
        if (currentText !== newText) {
            el.textContent = newText;
            el.classList.add('updating');
            setTimeout(() => el.classList.remove('updating'), 400);
        }
    }

    _generateGradientColors(count, startColor, endColor) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const ratio = count > 1 ? i / (count - 1) : 0;
            colors.push(this._interpolateColor(startColor, endColor, ratio));
        }
        return colors;
    }

    _interpolateColor(color1, color2, ratio) {
        const hex = (c) => parseInt(c, 16);
        const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7));
        const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7));
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    }

    _getTypeIcon(type) {
        const icons = {
            bus: '<i class="fas fa-bus"></i>',
            garbage_truck: '<i class="fas fa-trash-can"></i>',
            water_tanker: '<i class="fas fa-droplet"></i>',
            service_vehicle: '<i class="fas fa-van-shuttle"></i>'
        };
        return icons[type] || '<i class="fas fa-truck"></i>';
    }

    _sampleArray(arr, n) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
    }
}
