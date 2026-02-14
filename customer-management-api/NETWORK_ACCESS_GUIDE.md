# Network Access Configuration

## ✅ Configuration Complete

Your Customer Management API is now accessible via local network IP address!

### Access URLs

#### From This Computer:
- **Localhost:** `http://localhost/customer-management-api/api`
- **Local IP:** `http://192.168.1.4/customer-management-api/api`
- **Loopback:** `http://127.0.0.1/customer-management-api/api`

#### From Other Devices on Your Network:
- **Base URL:** `http://192.168.1.4/customer-management-api/api`
- **Health Check:** `http://192.168.1.4/customer-management-api/api/health`
- **Login:** `http://192.168.1.4/customer-management-api/api/auth/login`

---

## Quick Test

### 1. From Your Computer
Open browser or use curl:
```bash
# Test health endpoint
curl http://192.168.1.4/customer-management-api/api/health

# Test login
curl -X POST http://192.168.1.4/customer-management-api/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"mobile_number\":\"9999999999\",\"password\":\"Admin@123\"}"
```

### 2. From Another Device (Phone, Tablet, Another Computer)
Open browser and navigate to:
```
http://192.168.1.4/customer-management-api/api/health
```

You should see:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Customer Management API is running",
    "timestamp": "2026-02-14 XX:XX:XX"
  }
}
```

---

## Configuration Applied

### 1. Apache Virtual Host Configuration
**File:** `C:\xampp\apache\conf\extra\httpd-vhosts.conf`

Added virtual host for IP address `192.168.1.4`:
```apache
<VirtualHost 192.168.1.4:80>
    ServerAdmin webmaster@localhost
    DocumentRoot "C:/xampp/htdocs"
    ServerName 192.168.1.4
    
    <Directory "C:/xampp/htdocs">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    <Directory "C:/xampp/htdocs/customer-management-api">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 2. Apache Listen Configuration
Apache is configured to listen on all network interfaces:
```apache
Listen 80
```
This means Apache accepts connections from:
- localhost (127.0.0.1)
- Local IP (192.168.1.4)
- Any other network interface

### 3. CORS Configuration
Already configured to allow all origins (`*`):
```php
'origin' => '*'
```

---

## Troubleshooting

### Can't Access from Other Devices?

#### 1. Check Windows Firewall
Allow incoming connections on port 80:

**Option A: Using PowerShell (Administrator)**
```powershell
New-NetFirewallRule -DisplayName "Apache HTTP Server" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

**Option B: Using GUI**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `80` → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name it "Apache HTTP" → Finish

**Option C: Quick Command (Administrator)**
```powershell
netsh advfirewall firewall add rule name="Apache HTTP" dir=in action=allow protocol=TCP localport=80
```

#### 2. Verify Apache is Running
Check in XAMPP Control Panel that Apache is running with a green indicator.

#### 3. Check Your IP Address
Your IP might change if using DHCP:
```powershell
ipconfig | Select-String "IPv4"
```

#### 4. Verify Network Connectivity
From another device, ping your computer:
```bash
ping 192.168.1.4
```

#### 5. Check Router Settings
Some routers have "AP Isolation" or "Client Isolation" enabled which prevents devices from communicating with each other. Disable this in your router settings.

---

## Security Considerations

### For Development (Current Setup)
✅ Allows all CORS origins  
✅ No additional authentication on network level  
✅ Good for testing and development

### For Production
When deploying to production, consider:

1. **Restrict CORS Origins**
   Update `.env`:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Use HTTPS**
   - Configure SSL certificate
   - Update virtual host for port 443
   - Redirect HTTP to HTTPS

3. **Firewall Rules**
   - Allow only specific IP ranges
   - Use VPN for remote access

4. **API Keys/Authentication**
   - Already implemented ✅
   - JWT tokens expire after 24 hours

---

## Testing Network Access

Run the network access test:
```powershell
cd C:\xampp\htdocs\customer-management-api
php test_network_access.php
```

Expected output:
```
✓ Localhost: http://localhost/customer-management-api/api/health
✓ IPv4: http://192.168.1.4/customer-management-api/api/health
✓ 127.0.0.1: http://127.0.0.1/customer-management-api/api/health
✓ Login successful via IP address
```

---

## Mobile App Configuration

Update your mobile app API base URL:

**Before:**
```javascript
const API_BASE_URL = 'http://localhost/customer-management-api/api';
```

**After:**
```javascript
const API_BASE_URL = 'http://192.168.1.4/customer-management-api/api';
```

Or use environment variable:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.4/customer-management-api/api';
```

---

## Dynamic IP Detection

If your IP address changes frequently, you can create a script to detect it:

```php
<?php
// get_api_url.php
$localIP = gethostbyname(gethostname());
header('Content-Type: application/json');
echo json_encode([
    'api_url' => "http://{$localIP}/customer-management-api/api",
    'ip' => $localIP
]);
```

---

## Status: ✅ Ready for Network Access

Your API is now accessible from:
- ✅ Your computer (localhost)
- ✅ Other devices on the same network (192.168.1.4)
- ✅ Mobile apps on the same WiFi network

**Next Steps:**
1. ✅ Test from another device on your network
2. ⚠️ Add Windows Firewall rule if needed (see Troubleshooting)
3. ✅ Update mobile app configuration with network IP

---

**Last Updated:** February 14, 2026  
**Local IP Address:** 192.168.1.4  
**API Status:** Operational
