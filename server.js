// ===== BACKEND SERVER FOR DANUKAYA TOP-UP =====
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
// const FreeFireAPI = require('@spinzaf/freefire-api');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 8080;

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `pack_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// File Paths
const PACKS_FILE = path.join(__dirname, 'packs.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const EVENTS_FILE = path.join(__dirname, 'events.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

// Helper to log account activity
function logAccountActivity(identifier, action, details = null) {
    const history = getData(ACCOUNTS_FILE, []);
    history.unshift({
        identifier,
        action,
        timestamp: new Date().toISOString(),
        ip: 'User Action',
        details: details // Store extra info like pack, price, playerID
    });
    // Keep only last 100 entries for performance
    saveData(ACCOUNTS_FILE, history.slice(0, 100));
}


// Global Error Handlers
process.on('unhandledRejection', (reason) => console.error('⚠️ Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.error('❌ Uncaught Exception:', err));

// Database Helpers
function getData(file, defaultVal = []) {
    try {
        if (!fs.existsSync(file)) return defaultVal;
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
        return defaultVal;
    }
}

function saveData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`Error saving ${file}:`, e.message);
        return false;
    }
}

// Initialize Directories & Files
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync(USERS_FILE)) saveData(USERS_FILE, []);
if (!fs.existsSync(ORDERS_FILE)) saveData(ORDERS_FILE, []);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleTimeString()} | ${req.method} ${req.url}`);
    next();
});

// ===== AUTH ENDPOINTS =====
app.post('/api/auth/signup', (req, res) => {
    try {
        const { identifier, username, email, phone, nic, password } = req.body;
        
        if (!identifier || !password || !email || !phone || !nic) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Server-side regex check
        const phoneRegex = /^(0|94)?[7][0-9]{8}$/;
        const nicRegex = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;
        
        if (!phoneRegex.test(phone)) return res.status(400).json({ error: 'Invalid Sri Lankan Phone Number' });
        if (!nicRegex.test(nic)) return res.status(400).json({ error: 'Invalid Sri Lankan NIC' });
        
        const users = getData(USERS_FILE, []);
        if (users.find(u => u.identifier === identifier || (u.email && u.email === email) || (u.phone && u.phone === phone) || (u.nic && u.nic === nic))) {
            return res.status(400).json({ error: 'User, Email, Phone or NIC already exists' });
        }
        
        const newUser = { identifier, username, email, phone, nic, password, createdAt: new Date().toISOString() };
        users.push(newUser);
        saveData(USERS_FILE, users);
        logAccountActivity(identifier, 'Account Created');
        res.json({ success: true, message: 'Account created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    const users = getData(USERS_FILE, []);
    
    // Support login via Username, Email, Phone, or NIC
    const user = users.find(u => 
        (u.identifier === identifier || u.email === identifier || u.phone === identifier || u.username === identifier || u.nic === identifier) && 
        u.password === password
    );
    
    if (user) {
        logAccountActivity(user.identifier, 'User Login');
        res.json({ success: true, user: { identifier: user.identifier } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/accounts/history', (req, res) => {
    res.json(getData(ACCOUNTS_FILE, []));
});

// ===== PLAYER VERIFICATION =====
let playerCache = {};
app.post('/api/verify-player', async (req, res) => {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: 'Player ID required' });

    if (playerCache[playerId]) return res.json({ success: true, ...playerCache[playerId] });

    try {
        console.log(`📡 Verifying Player ID: ${playerId}`);
        /*
        let profile = await ffApi.getPlayerProfile(playerId).catch(() => null);
        
        if (profile && (profile.basicInfo || profile.nickname)) {
            const basic = profile.basicInfo || profile;
            const info = {
                playerId,
                playerName: basic.nickname || basic.playerName || `Player_${playerId}`,
                level: basic.level || '-',
                region: basic.region || '-',
                rankPoints: basic.rankingPoints || '-',
                clanName: (profile.clanBasicInfo && profile.clanBasicInfo.clanName) ? profile.clanBasicInfo.clanName : 'No Clan'
            };
            playerCache[playerId] = info;
            console.log(`✅ Library Success: ${info.playerName}`);
            return res.json({ success: true, ...info });
        }
        */

        // Fallback API
        const response = await fetch(`https://freefirecommunity.com/api/info?uid=jtFHwFrCs0ZrsHMLba9Laj4OgvB3&key=WOuBo75yLdaR2g0CraIWpOIRgxTIQG&id=${playerId}`).catch(() => null);
        if (response && response.ok) {
            const data = await response.json().catch(() => null);
            if (data && data.basicInfo) {
                const info = {
                    playerId,
                    playerName: data.basicInfo.nickname,
                    level: data.basicInfo.level || '-',
                    region: data.basicInfo.region || '-'
                };
                playerCache[playerId] = info;
                console.log(`✅ Fallback Success: ${info.playerName}`);
                return res.json({ success: true, ...info });
            }
        }

        // Generic Success
        console.log(`⚠️ Using Generic Fallback for ${playerId}`);
        return res.json({ success: true, playerId, playerName: `Player_${playerId}`, level: '-', region: '-' });
    } catch (err) {
        console.error('❌ Verification Error:', err.message);
        return res.json({ success: true, playerId, playerName: `Player_${playerId}` });
    }
});

// ===== ORDERS API =====
app.get('/api/orders', (req, res) => res.json(getData(ORDERS_FILE, [])));

app.post('/api/orders', (req, res) => {
    const orders = getData(ORDERS_FILE, []);
    const orderData = req.body;
    const order = { 
        ...orderData, 
        id: Date.now(), 
        status: 'pending', 
        timestamp: new Date().toISOString() 
    };
    orders.unshift(order);
    saveData(ORDERS_FILE, orders);

    // Also log this as an account activity if user is logged in
    if (orderData.userIdentifier) {
        logAccountActivity(orderData.userIdentifier, 'Order Placed', {
            pack: orderData.pack.diamonds,
            price: orderData.pack.price,
            playerId: orderData.playerId,
            method: orderData.paymentMethod
        });
    }

    // ===== AUTO WHATSAPP NOTIFICATION =====
    try {
        const settings = getData(SETTINGS_FILE, {});
        const whatsappNumber = (settings.whatsappNumber || '').replace(/[\s\+\-()]/g, '');
        
        if (whatsappNumber) {
            const orderTime = new Date(order.timestamp).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' });
            const msgLines = [
                'NEW ORDER RECEIVED!',
                '',
                'Order ID: #' + order.id,
                'Time: ' + orderTime,
                '',
                'Player Name: ' + (orderData.playerName || 'Unknown'),
                'Player ID: ' + orderData.playerId,
                'Pack: ' + (orderData.pack?.diamonds || '-'),
                'Price: ' + (orderData.pack?.price || '-'),
                'Payment: ' + (orderData.paymentMethod || '-'),
                '',
                'Please process this order!'
            ];
            const message = msgLines.join('\n');
            const waLink = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message);
            console.log('WhatsApp Notification Link:\n' + waLink);
            console.log('New order #' + order.id + ' - WhatsApp alert ready for: +' + whatsappNumber);
        }
    } catch (notifErr) {
        console.error('WhatsApp notification error:', notifErr.message);
    }

    console.log(`📦 New Order Saved: ${order.id}`);
    res.json({ success: true, order, whatsappAlert: true });
});

// Get order status
app.get('/api/orders/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const orders = getData(ORDERS_FILE, []);
    const order = orders.find(o => o.id === id);
    if (order) {
        res.json({ status: order.status });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.post('/api/orders/update', (req, res) => {
    const { id, status } = req.body;
    const orders = getData(ORDERS_FILE, []);
    const index = orders.findIndex(o => o.id == id);
    if (index !== -1) {
        orders[index].status = status;
        saveData(ORDERS_FILE, orders);
        console.log(`🔄 Order ${id} set to ${status}`);
        res.json({ success: true });
    } else res.status(404).json({ error: 'Order not found' });
});

app.delete('/api/orders', (req, res) => {
    // Delete all orders if needed, or implement individual delete
    saveData(ORDERS_FILE, []);
    res.json({ success: true });
});

app.delete('/api/orders/:id', (req, res) => {
    const id = req.params.id;
    let orders = getData(ORDERS_FILE, []);
    orders = orders.filter(o => o.id != id);
    saveData(ORDERS_FILE, orders);
    console.log(`🗑️ Order ${id} deleted`);
    res.json({ success: true });
});

// ===== PACKS API =====
app.get('/api/packs', (req, res) => res.json(getData(PACKS_FILE, [])));

app.post('/api/packs', upload.single('image'), (req, res) => {
    const packs = getData(PACKS_FILE, []);
    const packData = JSON.parse(req.body.packData);
    if (req.file) packData.imageUrl = `/uploads/${req.file.filename}`;

    const index = packs.findIndex(p => p.id === packData.id);
    if (index !== -1) packs[index] = { ...packs[index], ...packData };
    else {
        packData.id = packs.length > 0 ? Math.max(...packs.map(p => p.id)) + 1 : 1;
        packs.push(packData);
    }
    saveData(PACKS_FILE, packs);
    console.log(`💎 Pack Updated: ${packData.diamonds}`);
    res.json({ success: true, pack: packData });
});

app.delete('/api/packs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const packs = getData(PACKS_FILE, []).filter(p => p.id !== id);
    saveData(PACKS_FILE, packs);
    res.json({ success: true });
});

// ===== SETTINGS API =====
app.get('/api/settings', (req, res) => res.json(getData(SETTINGS_FILE, {})));
app.post('/api/settings', (req, res) => {
    const currentSettings = getData(SETTINGS_FILE, {});
    const newSettings = { ...currentSettings, ...req.body };
    saveData(SETTINGS_FILE, newSettings);
    console.log(`⚙️ Settings Merged & Updated`);
    res.json({ success: true });
});

app.post('/api/settings/profile-pic', upload.single('profilePic'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const settings = getData(SETTINGS_FILE, {});
    settings.adminProfilePic = `/uploads/${req.file.filename}`;
    saveData(SETTINGS_FILE, settings);
    
    console.log(`👤 Admin Profile Picture Updated: ${settings.adminProfilePic}`);
    res.json({ success: true, imageUrl: settings.adminProfilePic });
});

app.post('/api/settings/game-icon', upload.single('gameIcon'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });
    
    const settings = getData(SETTINGS_FILE, {});
    if (!settings.gameIcons) settings.gameIcons = {};
    settings.gameIcons[gameId] = `/uploads/${req.file.filename}`;
    saveData(SETTINGS_FILE, settings);
    
    console.log(`🎮 Game Icon Updated [${gameId}]: ${settings.gameIcons[gameId]}`);
    res.json({ success: true, imageUrl: settings.gameIcons[gameId] });
});

app.post('/api/settings/payment-methods', upload.single('paymentBanner'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const settings = getData(SETTINGS_FILE, {});
    settings.paymentMethodsBanner = `/uploads/${req.file.filename}`;
    saveData(SETTINGS_FILE, settings);
    
    console.log(`💳 Payment Methods Banner Updated: ${settings.paymentMethodsBanner}`);
    res.json({ success: true, imageUrl: settings.paymentMethodsBanner });
});

// ===== EVENTS/BANNERS API =====
app.get('/api/events', (req, res) => res.json(getData(EVENTS_FILE, [])));

app.post('/api/events', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    
    const events = getData(EVENTS_FILE, []);
    const newEvent = {
        id: Date.now(),
        imageUrl: `/uploads/${req.file.filename}`,
        title: req.body.title || 'Upcoming Event'
    };
    
    events.push(newEvent);
    saveData(EVENTS_FILE, events);
    console.log(`📸 New Event Banner Added`);
    res.json({ success: true, event: newEvent });
});

app.delete('/api/events/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let events = getData(EVENTS_FILE, []);
    const event = events.find(e => e.id === id);
    
    if (event) {
        // Optionally delete the physical file here if you want to be thorough
        events = events.filter(e => e.id !== id);
        saveData(EVENTS_FILE, events);
        console.log(`🗑️ Event Banner Deleted`);
        res.json({ success: true });
    } else res.status(404).json({ error: 'Event not found' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 Danukaya Top Up Server Running!`);
    console.log(`🔗 Local Interface: http://localhost:${PORT}`);
    console.log(`🔗 Network Interface: http://127.0.0.1:${PORT}`);
    console.log(`🛡️ Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log('========================================');
});
