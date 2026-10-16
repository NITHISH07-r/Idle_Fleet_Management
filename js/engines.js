/* ========================================================================
   FleetPulse — Processing Engines
   Idle Detection, Emission Analysis, Alert Engine, Recommendation Engine
   ======================================================================== */

/* ---- Telemetry Aggregator ---- */
class TelemetryAggregator {
    constructor() {
        this.buffer = [];
        this.processedCount = 0;
        this.invalidCount = 0;
    }

    /**
     * Validate and ingest a batch of telemetry data
     */
    ingest(batch) {
        const validated = [];
        for (const entry of batch) {
            if (this._validate(entry)) {
                validated.push(entry);
                this.processedCount++;
            } else {
                this.invalidCount++;
            }
        }
        this.buffer = validated;
        return validated;
    }

    _validate(entry) {
        return (
            entry.vehicleId &&
            typeof entry.speed === 'number' && entry.speed >= 0 &&
            typeof entry.rpm === 'number' && entry.rpm >= 0 &&
            typeof entry.timestamp === 'number'
        );
    }

    getStats() {
        return {
            totalProcessed: this.processedCount,
            totalInvalid: this.invalidCount,
            bufferSize: this.buffer.length
        };
    }
}

/* ---- Idle Detection Engine ---- */
class IdleDetectionEngine {
    /**
     * Classify vehicle state
     * @returns 'running' | 'idle' | 'excessive_idle' | 'stopped'
     */
    static classify(speed, rpm, idleDurationMs) {
        if (speed > 0) return 'running';
        if (rpm === 0) return 'stopped';
        if (rpm > CONFIG.idleRPMThreshold) {
            if (idleDurationMs >= CONFIG.excessiveIdleMinutes * 60 * 1000) {
                return 'excessive_idle';
            }
            return 'idle';
        }
        return 'stopped';
    }

    /**
     * Calculate idle duration from start
     */
    static calculateIdleDuration(idleStartTimestamp) {
        if (!idleStartTimestamp) return 0;
        return Date.now() - idleStartTimestamp;
    }

    /**
     * Format duration (ms) to human readable
     */
    static formatDuration(ms) {
        if (ms <= 0) return '0s';
        const totalSec = Math.floor(ms / 1000);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }
}

/* ---- Emission Analysis Engine ---- */
class EmissionAnalysisEngine {
    constructor() {
        this.emissionLog = []; // time-series of emission snapshots
        this.maxLogSize = 200;
        this.cumulativeData = [];
    }

    /**
     * Calculate fuel wasted during idle period
     */
    static calculateFuelWaste(vehicleType, idleDurationMs) {
        const hours = idleDurationMs / 3600000;
        const rate = CONFIG.idleFuelRates[vehicleType] || 2.0;
        return parseFloat((rate * hours).toFixed(4));
    }

    /**
     * Calculate CO₂ from fuel
     */
    static calculateCO2(fuelLiters) {
        return parseFloat((fuelLiters * CONFIG.co2PerLiterDiesel).toFixed(4));
    }

    /**
     * Log emission snapshot for trends
     */
    logSnapshot(snapshot) {
        this.emissionLog.push({
            timestamp: Date.now(),
            totalCO2: snapshot.totalCO2,
            totalFuel: snapshot.totalFuelWasted,
            idleCount: snapshot.idle + snapshot.excessive
        });

        if (this.emissionLog.length > this.maxLogSize) {
            this.emissionLog.shift();
        }

        // Cumulative data
        const lastCumulative = this.cumulativeData.length > 0
            ? this.cumulativeData[this.cumulativeData.length - 1].co2
            : 0;
        this.cumulativeData.push({
            timestamp: Date.now(),
            co2: lastCumulative + (snapshot.totalCO2 - lastCumulative) * 0.1 + Math.random() * 0.5
        });

        if (this.cumulativeData.length > this.maxLogSize) {
            this.cumulativeData.shift();
        }
    }

    getEmissionTrend() {
        return this.emissionLog;
    }

    getCumulativeTrend() {
        return this.cumulativeData;
    }
}

/* ---- Smart Alert Engine ---- */
class AlertEngine {
    constructor() {
        this.alerts = [];
        this.maxAlerts = 200;
        this.alertId = 0;
    }

    /**
     * Process vehicles and generate alerts
     */
    processVehicles(vehicles) {
        const newAlerts = [];
        const now = Date.now();

        for (const v of vehicles) {
            // Excessive Idle Alert
            if (v.status === 'excessive_idle' && (now - v.lastAlertTime > 60000)) {
                const fuelWasted = EmissionAnalysisEngine.calculateFuelWaste(v.type, v.currentIdleDuration);
                const co2 = EmissionAnalysisEngine.calculateCO2(fuelWasted);
                
                newAlerts.push(this._createAlert({
                    vehicleId: v.id,
                    type: 'excessive_idle',
                    severity: v.currentIdleDuration > 1800000 ? 'critical' : 'warning',
                    idleDuration: v.currentIdleDuration,
                    fuelWasted: fuelWasted,
                    co2: co2,
                    message: `${v.id} has been idling excessively for ${IdleDetectionEngine.formatDuration(v.currentIdleDuration)}`,
                    action: 'Instruct driver to turn off engine or resume route immediately.',
                    location: v.locationName
                }));
                v.lastAlertTime = now;
            }

            // Emission Spike Alert
            if (v.totalCO2 > 15 && (now - v.lastAlertTime > 120000)) {
                newAlerts.push(this._createAlert({
                    vehicleId: v.id,
                    type: 'emission_spike',
                    severity: v.totalCO2 > 25 ? 'critical' : 'warning',
                    idleDuration: v.currentIdleDuration,
                    fuelWasted: v.totalFuelWasted,
                    co2: v.totalCO2,
                    message: `${v.id} has accumulated ${v.totalCO2.toFixed(1)} kg CO₂ — emission spike detected.`,
                    action: 'Review vehicle maintenance schedule and driver behavior.',
                    location: v.locationName
                }));
                v.lastAlertTime = now;
            }

            // Repeated Idle Pattern
            if (v.idleEventCount > 8 && v.excessiveIdleCount > 3 && (now - v.lastAlertTime > 180000)) {
                newAlerts.push(this._createAlert({
                    vehicleId: v.id,
                    type: 'repeated_idle',
                    severity: 'warning',
                    idleDuration: v.totalIdleTime,
                    fuelWasted: v.totalFuelWasted,
                    co2: v.totalCO2,
                    message: `${v.id} shows repeated idle patterns — ${v.idleEventCount} idle events, ${v.excessiveIdleCount} excessive.`,
                    action: 'Investigate route schedule and assign driver retraining.',
                    location: v.locationName
                }));
                v.lastAlertTime = now;
            }

            // Abnormal Behavior (low driver score + high idle)
            if (v.driverScore < 35 && (now - v.lastAlertTime > 300000)) {
                newAlerts.push(this._createAlert({
                    vehicleId: v.id,
                    type: 'abnormal',
                    severity: 'critical',
                    idleDuration: v.currentIdleDuration,
                    fuelWasted: v.totalFuelWasted,
                    co2: v.totalCO2,
                    message: `${v.id} driver score critically low at ${Math.round(v.driverScore)}. Abnormal behavior detected.`,
                    action: 'Immediately review driver performance and consider reassignment.',
                    location: v.locationName
                }));
                v.lastAlertTime = now;
            }
        }

        // Add new alerts to front
        this.alerts = [...newAlerts, ...this.alerts].slice(0, this.maxAlerts);
        return newAlerts;
    }

    _createAlert(data) {
        return {
            id: `ALT-${++this.alertId}`,
            timestamp: Date.now(),
            ...data
        };
    }

    getAlerts(filters = {}) {
        let filtered = [...this.alerts];
        if (filters.severity && filters.severity !== 'all') {
            filtered = filtered.filter(a => a.severity === filters.severity);
        }
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(a => a.type === filters.type);
        }
        return filtered;
    }

    getAlertStats() {
        const critical = this.alerts.filter(a => a.severity === 'critical').length;
        const warning = this.alerts.filter(a => a.severity === 'warning').length;
        const info = this.alerts.filter(a => a.severity === 'info').length;
        return { critical, warning, info, total: this.alerts.length };
    }

    clearAlerts() {
        this.alerts = [];
    }
}

/* ---- Recommendation Engine ---- */
class RecommendationEngine {
    static generate(vehicles, snapshot) {
        const recommendations = [];

        // 1. Excessive idle vehicles
        const excessiveVehicles = vehicles.filter(v => v.status === 'excessive_idle');
        if (excessiveVehicles.length > 0) {
            recommendations.push({
                icon: 'fa-engine-warning',
                title: 'Reduce Engine-On Waiting Time',
                desc: `${excessiveVehicles.length} vehicle(s) are currently idling excessively. Implement auto-shutoff policies for vehicles idling more than ${CONFIG.excessiveIdleMinutes} minutes. Estimated daily savings: ${(excessiveVehicles.length * 2.5).toFixed(1)}L fuel.`,
                impact: 'high',
                impactLabel: 'High Impact'
            });
        }

        // 2. Maintenance scheduling
        const lowPerfVehicles = vehicles.filter(v => v.vehiclePerformanceScore < 60);
        if (lowPerfVehicles.length > 0) {
            recommendations.push({
                icon: 'fa-wrench',
                title: 'Schedule Vehicle Maintenance',
                desc: `${lowPerfVehicles.length} vehicle(s) have performance scores below 60%. Schedule preventive maintenance to improve fuel efficiency and reduce idle emissions. Top priority: ${lowPerfVehicles.slice(0, 3).map(v => v.id).join(', ')}.`,
                impact: 'high',
                impactLabel: 'High Impact'
            });
        }

        // 3. Congestion-related idle
        const hotspots = new FleetSimulator().getIdleHotspots ? null : null;
        const idleLocations = {};
        vehicles.filter(v => v.status === 'idle' || v.status === 'excessive_idle').forEach(v => {
            idleLocations[v.locationName] = (idleLocations[v.locationName] || 0) + 1;
        });
        const congested = Object.entries(idleLocations).filter(([, count]) => count >= 3);
        if (congested.length > 0) {
            recommendations.push({
                icon: 'fa-traffic-light',
                title: 'Reduce Congestion-Related Idle Periods',
                desc: `${congested.length} location(s) show vehicle clustering with idle patterns: ${congested.map(([loc, c]) => `${loc} (${c} vehicles)`).join(', ')}. Consider rerouting or staggering dispatch times.`,
                impact: 'medium',
                impactLabel: 'Medium Impact'
            });
        }

        // 4. Driver efficiency
        const lowScoreDrivers = vehicles.filter(v => v.driverScore < 50);
        if (lowScoreDrivers.length > 0) {
            recommendations.push({
                icon: 'fa-user-graduate',
                title: 'Improve Driver Efficiency',
                desc: `${lowScoreDrivers.length} driver(s) have efficiency scores below 50%. Conduct targeted training on fuel-efficient driving, proper shutdown procedures, and route optimization. Drivers: ${lowScoreDrivers.slice(0, 4).map(v => v.driver).join(', ')}.`,
                impact: 'high',
                impactLabel: 'High Impact'
            });
        }

        // 5. Fleet-wide fuel savings
        if (snapshot.totalFuelWasted > 5) {
            recommendations.push({
                icon: 'fa-leaf',
                title: 'Fleet-Wide Fuel Savings Opportunity',
                desc: `Current session has recorded ${snapshot.totalFuelWasted.toFixed(1)}L of fuel wasted during idle periods, equivalent to ${snapshot.totalCO2.toFixed(1)}kg CO₂. Implementing stop-start technology could save 15-25% of idle fuel consumption.`,
                impact: 'high',
                impactLabel: 'High Impact'
            });
        }

        // 6. General
        recommendations.push({
            icon: 'fa-chart-simple',
            title: 'Optimize Route Scheduling',
            desc: 'Analyze peak idle times and adjust departure schedules to minimize waiting at congested zones. Use predictive analytics to pre-plan routes with minimal stoppage.',
            impact: 'medium',
            impactLabel: 'Medium Impact'
        });

        return recommendations;
    }
}

/* ---- Predictive Insights Engine ---- */
class PredictiveInsightsEngine {
    static generate(vehicles, snapshot, emissionTrend) {
        const predictions = [];
        const now = new Date();
        const hour = now.getHours();

        // 1. Projected emissions
        if (emissionTrend.length > 5) {
            const recentRate = emissionTrend.slice(-5).reduce((sum, e) => sum + e.totalCO2, 0) / 5;
            const projectedDaily = recentRate * (24 * 3600 / (CONFIG.updateInterval / 1000));
            predictions.push({
                icon: 'fa-chart-line',
                title: 'Projected Daily CO₂ Emissions',
                desc: `Based on current trends, estimated daily CO₂ emission is ${projectedDaily.toFixed(1)}kg. ${projectedDaily > 100 ? 'This exceeds recommended limits. Immediate action required.' : 'Within acceptable range but monitoring recommended.'}`
            });
        }

        // 2. Peak idle prediction
        predictions.push({
            icon: 'fa-clock',
            title: 'Peak Idle Hours Prediction',
            desc: `Historical patterns indicate peak idling occurs between 10:00 AM - 12:00 PM and 3:00 PM - 5:00 PM. ${hour >= 10 && hour <= 12 ? '⚠️ Currently in peak idle window — active monitoring recommended.' : 'Next peak window approaching — prepare fleet management response.'}`
        });

        // 3. Vehicle risk prediction
        const atRisk = vehicles.filter(v => v.excessiveIdleCount > 4 && v.driverScore < 50);
        if (atRisk.length > 0) {
            predictions.push({
                icon: 'fa-triangle-exclamation',
                title: 'High-Risk Vehicle Alert',
                desc: `${atRisk.length} vehicle(s) are predicted to continue excessive idling based on driver behavior patterns: ${atRisk.map(v => v.id).join(', ')}. Proactive intervention recommended within the next hour.`
            });
        }

        // 4. Fuel budget forecast
        const dailyFuelWaste = snapshot.totalFuelWasted * 12; // rough projection
        predictions.push({
            icon: 'fa-indian-rupee-sign',
            title: 'Fuel Budget Impact Forecast',
            desc: `Projected idle fuel waste: ${dailyFuelWaste.toFixed(1)}L/day (₹${(dailyFuelWaste * 95).toFixed(0)}/day at current diesel prices). Monthly projection: ₹${(dailyFuelWaste * 95 * 30).toLocaleString()}.`
        });

        // 5. Fleet health projection
        predictions.push({
            icon: 'fa-heart-pulse',
            title: 'Fleet Health Trajectory',
            desc: `Fleet health score is currently ${snapshot.healthScore}%. ${snapshot.healthScore < 70 ? 'Declining trend detected — if not addressed, health may drop below 50% within 48 hours.' : 'Stable performance trajectory maintained. Continue monitoring.'}`
        });

        return predictions;
    }
}
