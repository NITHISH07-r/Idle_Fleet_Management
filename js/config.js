/* ========================================================================
   FleetPulse — Configuration Module
   ======================================================================== */

const CONFIG = {
    // Simulation
    vehicleCount: 75,
    updateInterval: 5000, // ms
    
    // Idle Detection
    idleRPMThreshold: 700,
    excessiveIdleMinutes: 10,

    // Emission Factors
    co2PerLiterDiesel: 2.68, // kg CO₂ per liter
    idleFuelRates: { // Liters per hour during idle
        bus: 3.5,
        garbage_truck: 2.8,
        water_tanker: 2.5,
        service_vehicle: 1.5
    },

    // Vehicle Types & Metadata
    vehicleTypes: [
        { type: 'bus', label: 'City Bus', icon: 'fa-bus', prefix: 'BUS', count: 25 },
        { type: 'garbage_truck', label: 'Garbage Truck', icon: 'fa-trash-can', prefix: 'GBT', count: 18 },
        { type: 'water_tanker', label: 'Water Tanker', icon: 'fa-droplet', prefix: 'WTK', count: 14 },
        { type: 'service_vehicle', label: 'Service Vehicle', icon: 'fa-van-shuttle', prefix: 'SVC', count: 18 }
    ],

    // Simulated GPS Locations (Indian Smart Cities)
    locations: [
        { name: 'Central Bus Station', lat: 17.3850, lng: 78.4867 },
        { name: 'City Hall', lat: 17.3930, lng: 78.4720 },
        { name: 'Industrial Zone A', lat: 17.4100, lng: 78.5100 },
        { name: 'Residential Block 7', lat: 17.3750, lng: 78.4500 },
        { name: 'Market Road Junction', lat: 17.3600, lng: 78.4750 },
        { name: 'Hospital Circle', lat: 17.4050, lng: 78.4600 },
        { name: 'University Campus', lat: 17.4200, lng: 78.4400 },
        { name: 'Railway Station', lat: 17.3820, lng: 78.5000 },
        { name: 'Water Treatment Plant', lat: 17.3950, lng: 78.5200 },
        { name: 'Waste Processing Center', lat: 17.4300, lng: 78.5300 },
        { name: 'IT Park Gate', lat: 17.4400, lng: 78.3800 },
        { name: 'Old Town Square', lat: 17.3700, lng: 78.4800 },
        { name: 'Ring Road Toll', lat: 17.4500, lng: 78.4100 },
        { name: 'Sports Complex', lat: 17.3550, lng: 78.4350 },
        { name: 'Airport Access Road', lat: 17.2400, lng: 78.4300 }
    ],

    // Driver Names
    driverNames: [
        'Rajesh Kumar', 'Suresh Patil', 'Amit Shah', 'Priya Sharma', 'Vikram Singh',
        'Deepak Joshi', 'Ravi Prasad', 'Meena Devi', 'Arun Nair', 'Sanjay Gupta',
        'Kavita Rao', 'Manoj Tiwari', 'Neha Verma', 'Rahul Mishra', 'Pooja Das',
        'Sunil Yadav', 'Anita Reddy', 'Kiran Mehta', 'Gaurav Dubey', 'Leela Nand',
        'Harish Chand', 'Sunita Devi', 'Ashok Babu', 'Rekha Iyer', 'Prakash Raj',
        'Mohan Lal', 'Geeta Soni', 'Ramesh Patel', 'Usha Rani', 'Dinesh Kapoor',
        'Lakshmi Narayan', 'Bharat Singh', 'Jaya Kumari', 'Vijay Bhatt', 'Saroja Devi',
        'Naresh Kumar', 'Padma Lakshmi', 'Gopal Krishna', 'Renuka Prasad', 'Balaji Rao',
        'Chandra Mohan', 'Divya Jain', 'Eshwar Reddy', 'Fatima Begum', 'Ganesan Pillai',
        'Hari Prasad', 'Indira Kumari', 'Jagdish Patel', 'Kamala Devi', 'Lata Mangeshkar',
        'Mahesh Babu', 'Nandini Sharma', 'Om Prakash', 'Parvathi Amma', 'Rajan Nair',
        'Savitri Devi', 'Trilok Chand', 'Uma Shankar', 'Vasundhara Raje', 'Waheed Khan',
        'Yamuna Devi', 'Zainab Khatun', 'Aditya Verma', 'Bharati Sen', 'Chetan Bhagat',
        'Durga Prasad', 'Ekta Kapoor', 'Feroz Khan', 'Girish Karnad', 'Hemalatha Devi',
        'Ishaan Khatter', 'Janaki Devi', 'Krishna Murthy', 'Laxman Singh', 'Malathi Rao'
    ],

    // Routes
    routes: [
        'Route A-1', 'Route A-2', 'Route B-1', 'Route B-2', 'Route C-1',
        'Route C-2', 'Route D-1', 'Route D-2', 'Route E-1', 'Route E-2',
        'Zone North', 'Zone South', 'Zone East', 'Zone West', 'Zone Central',
        'Express-1', 'Express-2', 'Ring-1', 'Ring-2', 'Bypass-1'
    ],

    // Chart Colors — Vivid Neon Palette
    chartColors: {
        blue: '#4f8fff',
        cyan: '#00e5ff',
        emerald: '#00e89d',
        amber: '#ffb300',
        rose: '#ff3d71',
        violet: '#a855f7',
        indigo: '#818cf8',
        teal: '#2dd4bf',
        orange: '#ff6b35',
        pink: '#ff6bcb'
    }
};
