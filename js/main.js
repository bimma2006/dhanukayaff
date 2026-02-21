// ===== GLOBAL STATE =====
let currentPlayerId = "";
let currentPlayerName = "";
let selectedPack = null;

// ===== DEFAULT DIAMOND PACKS (EMPTY - MANAGED BY SERVER) =====
const defaultPacks = [];

let allPacks = [];
let currentCategory = 'diamonds';

// Slider State
let currentSlide = 0;
let eventBanners = [];
let sliderInterval;

// Order Polling
let pollingInterval;
let currentProcessingOrderId;

// ===== CUSTOMER AUTHENTICATION =====
let currentAuthenticatedUser = JSON.parse(localStorage.getItem('customerAccount')) || null;

function showAuth(game) {
  const selector = document.getElementById("gameSelector");
  const authSection = document.getElementById("authSection");
  const form = document.getElementById("idInputForm");
  const gameNameDisplay = document.getElementById("selectedGameName");

  // Update game name display
  if (gameNameDisplay) {
      const names = {
          'freefire': 'Free Fire Top Up',
          'freefiremax': 'Free Fire MAX Top Up',
          'freefireindo': 'Free Fire Indonesia Top Up',
          'cod': 'Call of Duty Top Up',
          'bloodstrike': 'Blood Strike Top Up'
      };
      gameNameDisplay.textContent = names[game] || 'Game Top Up';
  }

  // Update active status in selector grid
  document.querySelectorAll('.game-item').forEach(item => {
      item.classList.remove('active');
      // Fix: Check if the onclick attribute contains the game string
      const onclickAttr = item.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes(`'${game}'`)) {
          item.classList.add('active');
      }
  });

  if (currentAuthenticatedUser) {
    if (selector) selector.style.display = "none";
    showIdForm();
    return;
  }
  
  if (selector) selector.style.display = "none";
  if (form) form.style.display = "none";
  
  if (authSection) {
      authSection.style.display = "block";
      authSection.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function refreshAuthUI() {
    const customerBadge = document.getElementById("customerBadge");
    const accountIdText = document.getElementById("accountIdText");
    
    if (currentAuthenticatedUser) {
        if (customerBadge) customerBadge.style.display = "flex";
        if (accountIdText) accountIdText.textContent = currentAuthenticatedUser.identifier;
    } else {
        if (customerBadge) customerBadge.style.display = "none";
    }
}

function logoutCustomer() {
    localStorage.removeItem('customerAccount');
    currentAuthenticatedUser = null;
    alert("👋 Logged out successfully!");
    location.reload();
}

function toggleAuthMode(mode) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  
  if (mode === 'signup') {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  } else {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  }
}

async function handleLogin() {
  const identifier = document.getElementById("loginIdentifier").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  
  if (!identifier || !password) return alert("⚠️ Please enter both credentials");
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    
    if (res.ok) {
        currentAuthenticatedUser = data.user;
        localStorage.setItem('customerAccount', JSON.stringify(data.user));
        refreshAuthUI();
        showIdForm();
    } else {
        alert("❌ Login failed: " + data.error);
    }
  } catch (e) { alert("❌ System error during login"); }
}

async function handleSignup() {
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const nic = document.getElementById("signupNIC").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  
  if (!username || !password || !email || !phone || !nic) return alert("⚠️ Please fill all fields");

  // Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return alert("⚠️ Please enter a valid Email Address");

  // Sri Lankan Phone Validation (07... or 947...)
  const phoneRegex = /^(0|94)?[7][0-9]{8}$/;
  if (!phoneRegex.test(phone)) return alert("⚠️ Please enter a valid Sri Lankan Phone Number (e.g., 0712345678)");

  // Sri Lankan NIC Validation
  const nicRegex = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;
  if (!nicRegex.test(nic)) return alert("⚠️ Please enter a valid Sri Lankan NIC (9 digits + V/X OR 12 digits)");
  
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: username, username, email, phone, nic, password })
    });
    const data = await res.json();
    
    if (res.ok) {
        alert("✅ Account created! Now please login.");
        document.getElementById("signupUsername").value = "";
        document.getElementById("signupEmail").value = "";
        document.getElementById("signupPhone").value = "";
        document.getElementById("signupNIC").value = "";
        document.getElementById("signupPassword").value = "";
        toggleAuthMode('login');
    } else {
        alert("❌ SignUp failed: " + data.error);
    }
  } catch (e) { alert("❌ System error during signup"); }
}

function showIdForm() {
  const authSection = document.getElementById("authSection");
  const form = document.getElementById("idInputForm");
  const selector = document.getElementById("gameSelector");

  if (selector) selector.style.display = "none";
  if (authSection) authSection.style.display = "none";
  if (form) {
    form.style.display = "block";
    document.getElementById("playerId").focus();
    setTimeout(() => {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}

// Keep old toggleIdInput for legacy but bridge it
function toggleIdInput(game) {
  showAuth(game);
}

// ===== LOAD DIAMOND PACKS FROM SERVER =====
async function loadDiamondPacks() {
  const packsContainer = document.getElementById("diamondPacks");
  if (!packsContainer) return;
  
  // Only show loader if we don't have packs yet
  if (allPacks.length === 0) {
      packsContainer.innerHTML = '<div class="loader">⌛ Loading packs...</div>';
  }

  try {
    const response = await fetch('/api/packs');
    allPacks = await response.json();
    displayCategoryPacks(currentCategory);
  } catch (e) {
    console.error("Error loading packs:", e);
    packsContainer.innerHTML = '<p style="color: var(--danger);">Failed to load packs.</p>';
  }
}

function filterPacks(category, event) {
    currentCategory = category;
    
    // Update active tab UI
    document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
    if (event) event.target.classList.add('active');
    
    displayCategoryPacks(category);
}

function displayCategoryPacks(category) {
    const packsContainer = document.getElementById("diamondPacks");
    if (!packsContainer) return;

    const filtered = allPacks.filter(p => p.category === category);
    
    packsContainer.innerHTML = "";
    if (filtered.length === 0) {
      packsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem; grid-column: 1/-1;">No packs available in this category.</p>';
      return;
    }

    filtered.forEach((pack) => {
      const packElement = document.createElement("div");
      packElement.className = `diamond-pack ${pack.category || 'diamonds'} ${pack.popular ? "popular" : ""}`;
      packElement.onclick = (event) => selectPack(pack, event);

      const categoryIcon = pack.category === 'membership' ? '🎫' : (pack.category === 'evo' ? '🔥' : '💎');
      const amountLabel = typeof pack.diamonds === 'number' ? `${pack.diamonds} Diamonds` : pack.diamonds;

      packElement.innerHTML = `
                ${pack.popular ? '<div class="pack-badge">POPULAR</div>' : ""}
                <div class="pack-icon">
                    ${pack.imageUrl ? `<img src="${pack.imageUrl}" style="width: 130px; height: 130px; object-fit: contain; mix-blend-mode: multiply; filter: contrast(110%) brightness(110%);">` : `<span>${categoryIcon}</span>`}
                </div>
                <div class="pack-amount">${amountLabel}</div>
                ${pack.bonus > 0 ? `<div class="pack-bonus">+${pack.bonus} Bonus</div>` : '<div class="pack-bonus">&nbsp;</div>'}
                <div class="pack-price">${pack.price}</div>
            `;

      packsContainer.appendChild(packElement);
    });
}

// ===== LOAD SETTINGS FROM SERVER =====
async function applySettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        if (settings.storeName) {
            document.title = `${settings.storeName} - Free Fire Top-Up`;
            document.querySelectorAll('.logo h1, .footer-section h1, .brand-main-title').forEach(el => el.textContent = settings.storeName);
            document.querySelectorAll('.gradient-text, .store-name-display').forEach(el => el.textContent = settings.storeName);
        }

        if (settings.adminProfilePic) {
            // Update all instances of the admin mascot/profile pic
            const adminImages = [
                '.profile-img-3d', 
                '.trust-mascot-box img', 
                '.mini-shell-box img', 
                '.player-avatar img'
            ];
            adminImages.forEach(selector => {
                document.querySelectorAll(selector).forEach(img => {
                    img.src = settings.adminProfilePic;
                });
            });
        }

        if (settings.gameIcons) {
            for (const [gameId, url] of Object.entries(settings.gameIcons)) {
                const img = document.getElementById(`icon-${gameId}`);
                if (img) {
                    img.src = url;
                    // Remove filters if custom icon is set to prevent double coloring
                    img.style.filter = 'none';
                    img.style.transform = 'none';
                }
            }
        }

        if (settings.paymentMethodsBanner) {
            const img = document.getElementById('payment-methods-img');
            if (img) img.src = settings.paymentMethodsBanner;
        }
    } catch(e) {
        console.error("Settings error:", e);
    }
}


applySettings();

// ===== EVENT SLIDER LOGIC =====
async function loadEventBanners() {
    try {
        const response = await fetch('/api/events');
        eventBanners = await response.json();
        
        const slider = document.getElementById('eventsSlider');
        const dots = document.getElementById('sliderDots');
        if (!slider || !dots) return;

        if (eventBanners.length === 0) {
            document.querySelector('.events-slider-section').style.display = 'none';
            return;
        }

        slider.innerHTML = eventBanners.map(event => `
            <div class="slide">
                <img src="${event.imageUrl}" alt="${event.title}">
            </div>
        `).join('');

        dots.innerHTML = eventBanners.map((_, i) => `
            <div class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>
        `).join('');

        startAutoSlider();
    } catch (e) {
        console.error('Error loading event banners:', e);
    }
}

function moveSlider(direction) {
    clearInterval(sliderInterval);
    currentSlide = (currentSlide + direction + eventBanners.length) % eventBanners.length;
    updateSlider();
    startAutoSlider();
}

function goToSlide(index) {
    clearInterval(sliderInterval);
    currentSlide = index;
    updateSlider();
    startAutoSlider();
}

function updateSlider() {
    const slider = document.getElementById('eventsSlider');
    const dots = document.querySelectorAll('.dot');
    if (!slider) return;

    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function startAutoSlider() {
    sliderInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % eventBanners.length;
        updateSlider();
    }, 5000);
}

// Updated selectPack to handle event correctly
function selectPack(pack, event) {
  // Remove previous selection
  document.querySelectorAll(".diamond-pack").forEach((el) => {
    el.classList.remove("selected");
  });

  // Mark as selected
  if (event) {
    event.currentTarget.classList.add("selected");
  }
  selectedPack = pack;

  // Update summary
  const amountLabel = typeof pack.diamonds === 'number' ? `${pack.diamonds} Diamonds` : pack.diamonds;
  
  if (document.getElementById("selectedPackLabel")) {
    document.getElementById("selectedPackLabel").textContent = 
        `${amountLabel} ${pack.bonus > 0 ? `(+${pack.bonus} Bonus)` : ""}`;
  }
  if (document.getElementById("selectedPriceLabel")) {
    document.getElementById("selectedPriceLabel").textContent = pack.price;
  }

  // Show order action section
  const orderAction = document.getElementById("orderAction");
  if (orderAction) {
    orderAction.style.display = "block";
    // Short delay to ensure browser handles display block before scroll
    setTimeout(() => {
        orderAction.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}

// ===== PROCESS WHATSAPP ORDER (Auto Pre-Fills Message) =====
async function processWhatsAppOrder() {
  if (!selectedPack || !currentPlayerId) {
    alert("⚠️ Please verify your Player ID and select a diamond pack");
    return;
  }

  const packName = typeof selectedPack.diamonds === 'number' ? `${selectedPack.diamonds} Diamonds` : selectedPack.diamonds;

  try {
    // 1. Save order to admin panel
    const orderData = {
      userIdentifier: currentAuthenticatedUser?.identifier || null,
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      pack: selectedPack,
      paymentMethod: 'WhatsApp',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (response.ok) {
      const data = await response.json();
      currentProcessingOrderId = data.order.id;

      // 2. Build WhatsApp message
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();
      const rawNumber = (settings.whatsappNumber || '94770389537').replace(/[\s\+\-()]/g, '');

      const waMessage = [
        'NEW ORDER - Danukaya Top Up',
        '',
        'Order ID: #' + data.order.id,
        'Player Name: ' + currentPlayerName,
        'Player ID: ' + currentPlayerId,
        'Pack: ' + packName,
        'Price: ' + selectedPack.price,
        '',
        'Please confirm and process my order. Thank you!'
      ].join('\n');

      const waUrl = 'https://wa.me/' + rawNumber + '?text=' + encodeURIComponent(waMessage);

      // 3. Open WhatsApp with pre-filled message
      window.open(waUrl, '_blank');

      // 4. Show processing modal
      showProcessingModal(data.order);
      startPollingStatus(currentProcessingOrderId);
    }
  } catch (e) {
    console.error("Order process failed", e);
    alert("⚠️ Failed to initiate order. Please try again.");
  }

  resetFormWithDelay();
}

// ===== PROCESS TELEGRAM ORDER =====

async function processTelegramOrder() {
  if (!selectedPack || !currentPlayerId) {
    alert("⚠️ Please verify your Player ID and select a diamond pack");
    return;
  }

  const packName = typeof selectedPack.diamonds === 'number' ? `${selectedPack.diamonds} Diamonds` : selectedPack.diamonds;
  
  // Format requested: /id [ID] [Pack Name]
  const message = `/id ${currentPlayerId} ${packName}`;
  
  // 1. Copy to clipboard automatically (Most reliable workaround for Telegram)
  try {
    navigator.clipboard.writeText(message);
    // Removed blocking alert to allow browser redirect to work better
  } catch (err) {
    console.warn("Clipboard copy failed", err);
  }

  // Using a more universal Telegram link that works well with browsers
  const telegramUrl = `https://t.me/+94778380753`;

  try {
    // Record the order in admin panel
    const orderData = {
      userIdentifier: currentAuthenticatedUser?.identifier || null,
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      pack: selectedPack,
      paymentMethod: 'Telegram',
      timestamp: new Date().toISOString(),
    };
    
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    
    if (response.ok) {
        const data = await response.json();
        currentProcessingOrderId = data.order.id;
        
        // Step 1: Open Telegram instantly
        window.open(telegramUrl, '_blank');

        // Step 2: Auto WhatsApp message to admin
        try {
            const settingsRes = await fetch('/api/settings');
            const settings = await settingsRes.json();
            const rawNumber = (settings.whatsappNumber || '').replace(/[\s\+\-()]/g, '');
            
            if (rawNumber) {
                const waMessage = [
                    'NEW ORDER RECEIVED!',
                    '',
                    'Order ID: #' + data.order.id,
                    'Time: ' + new Date().toLocaleString('en-LK'),
                    '',
                    'Player Name: ' + currentPlayerName,
                    'Player ID: ' + currentPlayerId,
                    'Pack: ' + packName,
                    'Price: ' + selectedPack.price,
                    'Payment: Telegram',
                    '',
                    'Please process this order!'
                ].join('\n');

                const waUrl = 'https://wa.me/' + rawNumber + '?text=' + encodeURIComponent(waMessage);
                console.log('WhatsApp URL:', waUrl);
                setTimeout(() => { window.open(waUrl, '_blank'); }, 800);
                console.log('WhatsApp alert sent to: +' + rawNumber);
            }
        } catch (waErr) {
            console.warn('WhatsApp auto-open failed:', waErr);
        }
        
        // Show "Processing" modal
        showProcessingModal(data.order);
        
        // Start polling for status update
        startPollingStatus(currentProcessingOrderId);
    }
  } catch (e) { 
    console.error("Order process failed", e);
    alert("⚠️ Failed to initiate order. Please try again.");
  }

  resetFormWithDelay();
}

// ===== REAL-TIME STATUS POLLING =====
function startPollingStatus(orderId) {
    if (pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'completed') {
                    clearInterval(pollingInterval);
                    updateModalToSuccess();
                }
            }
        } catch (e) {
            console.error("Polling error:", e);
        }
    }, 5000); // Poll every 5 seconds
}

function updateModalToSuccess() {
    const modal = document.getElementById('successModal');
    const title = modal.querySelector('.modal-title');
    const icon = modal.querySelector('.modal-icon');
    const text = modal.querySelector('.modal-text');
    const statusValue = modal.querySelector('.modal-detail-value[style*="color: var(--warning)"]');
    
    title.innerText = "Order Complete!";
    icon.innerText = "✅";
    icon.style.filter = "drop-shadow(0 0 20px rgba(0, 217, 163, 0.5))";
    text.innerText = "Congratulations! Your diamonds have been successfully delivered to your account.";
    
    if (statusValue) {
        statusValue.innerText = "Success / Delivered";
        statusValue.style.color = "var(--primary)";
    }
    
    // Play success sound (optional enhancement)
    // const audio = new Audio('path/to/success-chime.mp3');
    // audio.play().catch(() => {});
}

// ===== VERIFY PLAYER ID =====
async function verifyPlayerId() {
  const playerIdInput = document.getElementById("playerId");
  const playerId = playerIdInput.value.trim();
  const verifyBtn = document.getElementById("verifyBtn");
  const btnText = verifyBtn.querySelector(".btn-text");
  const btnLoader = verifyBtn.querySelector(".btn-loader");

  // Validation
  if (!playerId) {
    alert("⚠️ Please enter your Player ID");
    return;
  }

  if (playerId.length < 8 || playerId.length > 12) {
    alert("⚠️ Player ID must be between 8-12 digits");
    return;
  }

  // Show loading
  verifyBtn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline-block";

  try {
    // Call backend API to verify player
    const response = await fetch("/api/verify-player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerId }),
    });

    let data;
    if (response.ok) {
      data = await response.json();
    } else {
      // If server returns error, use fallback to not block user
      data = { success: true, playerName: `Player_${playerId}` };
    }

    if (data && (data.playerName || data.nickname || data.basicInfo)) {
      const playerName = data.playerName || (data.basicInfo ? data.basicInfo.nickname : data.nickname);
      currentPlayerId = playerId;
      currentPlayerName = playerName;

      // Fill basic details
      document.getElementById("playerName").textContent = playerName;
      document.getElementById("playerIdDisplay").textContent = `ID: ${playerId}`;
      
      // Fill extended details if available (from server.js info object)
      if (document.getElementById("playerLevel")) {
        document.getElementById("playerLevel").textContent = data.level || (data.basicInfo ? data.basicInfo.level : '-');
      }
      if (document.getElementById("playerRegion")) {
        document.getElementById("playerRegion").textContent = data.region || (data.basicInfo ? data.basicInfo.region : '-');
      }
      if (document.getElementById("playerRank")) {
        document.getElementById("playerRank").textContent = data.rankPoints || (data.basicInfo ? data.basicInfo.rankingPoints : '-');
      }
      if (document.getElementById("playerClan")) {
        document.getElementById("playerClan").textContent = data.clanName || (data.clanBasicInfo ? data.clanBasicInfo.clanName : 'No Clan');
      }
      if (document.getElementById("playerSignature")) {
        const sig = data.signature || (data.socialInfo ? data.socialInfo.signature : '');
        document.getElementById("playerSignature").textContent = sig ? `"${sig}"` : "";
      }

      document.getElementById("playerInfo").style.display = "flex";
      document.getElementById("idInputForm").style.display = "none";

      document.getElementById("step2").style.display = "block";
      loadDiamondPacks();
      document.getElementById("step2").scrollIntoView({ behavior: "smooth" });
    } else {
      throw new Error("Verification failed");
    }
  } catch (error) {
    console.error("Verification error:", error);
    
    // Final fallback to ensure user is NEVER blocked
    currentPlayerId = playerId;
    currentPlayerName = `Player_${playerId}`;
    document.getElementById("playerName").textContent = currentPlayerName;
    document.getElementById("playerIdDisplay").textContent = `ID: ${playerId}`;
    document.getElementById("playerInfo").style.display = "flex";
    document.getElementById("idInputForm").style.display = "none";
    document.getElementById("step2").style.display = "block";
    loadDiamondPacks();
    document.getElementById("step2").scrollIntoView({ behavior: "smooth" });
  } finally {
    // Hide loading
    verifyBtn.disabled = false;
    btnText.style.display = "inline-block";
    btnLoader.style.display = "none";
  }
}

// ===== SELECT DIAMOND PACK =====


// Old confirmPayment removed in favor of processWhatsAppOrder

// ===== MODAL LOGIC =====
function showProcessingModal(order) {
    const modal = document.getElementById('successModal');
    const details = document.getElementById('modalDetails');
    const title = modal.querySelector('.modal-title');
    const icon = modal.querySelector('.modal-icon');
    const text = modal.querySelector('.modal-text');
    
    // Change to Processing state - WhatsApp
    title.innerText = "Order Sent via WhatsApp!";
    icon.innerText = "💬";
    icon.style.filter = "drop-shadow(0 0 20px rgba(37, 211, 102, 0.6))";
    text.innerText = "WhatsApp open වෙලා ඔබේ order details automatically type වෙලා ඇත. ✓ Send button press කරන්නම යි!";

    const amountLabel = typeof order.pack.diamonds === 'number' ? `${order.pack.diamonds} Diamonds` : order.pack.diamonds;

    details.innerHTML = `
        <div class="modal-detail-row">
            <span class="modal-detail-label">Pack:</span>
            <span class="modal-detail-value" style="background: rgba(37, 211, 102, 0.1); padding: 5px 10px; border-radius: 5px; color: #25D366; font-weight: bold;">${amountLabel}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Player ID:</span>
            <span class="modal-detail-value">${order.playerId}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Request ID:</span>
            <span class="modal-detail-value">#${order.id}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Status:</span>
            <span class="modal-detail-value" style="color: var(--warning)">Waiting for Confirmation</span>
        </div>
    `;

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('successModal').classList.remove('active');
    if (pollingInterval) clearInterval(pollingInterval);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== RESET FORM =====
function resetForm() {
  document.getElementById("playerId").value = "";
  document.getElementById("playerInfo").style.display = "none";
  document.getElementById("step2").style.display = "none";
  if (document.getElementById("orderAction")) document.getElementById("orderAction").style.display = "none";
  if (document.getElementById("gameSelector")) document.getElementById("gameSelector").style.display = "flex";
  if (document.getElementById("idInputForm")) document.getElementById("idInputForm").style.display = "none";

  currentPlayerId = "";
  currentPlayerName = "";
  selectedPack = null;
}

function resetFormWithDelay() {
  setTimeout(() => {
    document.getElementById("playerId").value = "";
    document.getElementById("playerInfo").style.display = "none";
    document.getElementById("step2").style.display = "none";
    if (document.getElementById("orderAction")) document.getElementById("orderAction").style.display = "none";
    if (document.getElementById("gameSelector")) document.getElementById("gameSelector").style.display = "flex";
    if (document.getElementById("idInputForm")) document.getElementById("idInputForm").style.display = "none";

    currentPlayerId = "";
    currentPlayerName = "";
    selectedPack = null;
  }, 500);
}

// ===== SMOOTH SCROLL FOR NAVIGATION =====
document.addEventListener("DOMContentLoaded", () => {
  refreshAuthUI();
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Update active nav link on scroll
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });



  // Initialize automatic account creation
  initUser();
  
  // Load event banners
  loadEventBanners();
  
  // Apply settings
  applySettings();
});

// ===== AUTOMATIC ACCOUNT CREATION =====
function initUser() {
  let userId = localStorage.getItem("danukaya_user_id");

  if (!userId) {
    // Generate a unique 8-digit User ID
    userId = "USR" + Math.floor(10000000 + Math.random() * 90000000);
    localStorage.setItem("danukaya_user_id", userId);
    console.log("🆕 New account created:", userId);
  }

  // Display User ID in header
  const userBadge = document.getElementById("userBadge");
  const userIdDisplay = document.getElementById("userIdDisplay");

  if (userBadge && userIdDisplay) {
    userIdDisplay.textContent = `UID: ${userId.replace("USR", "")}`;
    userBadge.style.display = "flex";
  }

  // Load extensions
  loadExtensions();
}

// ===== LOAD EXTENSIONS =====
function loadExtensions() {
  const extensions = JSON.parse(localStorage.getItem("extensions")) || [];
  extensions.forEach((ext) => {
    if (ext.status === "active" && ext.code) {
      try {
        if (ext.code.startsWith("http")) {
          const script = document.createElement("script");
          script.src = ext.code;
          document.head.appendChild(script);
        } else {
          const script = document.createElement("script");
          script.textContent = ext.code;
          document.head.appendChild(script);
        }
        console.log(`🧩 Extension loaded: ${ext.name}`);
      } catch (e) {
        console.error(`❌ Failed to load extension ${ext.name}:`, e);
      }
    }
  });
}

// ===== ENTER KEY & AUTO VERIFY SUPPORT =====
document.addEventListener("DOMContentLoaded", () => {
  const playerIdInput = document.getElementById("playerId");
  if (playerIdInput) {
    // Auto-verify when ID length is likely correct
    playerIdInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val.length >= 8 && val.length <= 12) {
        // Debounce auto-verify
        clearTimeout(window.autoVerifyTimeout);
        window.autoVerifyTimeout = setTimeout(() => {
          if (currentPlayerId !== val) {
            verifyPlayerId();
          }
        }, 1000);
      }
    });

    playerIdInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        verifyPlayerId();
      }
    });
  }
});
