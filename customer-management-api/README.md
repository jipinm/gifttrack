# Customer Management API

PHP RESTful API for Customer & Gift Management System

## 🌐 Network Access

**API is accessible via:**
- **Localhost:** `http://localhost/gifttrack/customer-management-api/api`
- **Local Network IP:** `http://192.168.1.4/gifttrack/customer-management-api/api`

📖 **See [NETWORK_ACCESS_GUIDE.md](NETWORK_ACCESS_GUIDE.md) for complete setup and troubleshooting**

Quick test from any device on your network:
```
http://192.168.1.4/gifttrack/customer-management-api/api/health
```

---

## Phase 1 Setup - Completed ✅

### What's Been Done:

1. **Project Structure Created**
   - All directories created (api/, config/, middleware/, utils/, models/, database/)
   - Organized folder structure for maintainability

2. **Configuration Files**
   - `.env` - Environment variables
   - `config/database.php` - Database configuration
   - `config/jwt.php` - JWT token settings
   - `config/cors.php` - CORS policy
   - `.gitignore` - Git exclusions

3. **Core Utility Classes**
   - `utils/Database.php` - PDO database connection with singleton pattern
   - `utils/JWT.php` - JWT token generation, validation, and decoding
   - `utils/Response.php` - Standardized JSON API responses
   - `utils/Validator.php` - Input validation and sanitization

4. **Middleware**
   - `middleware/cors.php` - CORS headers handling
   - `middleware/auth.php` - JWT authentication
   - `middleware/role.php` - Role-based access control

5. **Composer Dependencies Installed**
   - firebase/php-jwt (v6.11.1) ✅
   - vlucas/phpdotenv (v5.6.3) ✅

6. **Additional Files**
   - `bootstrap.php` - Application initialization
   - `.htaccess` - URL rewriting and security
   - `api/index.php` - Test endpoint

## XAMPP Configuration Required

### Option 1: Simple Setup (Recommended for Quick Start)

1. **Copy project to XAMPP htdocs:**
   ```powershell
   # Create symlink or copy folder
   New-Item -ItemType SymbolicLink -Path "C:\xampp\htdocs\customer-management-api" -Target "E:\pwa\customer-management-api"
   ```

2. **Test API:**
   - Start XAMPP (Apache + MySQL)
   - Open browser: `http://localhost/customer-management-api/api/`
   - You should see JSON response

### Option 2: Virtual Host Setup (Production-like)

1. **Edit Apache config:**
   ```powershell
   # Open httpd-vhosts.conf
   notepad C:\xampp\apache\conf\extra\httpd-vhosts.conf
   ```

2. **Add virtual host entry:**
   ```apache
   <VirtualHost *:80>
       ServerName customer-api.local
       DocumentRoot "E:/pwa/customer-management-api"
       
       <Directory "E:/pwa/customer-management-api">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog "logs/customer-api-error.log"
       CustomLog "logs/customer-api-access.log" common
   </VirtualHost>
   ```

3. **Edit Windows hosts file:**
   ```powershell
   # Run as Administrator
   notepad C:\Windows\System32\drivers\etc\hosts
   
   # Add this line:
   127.0.0.1 customer-api.local
   ```

4. **Restart Apache**
   - Stop Apache in XAMPP
   - Start Apache in XAMPP

5. **Test:**
   - Open browser: `http://customer-api.local/api/`

## Generate Secure JWT Secret

For production, generate a secure random secret:

```powershell
# Run in PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Copy the output and update `.env`:
```
JWT_SECRET=<paste-generated-secret-here>
```

## Test API Endpoint

The test endpoint is ready at:
- Simple: `http://localhost/customer-management-api/api/`
- Virtual host: `http://customer-api.local/api/`

Expected response:
```json
{
    "success": true,
    "data": {
        "message": "Customer Management API is running",
        "version": "1.0.0",
        "timestamp": "2026-02-04 12:00:00",
        "environment": "development"
    }
}
```

## Next Steps

Choose one of the XAMPP configuration options above, then proceed to:

**Phase 2: Database Setup**
- Create MySQL database
- Create tables (users, customers, gifts)
- Add seed data
- See: `E:\pwa\PHP_BACKEND_TASK_LIST.md` Phase 2

## Project Files Summary

```
customer-management-api/
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── .htaccess              # Apache rewrite rules
├── bootstrap.php          # App initialization
├── composer.json          # PHP dependencies
├── composer.lock          # Locked dependency versions
├── vendor/                # Composer packages
├── api/
│   └── index.php         # Test endpoint
├── config/
│   ├── database.php      # DB configuration
│   ├── jwt.php           # JWT settings
│   └── cors.php          # CORS policy
├── middleware/
│   ├── auth.php          # Authentication
│   ├── cors.php          # CORS headers
│   └── role.php          # Access control
├── utils/
│   ├── Database.php      # DB connection class
│   ├── JWT.php           # JWT token handler
│   ├── Response.php      # API responses
│   └── Validator.php     # Input validation
├── models/               # (To be created in Phase 3)
├── database/
│   └── migrations/       # (SQL files in Phase 2)
└── logs/                 # Error & access logs
```

## Troubleshooting

### "Call to undefined function getallheaders()"
- Restart Apache
- Check PHP version (should be 8.1+)

### "Class 'Dotenv\Dotenv' not found"
- Run: `composer install`

### "Access forbidden"
- Check folder permissions
- Verify virtual host configuration

### API returns 404
- Check Apache mod_rewrite is enabled
- Verify .htaccess file exists
- Check DocumentRoot path is correct
