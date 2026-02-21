// ===== ADMIN PANEL JAVASCRIPT =====
const ADMIN_PASSWORD = "123";

// ===== LOGIN SYSTEM =====
function checkLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('loginError');
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminContainer').style.display = 'block';
        refreshOrders();
        loadPacks();
        loadSettings();
    } else {
        errorMsg.style.display = 'block';
        document.getElementById('adminPassword').value = '';
    }
}

function initAuth() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        const overlay = document.getElementById('loginOverlay');
        const container = document.getElementById('adminContainer');
        if (overlay) overlay.style.display = 'none';
        if (container) container.style.display = 'block';
        
        refreshOrders();
        loadPacks();
        loadSettings();
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', initAuth);

// ===== TAB SWITCHING =====
function switchTab(event, tabName) {
    document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    
    const panel = document.getElementById(tabName + 'Panel');
    if (panel) panel.classList.add('active');
    
    if (event) event.currentTarget.classList.add('active');
    
    // Update Header Titles
    const titles = {
        'orders': { title: 'Order Records', desc: 'Management portal for processed top-ups' },
        'packs': { title: 'Inventory Management', desc: 'Configure diamond packs and pricing' },
        'banners': { title: 'Marketing Banners', desc: 'Manage upcoming event sliders on homepage' },
        'settings': { title: 'System Configuration', desc: 'Global store settings and processing mode' },
        'accounts': { title: 'User Account History', desc: 'View recent customer sign-ups and login activities' }
    };
    
    if (titles[tabName]) {
        document.getElementById('panelTitle').textContent = titles[tabName].title;
        document.getElementById('panelDesc').textContent = titles[tabName].desc;
    }
    
    if (tabName === 'orders') refreshOrders();
    else if (tabName === 'packs') loadPacks();
    else if (tabName === 'banners') loadBanners();
    else if (tabName === 'settings') loadSettings();
    else if (tabName === 'accounts') loadAccountHistory();
}

// ===== GLOBAL SAVE & SYNC =====
async function saveAllChanges() {
    try {
        // 1. Save Settings
        const settings = {
            storeName: document.getElementById('storeName').value,
            supportEmail: document.getElementById('supportEmail').value,
            whatsappNumber: document.getElementById('whatsappNumber').value,
            autoTopup: document.getElementById('autoTopup').value === 'true'
        };
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        // 2. We don't save packs here because each pack has unique file/data structure 
        // that requires individual 'Update' clicks for precision, 
        // but we'll run a full sync to ensure server data is correct.
        
        await syncSystem();
        
        alert("✅ System State Saved: All global settings and data records have been synchronized with the server.");
    } catch (e) {
        console.error('Save Error:', e);
        alert("⚠️ Part of the save operation failed. Please check your connection.");
    }
}

async function syncSystem() {
    await Promise.all([
        refreshOrders(),
        loadPacks(),
        loadBanners(),
        loadSettings(),
        loadAccountHistory()
    ]);
    console.log('🔄 Data Synchronized');
}

// Global variable to store orders
let orders = [];

// ===== REFRESH ORDERS =====
async function refreshOrders() {
    try {
        const response = await fetch('/api/orders');
        orders = await response.json();
        displayOrders();
        updateStats();
    } catch (e) {
        console.error('Error refreshing orders:', e);
    }
}

// ===== DISPLAY ORDERS =====
function displayOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 5rem 2rem; color: #64748b;">
                <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.3;">📦</div>
                <h3 style="color: #fff; margin-bottom: 0.5rem;">No Orders Found</h3>
                <p>Transactions will appear here once customers place orders.</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = '';
    orders.slice().reverse().forEach((order) => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const statusClass = order.status || 'pending';
        
        orderCard.innerHTML = `
            <div class="order-details">
                <div class="order-meta">
                    <h4>Order #${order.id}</h4>
                    <p>${new Date(order.timestamp).toLocaleString()}</p>
                </div>
                <div class="order-meta">
                    <h4>${order.playerName}</h4>
                    <p>ID: ${order.playerId}</p>
                </div>
                <div class="order-meta">
                    <h4>${order.pack.diamonds} Diamonds</h4>
                    <p>${order.pack.price} • ${order.paymentMethod}</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <span class="order-status ${statusClass}">${statusClass}</span>
                <div style="display: flex; gap: 0.5rem;">
                    ${statusClass === 'pending' ? `<button class="btn btn-info btn-small" onclick="updateOrderStatus(${order.id}, 'processing')">Process</button>` : ''}
                    ${statusClass === 'processing' ? `<button class="btn btn-success btn-small" onclick="updateOrderStatus(${order.id}, 'completed')">Complete</button>` : ''}
                    <button class="btn btn-danger btn-small" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="deleteOrderLocally(${order.id})">Delete</button>
                </div>
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch('/api/orders/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: orderId, status: status })
        });
        
        if (response.ok) {
            if (status === 'completed') {
                alert(`✅ SUCCESS: Order #${orderId} marked as COMPLETED!`);
            }
            refreshOrders();
        }
    } catch (e) {
        alert('Error updating order');
    }
}

function updateStats() {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const revenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => {
            const priceStr = String(o.pack.price);
            const priceNum = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
            return sum + priceNum;
        }, 0);

    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('completedOrders').textContent = completed;
    document.getElementById('totalRevenue').textContent = 'Rs. ' + revenue.toLocaleString();
}

// ===== ACCOUNT HISTORY =====
async function loadAccountHistory() {
    try {
        const res = await fetch('/api/accounts/history');
        const history = await res.json();
        const list = document.getElementById('accountHistoryList');
        
        list.innerHTML = history.length ? history.map(item => {
            const details = item.details || {};
            const actionClass = item.action.includes('Created') ? 'completed' : (item.action.includes('Order') ? 'processing' : 'pending');
            
            return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 1rem;">
                    <div style="font-weight: 700;">${item.identifier}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${item.ip}</div>
                </td>
                <td style="padding: 1rem;">
                    <span class="order-status ${actionClass}">
                        ${item.action}
                    </span>
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: ${details.pack ? '#fff' : '#64748b'}; font-weight: 600;">
                    ${details.pack || '-'}
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: ${details.price ? '#00d9a3' : '#64748b'}; font-weight: 700;">
                    ${details.price || '-'}
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: ${details.playerId ? '#fff' : '#64748b'};">
                    ${details.playerId || '-'}
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: #64748b;">
                    ${details.method || '-'}
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: #64748b;">
                    ${new Date(item.timestamp).toLocaleString()}
                </td>
            </tr>
        `}).join('') : `<tr><td colspan="7" style="padding: 3rem; text-align: center; color: #64748b;">No recent activity found</td></tr>`;
    } catch (e) {
        console.error('History Error:', e);
    }
}

// Delete order from server
async function deleteOrderLocally(orderId) {
    if (confirm('Permanently delete this order record?')) {
        try {
            await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
            refreshOrders();
        } catch (e) {
            alert('Error deleting order');
        }
    }
}

// ===== DIAMOND PACKS =====
async function loadPacks() {
    const response = await fetch('/api/packs');
    const packs = await response.json();
    const packsList = document.getElementById('packsList');
    if (!packsList) return;
    
    packsList.innerHTML = '';
    packs.forEach((pack, index) => {
        const packEditor = document.createElement('div');
        packEditor.className = 'pack-editor';
        packEditor.innerHTML = `
            <img src="${pack.imageUrl || 'https://via.placeholder.com/200?text=💎'}" id="img_preview_${index}" class="pack-image-preview">
            <input type="file" id="file_${index}" style="display: none;" onchange="previewImage(this, ${index})">
            <button class="image-upload-btn" onclick="document.getElementById('file_${index}').click()">
                📷 Change Product Image
            </button>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Diamonds / Pack Name</label>
                    <input type="text" id="diamonds_${index}" value="${pack.diamonds}">
                </div>
                <div class="form-group">
                    <label>Price Display</label>
                    <input type="text" id="price_${index}" value="${pack.price}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <select id="category_${index}">
                        <option value="diamonds" ${pack.category === 'diamonds' ? 'selected' : ''}>Diamonds</option>
                        <option value="membership" ${pack.category === 'membership' ? 'selected' : ''}>Membership</option>
                        <option value="evo" ${pack.category === 'evo' ? 'selected' : ''}>Evo Access</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Popular Badge</label>
                    <select id="popular_${index}">
                        <option value="true" ${pack.popular ? 'selected' : ''}>Active</option>
                        <option value="false" ${!pack.popular ? 'selected' : ''}>Hidden</option>
                    </select>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label>Bonus Diamonds</label>
                <input type="number" id="bonus_${index}" value="${pack.bonus || 0}">
            </div>

            <div class="pack-actions">
                <button class="btn btn-success" onclick="savePack(${index}, ${pack.id})">Update Pack</button>
                <button class="btn btn-danger" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="deletePack(${pack.id})">Remove</button>
            </div>
        `;
        packsList.appendChild(packEditor);
    });
}

function previewImage(input, index) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => document.getElementById(`img_preview_${index}`).src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
}

async function savePack(index, packId) {
    const formData = new FormData();
    const fileInput = document.getElementById(`file_${index}`);
    const packData = {
        id: packId,
        diamonds: document.getElementById(`diamonds_${index}`).value,
        price: document.getElementById(`price_${index}`).value,
        category: document.getElementById(`category_${index}`).value,
        popular: document.getElementById(`popular_${index}`).value === 'true',
        bonus: parseInt(document.getElementById(`bonus_${index}`).value) || 0
    };
    if (fileInput.files[0]) formData.append('image', fileInput.files[0]);
    formData.append('packData', JSON.stringify(packData));
    
    try {
        await fetch('/api/packs', { method: 'POST', body: formData });
        alert('Success: Diamond pack configuration updated.');
        loadPacks();
    } catch(e) {
        alert('Error saving pack updates.');
    }
}

async function deletePack(packId) {
    if (confirm('Delete this product permanently?')) {
        await fetch(`/api/packs/${packId}`, { method: 'DELETE' });
        loadPacks();
    }
}

async function addNewPack() {
    const formData = new FormData();
    formData.append('packData', JSON.stringify({ diamonds: 'New Pack', price: 'LKR 0', category: 'diamonds', popular: false, bonus: 0 }));
    await fetch('/api/packs', { method: 'POST', body: formData });
    loadPacks();
}

// ===== EVENT BANNERS =====
async function loadBanners() {
    const response = await fetch('/api/events');
    const banners = await response.json();
    const bannersList = document.getElementById('bannersList');
    if (!bannersList) return;
    
    bannersList.innerHTML = '';
    if (banners.length === 0) {
        bannersList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 3rem;">No banners uploaded yet.</p>';
        return;
    }

    banners.forEach((banner) => {
        const item = document.createElement('div');
        item.className = 'panel-card';
        item.style.padding = '1.5rem';
        item.innerHTML = `
            <img src="${banner.imageUrl}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="stat-label" style="font-size: 0.75rem;">ID: ${banner.id}</span>
                <button class="btn btn-danger btn-small" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.5rem 1rem;" onclick="deleteBanner(${banner.id})">Delete Banner</button>
            </div>
        `;
        bannersList.appendChild(item);
    });
}

async function uploadEventBanner(input) {
    if (!input.files || !input.files[0]) return;
    
    const formData = new FormData();
    formData.append('image', input.files[0]);
    formData.append('title', 'Upcoming Event');

    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert('Banner uploaded successfully!');
            loadBanners();
        } else {
            alert('Upload failed.');
        }
    } catch (e) {
        console.error(e);
        alert('Error uploading banner');
    }
    input.value = ''; // Reset input
}

async function deleteBanner(id) {
    if (confirm('Delete this event banner?')) {
        await fetch(`/api/events/${id}`, { method: 'DELETE' });
        loadBanners();
    }
}

// ===== PROFILE PICTURE UPLOAD =====
async function uploadProfilePic(input) {
    if (!input.files || !input.files[0]) return;
    
    const formData = new FormData();
    formData.append('profilePic', input.files[0]);

    try {
        const response = await fetch('/api/settings/profile-pic', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('adminProfilePreview').src = data.imageUrl;
            // Also update the sidebar profile image if it exists
            const sidebarImg = document.querySelector('.admin-profile-section img');
            if (sidebarImg) sidebarImg.src = data.imageUrl;
            
            alert('Profile picture updated successfully!');
        } else {
            alert('Upload failed.');
        }
    } catch (e) {
        console.error(e);
        alert('Error uploading profile picture');
    }
    input.value = ''; // Reset input
}

// ===== SETTINGS =====
async function loadSettings() {
    const response = await fetch('/api/settings');
    const settings = await response.json();
    if (settings.storeName) document.getElementById('storeName').value = settings.storeName;
    if (settings.supportEmail) document.getElementById('supportEmail').value = settings.supportEmail;
    if (settings.whatsappNumber) document.getElementById('whatsappNumber').value = settings.whatsappNumber;
    if (settings.autoTopup !== undefined) document.getElementById('autoTopup').value = settings.autoTopup ? 'true' : 'false';
    if (settings.adminProfilePic) {
        const preview = document.getElementById('adminProfilePreview');
        if (preview) preview.src = settings.adminProfilePic;
        
        const sidebarImg = document.querySelector('.admin-profile-section img');
        if (sidebarImg) sidebarImg.src = settings.adminProfilePic;
    }

    if (settings.gameIcons) {
        for (const [gameId, url] of Object.entries(settings.gameIcons)) {
            const preview = document.getElementById(`icon-${gameId}-preview`);
            if (preview) preview.src = url;
        }
    }
    
    if (settings.paymentMethodsBanner) {
        const preview = document.getElementById('paymentMethodsPreview');
        if (preview) preview.src = settings.paymentMethodsBanner;
    }
}

function triggerIconUpload(gameId) {
    document.getElementById('currentUploadingGameId').value = gameId;
    document.getElementById('gameIconInput').click();
}

async function uploadGameIcon(input) {
    if (!input.files || !input.files[0]) return;
    const gameId = document.getElementById('currentUploadingGameId').value;
    
    const formData = new FormData();
    formData.append('gameIcon', input.files[0]);
    formData.append('gameId', gameId);

    try {
        const response = await fetch('/api/settings/game-icon', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            const data = await response.json();
            const preview = document.getElementById(`icon-${gameId}-preview`);
            if (preview) preview.src = data.imageUrl;
            alert(`✅ ${gameId} icon updated successfully!`);
        } else {
            const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
            alert(`❌ Upload failed: ${errData.error || response.statusText}`);
        }
    } catch (e) {
        console.error(e);
        alert('Error uploading game icon');
    }
    input.value = ''; // Reset input
}

async function uploadPaymentBanner(input) {
    if (!input.files || !input.files[0]) return;
    
    const formData = new FormData();
    formData.append('paymentBanner', input.files[0]);

    try {
        const response = await fetch('/api/settings/payment-methods', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('paymentMethodsPreview').src = data.imageUrl;
            alert('✅ Payment methods banner updated successfully!');
        } else {
            alert('❌ Upload failed.');
        }
    } catch (e) {
        console.error(e);
        alert('Error uploading payment methods banner');
    }
    input.value = ''; // Reset input
}

async function saveSettings() {
    const settings = {
        storeName: document.getElementById('storeName').value,
        supportEmail: document.getElementById('supportEmail').value,
        whatsappNumber: document.getElementById('whatsappNumber').value,
        autoTopup: document.getElementById('autoTopup').value === 'true'
    };
    await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    alert('Global settings applied successfully.');
}

// Enter key for login
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.getElementById('loginOverlay').style.display !== 'none') {
        checkLogin();
    }
});
