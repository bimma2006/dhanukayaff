const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

function getData(file, defaultVal = []) {
    try {
        if (!fs.existsSync(file)) return defaultVal;
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return defaultVal;
    }
}

function saveData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        return false;
    }
}

const orders = getData(ORDERS_FILE);
const accounts = getData(ACCOUNTS_FILE);

// Convert orders to history entries
const orderHistory = orders.map(order => ({
    identifier: "Migrated Order",
    action: "Order Placed",
    timestamp: order.timestamp,
    ip: "System Migration",
    details: {
        pack: order.pack.diamonds,
        price: order.pack.price,
        playerId: order.playerId,
        method: order.paymentMethod
    }
}));

// Merge and sort by timestamp
const combined = [...orderHistory, ...accounts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

saveData(ACCOUNTS_FILE, combined.slice(0, 100));
console.log("✅ Successfully migrated orders to account history!");
