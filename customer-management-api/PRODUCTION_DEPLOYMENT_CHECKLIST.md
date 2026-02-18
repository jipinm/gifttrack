# Production Deployment Checklist
**Date**: February 17, 2026  
**Version**: 1.0.10 (Auto-incremented in APK build)

## Recent Changes Deployed
✅ Advanced customer filtering (event-based filters, care-of, invitation status, gift status)  
✅ Event alert notification with sound (expo-av)  
✅ Searchable event dropdown in customer filters  
✅ Gift flow on Add Customer and Attach Customer screens  
✅ Fixed default preselection in filter dropdowns  

---

## Pre-Deployment Checklist

### 1. Files to Upload to Production Server
Upload these files from your local environment to the production server at `gift-track.myprojectdemo.live`:

#### Configuration Files
- [ ] **Copy `.env.production` to `.env`** (contains production DB credentials)
- [ ] **Copy `.htaccess.production` to `.htaccess`** (contains correct API routes)

#### Code Files (Upload entire folders)
- [ ] `api/` folder (all PHP endpoint files)
- [ ] `models/` folder (Customer.php with new filtering logic)
- [ ] `utils/` folder (core utilities)
- [ ] `middleware/` folder (authentication & CORS)
- [ ] `config/` folder (database, JWT config)
- [ ] `bootstrap.php` (application bootstrap)
- [ ] `composer.json` and `vendor/` (if dependencies changed)

### 2. Database Updates Required
The following migrations need to be run on the production database `myprojec_db_gifttrack`:

**Recent Schema Changes:**
- [ ] `010_add_soft_delete_events.sql` - Adds soft delete to events table
- [ ] `014_scope_change_events_restructure.sql` - Major event restructuring

**Verify Existing Tables:**
- [ ] `care_of_options` table exists
- [ ] `invitation_status` table exists
- [ ] `event_customers` table with `care_of_id` and `invitation_status_id` columns
- [ ] `gifts` table has correct `event_id` foreign key

### 3. Apache/Server Configuration
- [ ] Verify `mod_rewrite` is enabled
- [ ] Verify `mod_headers` is enabled
- [ ] Verify `.htaccess` files are processed (`AllowOverride All`)
- [ ] Test URL rewriting: `https://gift-track.myprojectdemo.live/test_url_rewriting`
- [ ] Test health endpoint: `https://gift-track.myprojectdemo.live/api/health`

### 4. Environment Variables Verification
Verify `.env` on production server has these settings:

```env
DB_HOST=localhost
DB_NAME=myprojec_db_gifttrack
DB_USER=myprojec_user_gifttrack
DB_PASS=b_(a;0i+=;q2i22b
ENVIRONMENT=production
JWT_SECRET=[your-production-secret]
CORS_ORIGIN=*
```

### 5. API Endpoint Testing
After deployment, test these key endpoints:

#### Authentication
- [ ] `POST /api/auth/login` - Admin login
- [ ] `GET /api/auth/verify` - Token verification

#### Master Data
- [ ] `GET /api/master/states`
- [ ] `GET /api/master/event-types`
- [ ] `GET /api/master/care-of-options` ⚠️ **NEW ENDPOINT**
- [ ] `GET /api/master/invitation-status`

#### Events (Query-String Based)
- [ ] `GET /api/events` - List all events
- [ ] `GET /api/events/show?id={id}` - Get single event
- [ ] `PUT /api/events/update?id={id}` - Update event
- [ ] `GET /api/events/customers?eventId={id}` - Get event customers
- [ ] `PUT /api/events/update-attachment?id={id}` ⚠️ **NEW ENDPOINT**
- [ ] `DELETE /api/events/detach-customer?id={id}` ⚠️ **NEW ENDPOINT**

#### Customers (with new filters)
- [ ] `GET /api/customers` - Basic list
- [ ] `GET /api/customers?eventId={id}` - Filter by event ⚠️ **NEW**
- [ ] `GET /api/customers?eventId={id}&careOfId={id}` - Event + Care-of filter ⚠️ **NEW**
- [ ] `GET /api/customers?eventId={id}&invitationStatusId={id}` - Event + Invitation Status ⚠️ **NEW**
- [ ] `GET /api/customers?eventId={id}&giftStatus=gifted` - Event + Gift Status ⚠️ **NEW**

#### Gifts
- [ ] `POST /api/gifts` - Create gift
- [ ] `GET /api/gifts/customer-gifts?customer_id={id}` - Get customer gifts
- [ ] `PUT /api/gifts/update?id={id}` - Update gift

### 6. Mobile App APK Build
The production APK build is in progress:
- **Build ID**: `296f56e2-b546-448b-8989-30a3ea4862cf`
- **Build Link**: https://expo.dev/accounts/jipinm/projects/customer-management-mobile/builds/296f56e2-b546-448b-8989-30a3ea4862cf
- **Version Code**: 10
- **API URL**: `https://gift-track.myprojectdemo.live` (configured in .env)

Once the build completes:
- [ ] Download APK from EAS dashboard
- [ ] Test installation on Android device
- [ ] Test login with production credentials
- [ ] Test event alert sound notification
- [ ] Test customer list with advanced filters
- [ ] Test event dropdown filtering
- [ ] Test gift creation flow

---

## Deployment Steps

### Step 1: Backup Production
```bash
# SSH into production server
ssh your-user@gift-track.myprojectdemo.live

# Backup current API code
cd /path/to/web/root
tar -czf backup-api-$(date +%Y%m%d-%H%M%S).tar.gz customer-management-api/

# Backup production database
mysqldump -u myprojec_user_gifttrack -p myprojec_db_gifttrack > backup-db-$(date +%Y%m%d-%H%M%S).sql
```

### Step 2: Upload Files
Use FTP/SFTP to upload the updated API files:
```bash
# Using rsync (recommended)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  C:/xampp/htdocs/gifttrack/customer-management-api/ \
  your-user@gift-track.myprojectdemo.live:/path/to/web/root/
```

Or use your preferred FTP client (FileZilla, WinSCP, etc.)

### Step 3: Apply Configuration
```bash
# On production server
cd /path/to/web/root/customer-management-api

# Copy production configs
cp .env.production .env
cp .htaccess.production .htaccess

# Set correct permissions
chmod 644 .env
chmod 644 .htaccess
chmod -R 755 api/
chmod -R 755 vendor/
```

### Step 4: Run Database Migrations (if needed)
```bash
# Connect to MySQL
mysql -u myprojec_user_gifttrack -p myprojec_db_gifttrack

# Run any pending migrations
source database/migrations/010_add_soft_delete_events.sql;
source database/migrations/014_scope_change_events_restructure.sql;
```

### Step 5: Verify Deployment
1. Test health endpoint: `curl https://gift-track.myprojectdemo.live/api/health`
2. Test auth login with your credentials
3. Test new endpoints listed above
4. Monitor logs for any errors

### Step 6: Deploy Mobile App
1. Wait for EAS build to complete (~10-15 minutes)
2. Download APK from EAS dashboard
3. Test on physical Android device
4. Distribute to users

---

## Rollback Plan
If issues occur:

```bash
# Restore code backup
cd /path/to/web/root
rm -rf customer-management-api/
tar -xzf backup-api-YYYYMMDD-HHMMSS.tar.gz

# Restore database backup
mysql -u myprojec_user_gifttrack -p myprojec_db_gifttrack < backup-db-YYYYMMDD-HHMMSS.sql
```

---

## Critical Notes

### ⚠️ API Route Structure
The production `.htaccess.production` has been updated to match the mobile app's expected query-string-based routes:
- ✅ `/api/events/show?id={id}` (NOT `/api/events/{id}`)
- ✅ `/api/events/update?id={id}` (NOT `/api/events/{id}`)
- ✅ `/api/events/customers?eventId={id}`
- ✅ All new event attachment routes

### ⚠️ New Features
- **Care-of-options** master data endpoint is now available
- **Event-based customer filtering** with advanced filters
- **Gift status filtering** (gifted/not_gifted)
- **Alert sound** on event notifications (uses expo-av)

### ⚠️ Database Schema
Ensure the production database has:
- `care_of_options` table
- `invitation_status` table  
- Proper foreign keys in `event_customers` table
- Soft delete columns in `events` table (if using soft deletes)

---

## Support Contacts
- **API Documentation**: `API_DOCUMENTATION.md`
- **Database Schema**: Check migration files in `database/migrations/`
- **Mobile App Config**: `customer-management-mobile/app.config.js`

---

## Post-Deployment Verification
- [ ] All API endpoints responding correctly
- [ ] Authentication working with JWT tokens
- [ ] Mobile app can connect and load data
- [ ] Advanced filtering works correctly
- [ ] Event alert sound plays on notification
- [ ] No console errors in browser/mobile
- [ ] Performance is acceptable (API response < 2s)

**Deployment Status**: ⏳ In Progress (APK building, API ready for upload)
