/* ========================================================================
   FleetPulse — Main Application Orchestrator
   Initializes all modules, manages navigation, and runs the simulation loop
   ======================================================================== */

class FleetPulseApp {
    constructor() {
        this.simulator = new FleetSimulator();
        this.aggregator = new TelemetryAggregator();
        this.emissionEngine = new EmissionAnalysisEngine();
        this.alertEngine = new AlertEngine();
        this.dashboard = new DashboardRenderer();
        this.reports = new ReportsModule();

        this.currentView = 'dashboard';
        this.fleetViewMode = 'table';
        this.intervalId = null;
        this.isRunning = false;
        this.searchFilter = '';
        this.currentRole = 'admin';
    }

    /**
     * Boot the application
     */
    async init() {
        // Initialize simulation
        this.simulator.initialize(CONFIG.vehicleCount);

        // Initialize charts
        this.dashboard.initCharts();

        // Bind UI events
        this._bindEvents();

        // Start clock
        this._startClock();

        // First tick
        this._tick();

        // Start simulation loop
        this.startSimulation();

        // Remove preloader
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) preloader.classList.add('hidden');
            const app = document.getElementById('app');
            if (app) app.style.opacity = '1';
        }, 2200);

        // Generate initial report
        this._updateReports('daily');

        console.log('🚀 FleetPulse initialized with', CONFIG.vehicleCount, 'vehicles');
    }

    /**
     * Start the real-time simulation loop
     */
    startSimulation() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.intervalId = setInterval(() => this._tick(), CONFIG.updateInterval);
        this._updateSimStatus(true);
    }

    /**
     * Stop the simulation
     */
    stopSimulation() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this._updateSimStatus(false);
    }

    /**
     * Main simulation tick
     */
    _tick() {
        // 1. Generate telemetry
        const telemetryBatch = this.simulator.tick();

        // 2. Ingest & validate
        const validated = this.aggregator.ingest(telemetryBatch);

        // 3. Get fleet snapshot
        const snapshot = this.simulator.getFleetSnapshot();

        // 4. Log emissions
        this.emissionEngine.logSnapshot(snapshot);

        // 5. Process alerts
        const newAlerts = this.alertEngine.processVehicles(this.simulator.vehicles);

        // 6. Add to notifications
        if (newAlerts.length > 0) {
            this._addNotifications(newAlerts);
        }

        // 7. Update active view
        this._updateActiveView(snapshot, newAlerts);
    }

    /**
     * Update the currently active view
     */
    _updateActiveView(snapshot, newAlerts) {
        const alertStats = this.alertEngine.getAlertStats();

        switch (this.currentView) {
            case 'dashboard':
                this.dashboard.updateKPIs(snapshot, alertStats.total);
                this.dashboard.updateEmissionTrend(this.emissionEngine.getEmissionTrend());
                this.dashboard.updateFleetStatus(snapshot);
                this.dashboard.updateIdleRank(this.simulator.getTopIdlers(8));
                this.dashboard.updateFuelAnalysis(this.simulator.getTopFuelWasters(8));
                this.dashboard.updateLiveTelemetry(this.simulator.vehicles, this.searchFilter);
                this.dashboard.updateDashAlertFeed(this.alertEngine.getAlerts());
                break;

            case 'fleet':
                this.dashboard.updateFleetView(
                    this.simulator.vehicles,
                    this.fleetViewMode,
                    document.getElementById('fleetTypeFilter')?.value || 'all',
                    document.getElementById('fleetStatusFilter')?.value || 'all'
                );
                break;

            case 'analytics':
                this.dashboard.updateAnalytics(this.simulator, this.emissionEngine);
                break;

            case 'alerts':
                const sevFilter = document.getElementById('alertSeverityFilter')?.value || 'all';
                const typeFilter = document.getElementById('alertTypeFilter')?.value || 'all';
                this.dashboard.updateAlertsView(
                    this.alertEngine.getAlerts({ severity: sevFilter, type: typeFilter }),
                    alertStats
                );
                break;

            case 'insights':
                const recs = RecommendationEngine.generate(this.simulator.vehicles, snapshot);
                const preds = PredictiveInsightsEngine.generate(
                    this.simulator.vehicles, snapshot, this.emissionEngine.getEmissionTrend()
                );
                this.dashboard.updateInsights(recs, preds, this.simulator);
                break;

            case 'reports':
                // Reports update on demand, not every tick
                break;
        }

        // Always update KPIs on dashboard (even if not on dashboard view, update badges)
        if (this.currentView !== 'dashboard') {
            this.dashboard.updateKPIs(snapshot, alertStats.total);
        }
    }

    /**
     * Bind all UI event listeners
     */
    _bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) this._switchView(view);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('open');
        });

        // Theme toggle with local storage persistence and chart theme sync
        const savedTheme = localStorage.getItem('fleetpulse_theme') || document.documentElement.getAttribute('data-theme') || 'dark';
        this._setTheme(savedTheme, false);

        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            this._setTheme(next, true);
        });

        // Search
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            this.searchFilter = e.target.value;
        });

        // Notification panel
        document.getElementById('notifBtn')?.addEventListener('click', () => {
            document.getElementById('notifPanel')?.classList.toggle('open');
        });

        // Close notification panel on outside click
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notifPanel');
            const btn = document.getElementById('notifBtn');
            if (panel && !panel.contains(e.target) && !btn.contains(e.target)) {
                panel.classList.remove('open');
            }
        });

        // Clear notifications
        document.getElementById('clearNotifsBtn')?.addEventListener('click', () => {
            document.getElementById('notifList').innerHTML = '';
            document.getElementById('notifBadge').textContent = '0';
        });

        // Role selector
        document.getElementById('roleSelector')?.addEventListener('change', (e) => {
            this.currentRole = e.target.value;
            const names = { admin: 'Administrator', fleet_manager: 'Fleet Manager', supervisor: 'Supervisor' };
            document.getElementById('userName').textContent = names[this.currentRole] || 'Admin';
            const icons = { admin: 'fa-user-shield', fleet_manager: 'fa-user-tie', supervisor: 'fa-user-check' };
            document.querySelector('.user-avatar i').className = `fas ${icons[this.currentRole] || 'fa-user'}`;
        });

        // Fleet view toggle
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.fleetViewMode = btn.dataset.fleetView;
                this._tick(); // Force refresh
            });
        });

        // Fleet filters
        document.getElementById('fleetTypeFilter')?.addEventListener('change', () => this._tick());
        document.getElementById('fleetStatusFilter')?.addEventListener('change', () => this._tick());

        // Alert filters
        document.getElementById('alertSeverityFilter')?.addEventListener('change', () => this._tick());
        document.getElementById('alertTypeFilter')?.addEventListener('change', () => this._tick());

        // Report period
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._updateReports(btn.dataset.period);
            });
        });

        // Export report
        document.getElementById('exportReportBtn')?.addEventListener('click', () => {
            const reportData = this.reports.generateReport(this.simulator, this.alertEngine, this.reports.currentPeriod);
            this.reports.exportReport(reportData);
        });

        // Modal close
        document.getElementById('modalClose')?.addEventListener('click', () => {
            document.getElementById('vehicleModalOverlay')?.classList.remove('open');
        });
        document.getElementById('vehicleModalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.classList.remove('open');
            }
        });

        // Settings
        document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
            this._applySettings();
        });

        // Close sidebar on view click (mobile)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 1100) {
                    document.getElementById('sidebar')?.classList.remove('open');
                }
            });
        });
    }

    /**
     * Apply active theme (dark or light)
     */
    _setTheme(theme, updateCharts = true) {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('fleetpulse_theme', theme);
        } catch (e) {}

        const btn = document.getElementById('themeToggle');
        if (btn) {
            if (theme === 'light') {
                btn.innerHTML = '<i class="fas fa-moon"></i>';
                btn.setAttribute('title', 'Switch to Dark Mode');
            } else {
                btn.innerHTML = '<i class="fas fa-sun"></i>';
                btn.setAttribute('title', 'Switch to Light Mode');
            }
        }

        if (updateCharts && this.dashboard && this.dashboard.chartInitialized) {
            this.dashboard.updateChartTheme(theme);
        }
    }

    /**
     * Switch between views
     */
    _switchView(viewName) {
        this.currentView = viewName;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const viewEl = document.getElementById(`${viewName}View`);
        if (viewEl) viewEl.classList.add('active');

        // Update topbar title
        const titles = {
            dashboard: ['Dashboard', 'Real-time fleet monitoring overview'],
            fleet: ['Fleet Monitor', 'Detailed vehicle tracking and management'],
            analytics: ['Analytics', 'Emission trends, idle analysis, and performance metrics'],
            alerts: ['Alert Center', 'Real-time alerts and incident management'],
            insights: ['Smart Insights', 'AI-driven recommendations and predictive analytics'],
            reports: ['Reports', 'Comprehensive fleet performance reports'],
            settings: ['Configuration', 'System settings and simulation parameters']
        };

        const [title, subtitle] = titles[viewName] || ['FleetPulse', ''];
        document.getElementById('viewTitle').textContent = title;
        document.getElementById('viewSubtitle').textContent = subtitle;

        // Force update the view
        this._tick();

        // Generate report if switching to reports
        if (viewName === 'reports') {
            this._updateReports(this.reports.currentPeriod);
        }
    }

    /**
     * Update reports
     */
    _updateReports(period) {
        const reportData = this.reports.generateReport(this.simulator, this.alertEngine, period);
        this.reports.renderReport(reportData);
    }

    /**
     * Apply settings
     */
    _applySettings() {
        const idleThreshold = parseInt(document.getElementById('idleThreshold')?.value) || 10;
        const rpmThreshold = parseInt(document.getElementById('rpmThreshold')?.value) || 700;
        const updateInterval = parseInt(document.getElementById('updateInterval')?.value) || 5;
        const vehicleCount = parseInt(document.getElementById('vehicleCount')?.value) || 75;

        CONFIG.excessiveIdleMinutes = idleThreshold;
        CONFIG.idleRPMThreshold = rpmThreshold;
        CONFIG.updateInterval = updateInterval * 1000;

        // Restart with new vehicle count if changed
        if (vehicleCount !== this.simulator.vehicles.length) {
            this.stopSimulation();
            this.simulator.initialize(vehicleCount);
            CONFIG.vehicleCount = vehicleCount;
            this.alertEngine.clearAlerts();
            this.startSimulation();
        } else {
            // Restart loop with new interval
            this.stopSimulation();
            this.startSimulation();
        }

        // Update emission factors
        const co2Factor = parseFloat(document.getElementById('co2Factor')?.value) || 2.68;
        CONFIG.co2PerLiterDiesel = co2Factor;
        CONFIG.idleFuelRates.bus = parseFloat(document.getElementById('busFuelRate')?.value) || 3.5;
        CONFIG.idleFuelRates.garbage_truck = parseFloat(document.getElementById('truckFuelRate')?.value) || 2.8;
        CONFIG.idleFuelRates.service_vehicle = parseFloat(document.getElementById('svcFuelRate')?.value) || 1.5;

        // Visual feedback
        const btn = document.getElementById('applySettingsBtn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Settings Applied!';
            btn.style.background = 'var(--gradient-emerald)';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Apply Settings';
                btn.style.background = '';
            }, 2000);
        }
    }

    /**
     * Show vehicle detail modal
     */
    showVehicleModal(vehicleId) {
        const vehicle = this.simulator.getVehicleById(vehicleId);
        if (vehicle) {
            this.dashboard.showVehicleModal(vehicle);
        }
    }

    /**
     * Add notifications
     */
    _addNotifications(alerts) {
        const list = document.getElementById('notifList');
        if (!list) return;

        const newItems = alerts.slice(0, 5).map(a => {
            const time = new Date(a.timestamp).toLocaleTimeString();
            const iconClass = a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'info';
            const icon = a.severity === 'critical' ? 'fa-circle-exclamation' : a.severity === 'warning' ? 'fa-triangle-exclamation' : 'fa-info-circle';

            return `<div class="notif-item">
                <div class="notif-icon ${iconClass}"><i class="fas ${icon}"></i></div>
                <div class="notif-body">
                    <div class="notif-title">${a.vehicleId} — ${a.type.replace(/_/g, ' ')}</div>
                    <div class="notif-desc">${a.message}</div>
                    <div class="notif-time">${time}</div>
                </div>
            </div>`;
        }).join('');

        list.insertAdjacentHTML('afterbegin', newItems);

        // Trim old notifications
        while (list.children.length > 30) {
            list.removeChild(list.lastChild);
        }
    }

    /**
     * Clock
     */
    _startClock() {
        const update = () => {
            const now = new Date();
            const el = document.getElementById('topbarClock');
            if (el) {
                el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
        };
        update();
        setInterval(update, 1000);
    }

    /**
     * Sim status indicator
     */
    _updateSimStatus(isLive) {
        const dot = document.querySelector('.sim-dot');
        const status = document.getElementById('simStatus');
        if (dot) dot.classList.toggle('live', isLive);
        if (status) status.querySelector('span:last-child').textContent = isLive ? 'Simulation Live' : 'Simulation Paused';
    }
}

/* ---- Boot ---- */
window.APP = new FleetPulseApp();

document.addEventListener('DOMContentLoaded', () => {
    window.APP.init();
});
