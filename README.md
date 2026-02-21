# 🎮 Danukaya Top Up - Free Fire Diamond Top-Up Center

Professional Free Fire diamond top-up website with automated Garena integration.

## ✨ Features

- ⚡ **Instant Player Verification** - Auto-verify Free Fire player IDs
- 💎 **Diamond Pack Selection** - Multiple pack options with bonus diamonds
- 🔐 **Admin Panel** - Manage orders, packs, and settings
- 🤖 **Auto Top-Up** - Automated Garena/Codashop integration with Puppeteer
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Premium UI** - Modern design inspired by Codashop

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

### 3. Open in Browser

- **Customer Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

## 📁 Project Structure

```
danukaya-top-up/
├── index.html          # Customer-facing page
├── admin.html          # Admin panel
├── server.js           # Backend server with Puppeteer
├── package.json        # Dependencies
├── css/
│   └── style.css       # All styling
├── js/
│   ├── main.js         # Customer functionality
│   └── admin.js        # Admin functionality
└── images/             # Free Fire images (add your own)
```

## 🎯 How It Works

### Customer Flow:

1. Customer enters Free Fire Player ID
2. System verifies ID on Garena/Codashop
3. Customer selects diamond pack
4. Customer chooses payment method
5. Order is created and sent to admin

### Admin Flow:

1. Admin views pending orders
2. Admin confirms payment
3. Admin clicks "Process" to initiate auto top-up
4. Puppeteer automates Garena website
5. Admin marks order as completed

## 🔧 Configuration

### Admin Panel Settings:

- Store name
- Support email
- WhatsApp number
- Auto top-up toggle

### Diamond Packs:

- Add/Edit/Delete packs
- Set prices and bonuses
- Mark popular packs

## 📝 Important Notes

### 🔒 Security:

- Add authentication to admin panel in production
- Use environment variables for sensitive data
- Implement proper payment gateway integration

### 🌐 Deployment:

- Use a process manager like PM2
- Set up SSL certificate
- Configure firewall rules
- Use a database instead of localStorage

### 🤖 Automation:

- Puppeteer runs in non-headless mode by default (for testing)
- Set `headless: true` in server.js for production
- Garena selectors may change - update as needed

## 🛠️ Development Mode

```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

## 📦 Production Deployment

1. Install dependencies: `npm install --production`
2. Set environment variables
3. Update Puppeteer to headless mode
4. Use PM2: `pm2 start server.js --name danukaya-top-up`
5. Set up reverse proxy (Nginx)
6. Configure SSL with Let's Encrypt

## 🎨 Customization

### Colors:

Edit CSS variables in `css/style.css`:

```css
:root {
  --primary: #ff6b35;
  --secondary: #f7931e;
  /* ... */
}
```

### Images:

Add Free Fire images to `images/` folder:

- logo.png
- hero-banner.jpg
- diamond-icon.png

### Branding:

Replace "Danukaya Top Up" with your brand name in:

- index.html
- admin.html
- package.json

## 📞 Support

For issues or questions, contact:

- Email: support@danukayatopup.com
- WhatsApp: +94 XX XXX XXXX

## 📄 License

MIT License - Free to use and modify

---

**Made with ❤️ by Antigravity**
