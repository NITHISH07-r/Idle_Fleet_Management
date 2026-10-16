/* ========================================================================
   FleetPulse — Reports Module
   Daily, Weekly, Monthly report generation with export
   ======================================================================== */

class ReportsModule {
    constructor() {
        this.currentPeriod = 'daily';
    }

    /**
     * Generate report data for the given period
     */
    generateReport(simulator, alertEngine, period = 'daily') {
        this.currentPeriod = period;
        const snapshot = simulator.getFleetSnapshot();
        const alertStats = alertEngine.getAlertStats();
        const topIdlers = simulator.getTopIdlers(10);
        const topEmitters = simulator.getTopEmitters(10);
        const recommendations = RecommendationEngine.generate(simulator.vehicles, snapshot);

        // Scale metrics based on period for realistic demo
        const multiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
        const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month';

        return {
            period,
            periodLabel,
            generatedAt: new Date().toLocaleString(),
            summary: {
                totalIdleTime: this._formatHours(simulator.vehicles.reduce((s, v) => s + v.totalIdleTime, 0) * multiplier),
                totalIdleTimeMs: simulator.vehicles.reduce((s, v) => s + v.totalIdleTime, 0) * multiplier,
                fuelWasted: parseFloat((snapshot.totalFuelWasted * multiplier).toFixed(1)),
                co2Emissions: parseFloat((snapshot.totalCO2 * multiplier).toFixed(1)),
                totalAlerts: alertStats.total * multiplier,
                criticalAlerts: alertStats.critical * multiplier,
                avgDriverScore: snapshot.avgDriverScore,
                healthScore: snapshot.healthScore,
                totalVehicles: snapshot.total,
                idleEvents: simulator.vehicles.reduce((s, v) => s + v.idleEventCount, 0) * multiplier,
                excessiveIdleEvents: simulator.vehicles.reduce((s, v) => s + v.excessiveIdleCount, 0) * multiplier,
                costEstimate: parseFloat((snapshot.totalFuelWasted * multiplier * 95).toFixed(0)) // ₹95/L diesel
            },
            topIdlers,
            topEmitters,
            recommendations,
            alertStats
        };
    }

    /**
     * Render report in the Reports view
     */
    renderReport(reportData) {
        const container = document.getElementById('reportContent');
        if (!container) return;

        const d = reportData;
        const s = d.summary;

        container.innerHTML = `
            <!-- Report Header -->
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h2 style="font-size:1.2rem;font-weight:800;color:var(--text-bright);margin-bottom:4px;">
                            FleetPulse ${d.periodLabel} Report
                        </h2>
                        <p style="font-size:0.82rem;color:var(--text-muted);">Generated: ${d.generatedAt} · Period: ${d.period}</p>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <span class="status-badge running" style="font-size:0.78rem;padding:6px 12px;">
                            <i class="fas fa-check-circle"></i> ${s.healthScore}% Health
                        </span>
                    </div>
                </div>
            </div>

            <!-- Summary KPIs -->
            <div class="report-summary-grid">
                <div class="report-stat-card">
                    <div class="report-stat-icon" style="color:var(--accent-amber);"><i class="fas fa-clock"></i></div>
                    <div class="report-stat-value">${s.totalIdleTime}</div>
                    <div class="report-stat-label">Total Idle Time</div>
                </div>
                <div class="report-stat-card">
                    <div class="report-stat-icon" style="color:var(--accent-rose);"><i class="fas fa-gas-pump"></i></div>
                    <div class="report-stat-value">${s.fuelWasted} L</div>
                    <div class="report-stat-label">Fuel Wasted</div>
                </div>
                <div class="report-stat-card">
                    <div class="report-stat-icon" style="color:var(--accent-cyan);"><i class="fas fa-smog"></i></div>
                    <div class="report-stat-value">${s.co2Emissions} kg</div>
                    <div class="report-stat-label">CO₂ Emissions</div>
                </div>
                <div class="report-stat-card">
                    <div class="report-stat-icon" style="color:var(--accent-violet);"><i class="fas fa-indian-rupee-sign"></i></div>
                    <div class="report-stat-value">₹${s.costEstimate.toLocaleString()}</div>
                    <div class="report-stat-label">Estimated Cost</div>
                </div>
            </div>

            <!-- Alert Statistics -->
            <div class="report-section" style="margin-top:16px;">
                <div class="report-section-header">
                    <i class="fas fa-bell" style="color:var(--accent-amber);"></i> Alert Statistics
                </div>
                <div class="report-section-body">
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;text-align:center;">
                        <div>
                            <div style="font-size:1.4rem;font-weight:800;color:var(--text-bright);font-family:'JetBrains Mono',monospace;">${s.totalAlerts}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">Total Alerts</div>
                        </div>
                        <div>
                            <div style="font-size:1.4rem;font-weight:800;color:var(--accent-rose);font-family:'JetBrains Mono',monospace;">${s.criticalAlerts}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">Critical</div>
                        </div>
                        <div>
                            <div style="font-size:1.4rem;font-weight:800;color:var(--accent-amber);font-family:'JetBrains Mono',monospace;">${s.idleEvents}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">Idle Events</div>
                        </div>
                        <div>
                            <div style="font-size:1.4rem;font-weight:800;color:var(--accent-rose);font-family:'JetBrains Mono',monospace;">${s.excessiveIdleEvents}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">Excessive Idles</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Offending Vehicles -->
            <div class="report-section" style="margin-top:16px;">
                <div class="report-section-header">
                    <i class="fas fa-ranking-star" style="color:var(--accent-rose);"></i> Top Offending Vehicles — Idle Time
                </div>
                <div class="report-section-body" style="padding:0;">
                    <table class="report-table">
                        <thead><tr>
                            <th>Rank</th><th>Vehicle ID</th><th>Type</th><th>Driver</th>
                            <th>Total Idle</th><th>Excessive Count</th><th>Fuel Wasted</th><th>CO₂</th><th>Driver Score</th>
                        </tr></thead>
                        <tbody>
                            ${d.topIdlers.map((v, i) => {
                                const scoreClass = v.driverScore >= 70 ? 'high' : v.driverScore >= 40 ? 'medium' : 'low';
                                return `<tr>
                                    <td><strong>#${i + 1}</strong></td>
                                    <td><strong>${v.id}</strong></td>
                                    <td>${v.typeLabel}</td>
                                    <td style="font-family:Inter;">${v.driver}</td>
                                    <td>${IdleDetectionEngine.formatDuration(v.totalIdleTime)}</td>
                                    <td>${v.excessiveIdleCount}</td>
                                    <td>${v.totalFuelWasted.toFixed(2)} L</td>
                                    <td>${v.totalCO2.toFixed(1)} kg</td>
                                    <td><span class="score-indicator ${scoreClass}">${Math.round(v.driverScore)}%</span></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Top Emitters -->
            <div class="report-section" style="margin-top:16px;">
                <div class="report-section-header">
                    <i class="fas fa-smog" style="color:var(--accent-cyan);"></i> Top CO₂ Emitters
                </div>
                <div class="report-section-body" style="padding:0;">
                    <table class="report-table">
                        <thead><tr>
                            <th>Rank</th><th>Vehicle ID</th><th>Type</th><th>CO₂ (kg)</th><th>Fuel Wasted (L)</th><th>Idle Events</th>
                        </tr></thead>
                        <tbody>
                            ${d.topEmitters.map((v, i) => `<tr>
                                <td><strong>#${i + 1}</strong></td>
                                <td><strong>${v.id}</strong></td>
                                <td>${v.typeLabel}</td>
                                <td style="color:var(--accent-rose);font-weight:700;">${v.totalCO2.toFixed(2)} kg</td>
                                <td>${v.totalFuelWasted.toFixed(2)} L</td>
                                <td>${v.idleEventCount}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="report-section" style="margin-top:16px;">
                <div class="report-section-header">
                    <i class="fas fa-lightbulb" style="color:var(--accent-emerald);"></i> Actionable Recommendations
                </div>
                <div class="report-section-body">
                    <div class="report-rec-list">
                        ${d.recommendations.map(r => `
                            <div class="report-rec-item">
                                <i class="fas ${r.icon}"></i>
                                <div>
                                    <div style="font-weight:700;color:var(--text-bright);margin-bottom:4px;">${r.title}</div>
                                    <div class="report-rec-text">${r.desc}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.78rem;">
                <p>FleetPulse Smart City Fleet Intelligence Platform · Report generated automatically</p>
                <p>Data Source: Simulated OBD-II Telemetry · Architecture: IoT-Ready (ESP32/RPi Compatible)</p>
            </div>
        `;
    }

    /**
     * Export report as downloadable text file
     */
    exportReport(reportData) {
        const d = reportData;
        const s = d.summary;

        let text = `FleetPulse ${d.periodLabel} Report\n`;
        text += `${'='.repeat(50)}\n`;
        text += `Generated: ${d.generatedAt}\n\n`;

        text += `SUMMARY\n${'-'.repeat(30)}\n`;
        text += `Total Vehicles: ${s.totalVehicles}\n`;
        text += `Total Idle Time: ${s.totalIdleTime}\n`;
        text += `Fuel Wasted: ${s.fuelWasted} L\n`;
        text += `CO₂ Emissions: ${s.co2Emissions} kg\n`;
        text += `Estimated Cost: ₹${s.costEstimate.toLocaleString()}\n`;
        text += `Fleet Health: ${s.healthScore}%\n`;
        text += `Avg Driver Score: ${s.avgDriverScore}%\n\n`;

        text += `ALERTS\n${'-'.repeat(30)}\n`;
        text += `Total: ${s.totalAlerts} | Critical: ${s.criticalAlerts}\n`;
        text += `Idle Events: ${s.idleEvents} | Excessive: ${s.excessiveIdleEvents}\n\n`;

        text += `TOP IDLE OFFENDERS\n${'-'.repeat(30)}\n`;
        d.topIdlers.forEach((v, i) => {
            text += `${i + 1}. ${v.id} (${v.typeLabel}) — Idle: ${IdleDetectionEngine.formatDuration(v.totalIdleTime)}, CO₂: ${v.totalCO2.toFixed(1)}kg\n`;
        });

        text += `\nRECOMMENDATIONS\n${'-'.repeat(30)}\n`;
        d.recommendations.forEach((r, i) => {
            text += `${i + 1}. ${r.title}\n   ${r.desc}\n\n`;
        });

        text += `\n--- End of Report ---\n`;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fleetpulse_${d.period}_report_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    _formatHours(ms) {
        const hours = ms / 3600000;
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        return `${hours.toFixed(1)}h`;
    }
}
