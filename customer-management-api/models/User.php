<?php
/**
 * User Model
 * Handles database operations for users (admins & super admins)
 */

class User {
    private $db;
    private $connection;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->connection = $this->db->getConnection();
    }
    
    /**
     * Find user by mobile number
     * 
     * @param string $mobileNumber User's mobile number
     * @return array|null User data or null if not found
     */
    public function findByMobileNumber($mobileNumber) {
        try {
            $sql = "SELECT * FROM users WHERE mobile_number = :mobile_number LIMIT 1";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['mobile_number' => $mobileNumber]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error finding user by mobile: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Find user by ID
     * 
     * @param string $id User ID
     * @return array|null User data or null if not found
     */
    public function getById($id) {
        try {
            $sql = "SELECT u.*, s.name as state_name, d.name as district_name, c.name as city_name
                    FROM users u
                    LEFT JOIN states s ON u.state_id = s.id
                    LEFT JOIN districts d ON u.district_id = d.id
                    LEFT JOIN cities c ON u.city_id = c.id
                    WHERE u.id = :id LIMIT 1";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error finding user by ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get all users (admins only, exclude superadmin)
     * 
     * @return array Array of admin users
     */
    public function getAll() {
        try {
            $sql = "SELECT u.id, u.name, u.mobile_number, u.address, u.state_id, u.district_id, u.city_id, u.branch, u.role, u.status, u.created_at, u.updated_at,
                           s.name as state_name, d.name as district_name, c.name as city_name
                    FROM users u
                    LEFT JOIN states s ON u.state_id = s.id
                    LEFT JOIN districts d ON u.district_id = d.id
                    LEFT JOIN cities c ON u.city_id = c.id
                    WHERE u.role = 'admin'
                    ORDER BY u.created_at DESC";
            
            $stmt = $this->connection->query($sql);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting all users: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Verify user password
     * 
     * @param string $password Plain text password
     * @param string $hash Hashed password from database
     * @return bool True if password matches
     */
    public function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Create new user/admin
     * 
     * @param array $data User data (name, mobile_number, password, address, place, branch, role, status)
     * @return string|false User ID on success, false on failure
     */
    public function create($data) {
        try {
            // Generate UUID
            $id = $this->generateUUID();
            
            // Hash password
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            
            $sql = "INSERT INTO users (id, name, mobile_number, password, address, state_id, district_id, city_id, branch, role, status) 
                    VALUES (:id, :name, :mobile_number, :password, :address, :state_id, :district_id, :city_id, :branch, :role, :status)";
            
            $stmt = $this->connection->prepare($sql);
            
            $success = $stmt->execute([
                'id' => $id,
                'name' => $data['name'],
                'mobile_number' => $data['mobileNumber'],
                'password' => $hashedPassword,
                'address' => $data['address'] ?? null,
                'state_id' => $data['stateId'] ?? null,
                'district_id' => $data['districtId'] ?? null,
                'city_id' => $data['cityId'] ?? null,
                'branch' => $data['branch'] ?? null,
                'role' => $data['role'] ?? 'admin',
                'status' => $data['status'] ?? 'approved' // Super Admin creation = approved; self-registration = pending
            ]);
            
            return $success ? $id : false;
        } catch (PDOException $e) {
            error_log("Error creating user: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update user
     * 
     * @param string $id User ID
     * @param array $data User data to update
     * @return bool True on success
     */
    public function update($id, $data) {
        try {
            $updateFields = [];
            $params = ['id' => $id];
            
            // Build dynamic update query
            if (isset($data['name'])) {
                $updateFields[] = "name = :name";
                $params['name'] = $data['name'];
            }
            
            if (isset($data['address'])) {
                $updateFields[] = "address = :address";
                $params['address'] = $data['address'];
            }
            
            if (isset($data['stateId'])) {
                $updateFields[] = "state_id = :state_id";
                $params['state_id'] = $data['stateId'];
            }
            
            if (isset($data['districtId'])) {
                $updateFields[] = "district_id = :district_id";
                $params['district_id'] = $data['districtId'];
            }
            
            if (isset($data['cityId'])) {
                $updateFields[] = "city_id = :city_id";
                $params['city_id'] = $data['cityId'];
            }
            
            if (isset($data['branch'])) {
                $updateFields[] = "branch = :branch";
                $params['branch'] = $data['branch'];
            }
            
            if (isset($data['password'])) {
                $updateFields[] = "password = :password";
                $params['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
            }
            
            if (empty($updateFields)) {
                return true; // Nothing to update
            }
            
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :id";
            
            $stmt = $this->connection->prepare($sql);
            
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error updating user: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete user
     * 
     * @param string $id User ID
     * @return bool True on success
     */
    public function delete($id) {
        try {
            $sql = "DELETE FROM users WHERE id = :id AND role != 'superadmin'";
            
            $stmt = $this->connection->prepare($sql);
            
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log("Error deleting user: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Generate UUID v4
     * 
     * @return string UUID
     */
    private function generateUUID() {
        // Using MySQL UUID() function
        $stmt = $this->connection->query("SELECT UUID() as uuid");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['uuid'];
    }
    
    // =========================================================================
    // Deletion Request Methods
    // =========================================================================

    /**
     * Check if an admin already has a pending deletion request
     *
     * @param string $adminId Admin user ID
     * @return bool
     */
    public function hasPendingDeletionRequest($adminId) {
        try {
            $sql = "SELECT COUNT(*) as cnt FROM admin_deletion_requests WHERE admin_id = :admin_id AND status = 'pending'";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['admin_id' => $adminId]);
            return (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking pending deletion request: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a new deletion request for an admin
     *
     * @param string $adminId Admin user ID
     * @return int|false Inserted request ID or false on failure
     */
    public function createDeletionRequest($adminId) {
        try {
            $sql = "INSERT INTO admin_deletion_requests (admin_id, status) VALUES (:admin_id, 'pending')";
            $stmt = $this->connection->prepare($sql);
            $success = $stmt->execute(['admin_id' => $adminId]);
            return $success ? (int)$this->connection->lastInsertId() : false;
        } catch (PDOException $e) {
            error_log("Error creating deletion request: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all deletion requests (optionally filtered by status)
     *
     * @param string|null $status pending|approved|rejected or null for all
     * @return array
     */
    public function getDeletionRequests($status = null) {
        try {
            $sql = "SELECT adr.id, adr.admin_id, adr.status, adr.created_at, adr.updated_at,
                           u.name as admin_name, u.mobile_number as admin_mobile, u.branch as admin_branch
                    FROM admin_deletion_requests adr
                    INNER JOIN users u ON adr.admin_id = u.id";

            $params = [];
            if ($status !== null) {
                $sql .= " WHERE adr.status = :status";
                $params['status'] = $status;
            }

            $sql .= " ORDER BY adr.created_at DESC";

            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching deletion requests: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get a single deletion request by ID
     *
     * @param int $requestId
     * @return array|null
     */
    public function getDeletionRequestById($requestId) {
        try {
            $sql = "SELECT adr.id, adr.admin_id, adr.status, adr.created_at, adr.updated_at,
                           u.name as admin_name, u.mobile_number as admin_mobile, u.branch as admin_branch
                    FROM admin_deletion_requests adr
                    INNER JOIN users u ON adr.admin_id = u.id
                    WHERE adr.id = :id LIMIT 1";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $requestId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            error_log("Error fetching deletion request by ID: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update deletion request status
     *
     * @param int $requestId
     * @param string $status approved|rejected
     * @return bool
     */
    public function updateDeletionRequestStatus($requestId, $status) {
        try {
            $sql = "UPDATE admin_deletion_requests SET status = :status WHERE id = :id";
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute(['status' => $status, 'id' => $requestId]);
        } catch (PDOException $e) {
            error_log("Error updating deletion request status: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Format a deletion request for API response
     *
     * @param array $request
     * @return array
     */
    public function formatDeletionRequestForResponse($request) {
        return [
            'id' => (int)$request['id'],
            'adminId' => $request['admin_id'],
            'adminName' => $request['admin_name'],
            'adminMobile' => $request['admin_mobile'],
            'adminBranch' => $request['admin_branch'] ?? '',
            'status' => $request['status'],
            'createdAt' => $request['created_at'],
            'updatedAt' => $request['updated_at'],
        ];
    }

    /**
     * Format user data for API response (exclude password)
     * 
     * @param array $user User data from database
     * @return array Formatted user data
     */
    public function formatForResponse($user) {
        if (!$user) {
            return null;
        }
        
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'mobileNumber' => $user['mobile_number'],
            'address' => $user['address'] ?? '',
            'stateId' => $user['state_id'] ?? null,
            'districtId' => $user['district_id'] ?? null,
            'cityId' => $user['city_id'] ?? null,
            'stateName' => $user['state_name'] ?? '',
            'districtName' => $user['district_name'] ?? '',
            'cityName' => $user['city_name'] ?? '',
            'branch' => $user['branch'] ?? '',
            'role' => $user['role'],
            'status' => $user['status'] ?? 'approved',
            'createdAt' => $user['created_at']
        ];
    }

    // =========================================================================
    // Registration Request Methods
    // =========================================================================

    /**
     * Get all registration requests (pending admins) — optionally filtered by status.
     *
     * @param string|null $status 'pending'|'approved'|'rejected'|null (all)
     * @return array
     */
    public function getRegistrationRequests($status = null) {
        try {
            $sql = "SELECT u.id, u.name, u.mobile_number, u.address, u.state_id, u.district_id, u.city_id, u.branch, u.role, u.status, u.created_at, u.updated_at,
                           s.name as state_name, d.name as district_name, c.name as city_name
                    FROM users u
                    LEFT JOIN states s ON u.state_id = s.id
                    LEFT JOIN districts d ON u.district_id = d.id
                    LEFT JOIN cities c ON u.city_id = c.id
                    WHERE u.role = 'admin'";
            $params = [];
            if ($status !== null) {
                $sql .= " AND u.status = :status";
                $params['status'] = $status;
            }
            $sql .= " ORDER BY u.created_at DESC";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching registration requests: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Update a user's registration status (approve or reject).
     *
     * @param string $userId  User UUID
     * @param string $status  'approved'|'rejected'
     * @return bool
     */
    public function updateRegistrationStatus($userId, $status) {
        try {
            $sql = "UPDATE users SET status = :status WHERE id = :id AND role = 'admin'";
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute(['status' => $status, 'id' => $userId]);
        } catch (PDOException $e) {
            error_log("Error updating registration status: " . $e->getMessage());
            return false;
        }
    }
}
