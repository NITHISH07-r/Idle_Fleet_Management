/* ========================================================================
   FleetPulse — Simulation Module
   Generates realistic OBD-II telemetry data for the fleet
   ======================================================================== */

class FleetSimulator {
    constructor() {
        this.vehicles = [];
        this.telemetryHistory = [];
        this.maxHistory = 500;
        this.tickCount = 0;
    }

    /**
     * Initialize the fleet with simulated vehicles
     */
    initialize(count) {
        this.vehicles = [];
        let idx = 0;

        for (const vType of CONFIG.vehicleTypes) {
            const typeCount = Math.round((vType.count / 75) * count);
            for (let i = 0; i < typeCount && idx < count; i++) {
                const vehicle = this._createVehicle(idx, vType, i + 1);
                this.vehicles.push(vehicle);
                idx++;
            }
        }

        // Fill remaining if rounding mismatch
        while (idx < count) {
            const vType = CONFIG.vehicleTypes[idx % CONFIG.vehicleTypes.length];
            const num = Math.floor(idx / CONFIG.vehicleTypes.length) + 50;
            this.vehicles.push(this._createVehicle(idx, vType, num));
            idx++;
        }
    }

    _createVehicle(idx, vType, num) {
        const loc = CONFIG.locations[Math.floor(Math.random() * CONFIG.locations.length)];
        const initialState = Math.random();
        let status, speed, rpm, fuelRate;

        if (initialState < 0.55) {
            // Running
            status = 'running';
            speed = this._randomRange(15, 65);
            rpm = this._randomRange(1200, 3500);
            fuelRate = this._randomRange(4, 18);
        } else if (initialState < 0.80) {
            // Idle
            status = 'idle';
            speed = 0;
            rpm = this._randomRange(700, 1100);
            fuelRate = CONFIG.idleFuelRates[vType.type];
        } else if (initialState < 0.90) {
            // Excessive idle
            status = 'excessive_idle';
            speed = 0;
            rpm = this._randomRange(700, 1100);
            fuelRate = CONFIG.idleFuelRates[vType.type];
        } else {
            // Stopped
            status = 'stopped';
            speed = 0;
            rpm = 0;
            fuelRate = 0;
        }

        const now = Date.now();
        const idleStart = (status === 'idle' || status === 'excessive_idle')
            ? now - (status === 'excessive_idle' ? this._randomRange(600000, 1800000) : this._randomRange(30000, 540000))
            : null;

        return {
            id: `${vType.prefix}-${String(num).padStart(3, '0')}`,
            index: idx,
            type: vType.type,
            typeLabel: vType.label,
            icon: vType.icon,
            driver: CONFIG.driverNames[idx % CONFIG.driverNames.length],
            route: CONFIG.routes[idx % CONFIG.routes.length],
            // Telemetry
            speed: Math.round(speed),
            rpm: Math.round(rpm),
            fuelRate: parseFloat(fuelRate.toFixed(1)),
            status: status,
            lat: loc.lat + (Math.random() - 0.5) * 0.02,
            lng: loc.lng + (Math.random() - 0.5) * 0.02,
            locationName: loc.name,
            timestamp: now,
            // Idle tracking
            idleStartTime: idleStart,
            currentIdleDuration: idleStart ? (now - idleStart) : 0,
            totalIdleTime: this._randomRange(0, 7200000), // ms
            idleEventCount: Math.floor(Math.random() * 15),
            excessiveIdleCount: Math.floor(Math.random() * 5),
            // Emissions
            totalFuelWasted: parseFloat((Math.random() * 12).toFixed(2)), // liters
            totalCO2: 0, // will be calculated
            // Scores
            driverScore: this._randomRange(40, 98),
            vehiclePerformanceScore: this._randomRange(50, 99),
            // Behavior tracking
            behaviorPattern: 'normal', // normal, concerning, critical
            stateTransitions: [],
            lastAlertTime: 0
        };
    }

    /**
     * Generate next tick of telemetry data
     */
    tick() {
        this.tickCount++;
        const now = Date.now();
        const batch = [];

        for (const v of this.vehicles) {
            this._updateVehicle(v, now);
            
            const telemetry = {
                vehicleId: v.id,
                timestamp: now,
                speed: v.speed,
                rpm: v.rpm,
                fuelRate: v.fuelRate,
                status: v.status,
                lat: v.lat,
                lng: v.lng,
                locationName: v.locationName,
                driver: v.driver,
                type: v.type,
                idleDuration: v.currentIdleDuration,
                driverScore: v.driverScore,
                vehicleScore: v.vehiclePerformanceScore
            };

            batch.push(telemetry);
        }

        // Store limited history
        this.telemetryHistory.push({ timestamp: now, data: batch });
        if (this.telemetryHistory.length > this.maxHistory) {
            this.telemetryHistory.shift();
        }

        return batch;
    }

    /**
     * Update individual vehicle state with realistic transitions
     */
    _updateVehicle(v, now) {
        const elapsed = (now - v.timestamp) / 1000; // seconds
        v.timestamp = now;

        // State transition probabilities
        const rand = Math.random();

        switch (v.status) {
            case 'running':
                if (rand < 0.08) {
                    // Transition to idle
                    this._transitionToIdle(v, now);
                } else if (rand < 0.03) {
                    // Transition to stopped
                    this._transitionToStopped(v, now);
                } else {
                    // Continue running — vary speed/rpm
                    v.speed = Math.max(5, Math.min(80, v.speed + this._randomRange(-8, 8)));
                    v.rpm = Math.max(800, Math.min(4500, v.rpm + this._randomRange(-200, 200)));
                    v.fuelRate = parseFloat((v.speed * 0.15 + v.rpm * 0.002 + Math.random() * 2).toFixed(1));
                    // Drift GPS slightly
                    v.lat += (Math.random() - 0.5) * 0.001;
                    v.lng += (Math.random() - 0.5) * 0.001;
                }
                break;

            case 'idle':
                // Accumulate idle time
                v.currentIdleDuration = now - v.idleStartTime;
                v.totalIdleTime += elapsed * 1000;

                // Calculate fuel waste during idle
                const idleFuelPerSec = CONFIG.idleFuelRates[v.type] / 3600;
                v.totalFuelWasted += idleFuelPerSec * elapsed;
                v.fuelRate = CONFIG.idleFuelRates[v.type];

                // Check for excessive idle
                if (v.currentIdleDuration >= CONFIG.excessiveIdleMinutes * 60 * 1000) {
                    v.status = 'excessive_idle';
                    v.excessiveIdleCount++;
                    v.behaviorPattern = v.excessiveIdleCount > 3 ? 'critical' : 'concerning';
                }

                if (rand < 0.12) {
                    this._transitionToRunning(v, now);
                } else if (rand < 0.04) {
                    this._transitionToStopped(v, now);
                } else {
                    // Vary RPM slightly while idle
                    v.rpm = Math.max(650, Math.min(1200, v.rpm + this._randomRange(-30, 30)));
                }
                break;

            case 'excessive_idle':
                v.currentIdleDuration = now - v.idleStartTime;
                v.totalIdleTime += elapsed * 1000;

                const exIdleFuelPerSec = CONFIG.idleFuelRates[v.type] / 3600;
                v.totalFuelWasted += exIdleFuelPerSec * elapsed;
                v.fuelRate = CONFIG.idleFuelRates[v.type];

                if (rand < 0.15) {
                    this._transitionToRunning(v, now);
                } else if (rand < 0.05) {
                    this._transitionToStopped(v, now);
                } else {
                    v.rpm = Math.max(650, Math.min(1200, v.rpm + this._randomRange(-20, 20)));
                }

                // Degrade driver score slightly
                v.driverScore = Math.max(10, v.driverScore - 0.1);
                break;

            case 'stopped':
                v.speed = 0;
                v.rpm = 0;
                v.fuelRate = 0;
                v.currentIdleDuration = 0;

                if (rand < 0.1) {
                    this._transitionToRunning(v, now);
                } else if (rand < 0.06) {
                    this._transitionToIdle(v, now);
                }
                break;
        }

        // Calculate CO2
        v.totalCO2 = parseFloat((v.totalFuelWasted * CONFIG.co2PerLiterDiesel).toFixed(2));

        // Update vehicle performance score
        if (v.excessiveIdleCount > 5) {
            v.vehiclePerformanceScore = Math.max(20, v.vehiclePerformanceScore - 0.05);
        }

        // Occasionally change location for running vehicles
        if (v.status === 'running' && Math.random() < 0.02) {
            const newLoc = CONFIG.locations[Math.floor(Math.random() * CONFIG.locations.length)];
            v.locationName = newLoc.name;
            v.lat = newLoc.lat + (Math.random() - 0.5) * 0.02;
            v.lng = newLoc.lng + (Math.random() - 0.5) * 0.02;
        }
    }

    _transitionToIdle(v, now) {
        v.status = 'idle';
        v.speed = 0;
        v.rpm = this._randomRange(700, 1100);
        v.fuelRate = CONFIG.idleFuelRates[v.type];
        v.idleStartTime = now;
        v.currentIdleDuration = 0;
        v.idleEventCount++;
    }

    _transitionToRunning(v, now) {
        v.status = 'running';
        v.speed = this._randomRange(15, 55);
        v.rpm = this._randomRange(1200, 3000);
        v.fuelRate = parseFloat((v.speed * 0.15 + v.rpm * 0.002 + Math.random() * 2).toFixed(1));
        v.idleStartTime = null;
        v.currentIdleDuration = 0;
        // Slowly recover driver score when driving normally
        v.driverScore = Math.min(98, v.driverScore + 0.05);
    }

    _transitionToStopped(v, now) {
        v.status = 'stopped';
        v.speed = 0;
        v.rpm = 0;
        v.fuelRate = 0;
        v.idleStartTime = null;
        v.currentIdleDuration = 0;
    }

    /**
     * Get current fleet snapshot
     */
    getFleetSnapshot() {
        const running = this.vehicles.filter(v => v.status === 'running').length;
        const idle = this.vehicles.filter(v => v.status === 'idle').length;
        const excessive = this.vehicles.filter(v => v.status === 'excessive_idle').length;
        const stopped = this.vehicles.filter(v => v.status === 'stopped').length;
        const totalFuel = this.vehicles.reduce((sum, v) => sum + v.totalFuelWasted, 0);
        const totalCO2 = this.vehicles.reduce((sum, v) => sum + v.totalCO2, 0);
        const avgDriverScore = this.vehicles.reduce((sum, v) => sum + v.driverScore, 0) / this.vehicles.length;
        const healthScore = Math.round(
            100 - (excessive / this.vehicles.length * 60) - (idle / this.vehicles.length * 15)
        );

        return {
            total: this.vehicles.length,
            running, idle, excessive, stopped,
            totalFuelWasted: parseFloat(totalFuel.toFixed(2)),
            totalCO2: parseFloat(totalCO2.toFixed(2)),
            avgDriverScore: Math.round(avgDriverScore),
            healthScore: Math.max(0, Math.min(100, healthScore))
        };
    }

    /**
     * Get sorted vehicles by various criteria
     */
    getTopIdlers(n = 10) {
        return [...this.vehicles]
            .sort((a, b) => b.totalIdleTime - a.totalIdleTime)
            .slice(0, n);
    }

    getTopEmitters(n = 10) {
        return [...this.vehicles]
            .sort((a, b) => b.totalCO2 - a.totalCO2)
            .slice(0, n);
    }

    getTopFuelWasters(n = 10) {
        return [...this.vehicles]
            .sort((a, b) => b.totalFuelWasted - a.totalFuelWasted)
            .slice(0, n);
    }

    getTopDriverScores(n = 10) {
        return [...this.vehicles]
            .sort((a, b) => b.driverScore - a.driverScore)
            .slice(0, n);
    }

    getWorstDriverScores(n = 10) {
        return [...this.vehicles]
            .sort((a, b) => a.driverScore - b.driverScore)
            .slice(0, n);
    }

    getVehicleById(id) {
        return this.vehicles.find(v => v.id === id);
    }

    /**
     * Idle Hotspot Analysis
     */
    getIdleHotspots() {
        const hotspots = {};
        for (const v of this.vehicles) {
            if (v.status === 'idle' || v.status === 'excessive_idle') {
                const locKey = v.locationName;
                if (!hotspots[locKey]) {
                    hotspots[locKey] = {
                        name: v.locationName,
                        lat: v.lat,
                        lng: v.lng,
                        vehicleCount: 0,
                        totalIdleTime: 0,
                        totalFuelWasted: 0,
                        vehicles: []
                    };
                }
                hotspots[locKey].vehicleCount++;
                hotspots[locKey].totalIdleTime += v.currentIdleDuration;
                hotspots[locKey].totalFuelWasted += v.totalFuelWasted;
                hotspots[locKey].vehicles.push(v.id);
            }
        }

        return Object.values(hotspots).sort((a, b) => b.vehicleCount - a.vehicleCount);
    }

    /**
     * Emission data by vehicle type
     */
    getEmissionsByType() {
        const byType = {};
        for (const v of this.vehicles) {
            if (!byType[v.type]) {
                byType[v.type] = { type: v.type, label: v.typeLabel, totalCO2: 0, totalFuel: 0, count: 0 };
            }
            byType[v.type].totalCO2 += v.totalCO2;
            byType[v.type].totalFuel += v.totalFuelWasted;
            byType[v.type].count++;
        }
        return Object.values(byType);
    }

    _randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
}
