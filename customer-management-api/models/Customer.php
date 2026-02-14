<?php
/**
 * Customer Model
 * Handles database operations for customers
 */

class Customer {
    private $db;
    private $connection;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->connection = $this->db->getConnection();
    }
    
    /**
     * Get all customers with optional filters
     * 
     * @param array $filters Optional filters (search, giftStatus, eventDate, districtId, cityId, createdBy)
     * @param Paginator|null $paginator Paginator instance for pagination
     * @return array Array of customers or paginated response
     */
    public function getAll($filters = [], $paginator = null) {
        try {
            // Build WHERE clause and params
            $whereClause = "WHERE 1=1";
            $params = [];
            
            // Filter by admin who created the customer (admin-scoped access)
            if (!empty($filters['createdBy'])) {
                $whereClause .= " AND c.created_by = :createdBy";
                $params['createdBy'] = $filters['createdBy'];
            }
            
            // Search filter (name or mobile)
            if (isset($filters['search']) && !empty(trim($filters['search']))) {
                $whereClause .= " AND (c.name LIKE :searchName OR c.mobile_number LIKE :searchMobile)";
                $params['searchName'] = '%' . $filters['search'] . '%';
                $params['searchMobile'] = '%' . $filters['search'] . '%';
            }
            
            // District filter
            if (!empty($filters['districtId'])) {
                $whereClause .= " AND c.district_id = :districtId";
                $params['districtId'] = $filters['districtId'];
            }
            
            // City filter
            if (!empty($filters['cityId'])) {
                $whereClause .= " AND c.city_id = :cityId";
                $params['cityId'] = $filters['cityId'];
            }
            
            // If paginator is provided, get total count first
            if ($paginator) {
                $countSql = "SELECT COUNT(*) as total FROM customers c " . $whereClause;
                $countStmt = $this->connection->prepare($countSql);
                $countStmt->execute($params);
                $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                $paginator->setTotal($total);
            }
            
            // Build main query
            $sql = "SELECT 
                        c.*,
                        s.name as state_name,
                        d.name as district_name,
                        ct.name as city_name,
                        u.name as created_by_name,
                        (SELECT COUNT(*) FROM gifts g WHERE g.customer_id = c.id) as gift_count,
                        COALESCE((SELECT SUM(value) FROM gifts g WHERE g.customer_id = c.id), 0) as total_gift_value,
                        (SELECT COUNT(*) FROM event_customers ec WHERE ec.customer_id = c.id) as event_count
                    FROM customers c
                    LEFT JOIN states s ON c.state_id = s.id
                    LEFT JOIN districts d ON c.district_id = d.id
                    LEFT JOIN cities ct ON c.city_id = ct.id
                    LEFT JOIN users u ON c.created_by = u.id
                    " . $whereClause . "
                    ORDER BY c.created_at DESC";
            
            // Add pagination if provided
            if ($paginator) {
                $sql .= " " . $paginator->getLimitClause();
            }
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Return paginated response or just data
            if ($paginator) {
                $paginator->setData($customers);
                return $paginator;
            }
            
            return $customers;
        } catch (PDOException $e) {
            error_log("Error getting all customers: " . $e->getMessage());
            if ($paginator) {
                $paginator->setTotal(0)->setData([]);
                return $paginator;
            }
            return [];
        }
    }
    
    /**
     * Get customer by ID with gifts
     * 
     * @param string $id Customer ID
     * @param string|null $createdBy Optional admin ID to verify ownership
     * @return array|null Customer data with gifts or null if not found
     */
    public function getById($id, $createdBy = null) {
        try {
            $whereClause = "WHERE c.id = :id";
            $params = ['id' => $id];
            
            // If createdBy is provided, filter by ownership
            if ($createdBy !== null) {
                $whereClause .= " AND c.created_by = :createdBy";
                $params['createdBy'] = $createdBy;
            }
            
            $sql = "SELECT 
                        c.*,
                        s.name as state_name,
                        d.name as district_name,
                        ct.name as city_name,
                        u.name as created_by_name
                    FROM customers c
                    LEFT JOIN states s ON c.state_id = s.id
                    LEFT JOIN districts d ON c.district_id = d.id
                    LEFT JOIN cities ct ON c.city_id = ct.id
                    LEFT JOIN users u ON c.created_by = u.id
                    " . $whereClause . " LIMIT 1";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$customer) {
                return null;
            }
            
            // Get gifts for this customer (through events)
            $giftSql = "SELECT 
                            g.*,
                            gt.name as gift_type_name,
                            e.event_date,
                            e.name as event_name,
                            et.name as event_type_name,
                            e.event_category
                        FROM gifts g
                        LEFT JOIN gift_types gt ON g.gift_type_id = gt.id
                        LEFT JOIN events e ON g.event_id = e.id
                        LEFT JOIN event_types et ON e.event_type_id = et.id
                        WHERE g.customer_id = :customer_id
                        ORDER BY e.event_date DESC, g.created_at DESC";
            
            $giftStmt = $this->connection->prepare($giftSql);
            $giftStmt->execute(['customer_id' => $id]);
            
            $customer['gifts'] = $giftStmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $customer;
        } catch (PDOException $e) {
            error_log("Error getting customer by ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Create new customer
     * 
     * @param array $data Customer data
     * @return string|false Customer ID on success, false on failure
     */
    public function create($data) {
        try {
            // Generate UUID
            $id = $this->generateUUID();
            
            $sql = "INSERT INTO customers (
                        id, name, mobile_number, address, 
                        state_id, district_id, city_id, 
                        notes, created_by
                    ) VALUES (
                        :id, :name, :mobile_number, :address,
                        :state_id, :district_id, :city_id,
                        :notes, :created_by
                    )";
            
            $stmt = $this->connection->prepare($sql);
            
            $success = $stmt->execute([
                'id' => $id,
                'name' => $data['name'],
                'mobile_number' => $data['mobileNumber'],
                'address' => $data['address'],
                'state_id' => $data['stateId'] ?? 1, // Default to Kerala
                'district_id' => $data['districtId'],
                'city_id' => $data['cityId'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $data['createdBy']
            ]);
            
            return $success ? $id : false;
        } catch (PDOException $e) {
            error_log("Error creating customer: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update customer
     * 
     * @param string $id Customer ID
     * @param array $data Customer data to update
     * @param string|null $createdBy Optional admin ID to verify ownership
     * @return bool True on success
     */
    public function update($id, $data, $createdBy = null) {
        try {
            $updateFields = [];
            $params = ['id' => $id];
            
            // Add ownership check if createdBy is provided
            $whereClause = "WHERE id = :id";
            if ($createdBy !== null) {
                $whereClause .= " AND created_by = :createdBy";
                $params['createdBy'] = $createdBy;
            }
            
            // Build dynamic update query
            if (isset($data['name'])) {
                $updateFields[] = "name = :name";
                $params['name'] = $data['name'];
            }
            
            if (isset($data['mobileNumber'])) {
                $updateFields[] = "mobile_number = :mobile_number";
                $params['mobile_number'] = $data['mobileNumber'];
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
            
            if (isset($data['notes'])) {
                $updateFields[] = "notes = :notes";
                $params['notes'] = $data['notes'];
            }
            
            if (empty($updateFields)) {
                return true; // Nothing to update
            }
            
            $sql = "UPDATE customers SET " . implode(', ', $updateFields) . " " . $whereClause;
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            // Return true only if a row was actually updated (ownership check passed)
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error updating customer: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete customer (cascade delete gifts via FK)
     * 
     * @param string $id Customer ID
     * @param string|null $createdBy Optional admin ID to verify ownership
     * @return bool True on success
     */
    public function delete($id, $createdBy = null) {
        try {
            $whereClause = "WHERE id = :id";
            $params = ['id' => $id];
            
            // If createdBy is provided, only delete if admin owns the customer
            if ($createdBy !== null) {
                $whereClause .= " AND created_by = :createdBy";
                $params['createdBy'] = $createdBy;
            }
            
            $sql = "DELETE FROM customers " . $whereClause;
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            // Return true only if a row was actually deleted
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error deleting customer: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if customer exists
     * 
     * @param string $id Customer ID
     * @param string|null $createdBy Optional admin ID to verify ownership
     * @return bool True if exists (and owned by admin if createdBy provided)
     */
    public function exists($id, $createdBy = null) {
        try {
            $whereClause = "WHERE id = :id";
            $params = ['id' => $id];
            
            if ($createdBy !== null) {
                $whereClause .= " AND created_by = :createdBy";
                $params['createdBy'] = $createdBy;
            }
            
            $sql = "SELECT COUNT(*) as count FROM customers " . $whereClause;
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking customer exists: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if customer is owned by a specific admin
     * 
     * @param string $customerId Customer ID
     * @param string $adminId Admin user ID
     * @return bool True if customer is owned by the admin
     */
    public function isOwnedBy($customerId, $adminId) {
        return $this->exists($customerId, $adminId);
    }
    
    /**
     * Generate UUID v4
     * 
     * @return string UUID
     */
    private function generateUUID() {
        $stmt = $this->connection->query("SELECT UUID() as uuid");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['uuid'];
    }
    
    /**
     * Format customer data for API response
     * 
     * @param array $customer Customer data from database
     * @return array Formatted customer data
     */
    public function formatForResponse($customer) {
        if (!$customer) {
            return null;
        }
        
        $formatted = [
            'id' => $customer['id'],
            'name' => $customer['name'],
            'mobileNumber' => $customer['mobile_number'],
            'address' => $customer['address'],
            'state' => [
                'id' => $customer['state_id'],
                'name' => $customer['state_name'] ?? ''
            ],
            'district' => [
                'id' => $customer['district_id'],
                'name' => $customer['district_name'] ?? ''
            ],
            'city' => [
                'id' => $customer['city_id'],
                'name' => $customer['city_name'] ?? ''
            ],
            'notes' => $customer['notes'] ?? '',
            'createdBy' => $customer['created_by'] ? [
                'id' => $customer['created_by'],
                'name' => $customer['created_by_name'] ?? ''
            ] : null,
            'createdAt' => $customer['created_at']
        ];
        
        // Add gift count and total value if available
        if (isset($customer['gift_count'])) {
            $formatted['giftCount'] = (int)$customer['gift_count'];
        }
        
        if (isset($customer['total_gift_value'])) {
            $formatted['totalGiftValue'] = (float)$customer['total_gift_value'];
        }
        
        if (isset($customer['event_count'])) {
            $formatted['eventCount'] = (int)$customer['event_count'];
        }
        
        // Add gifts array if available
        if (isset($customer['gifts'])) {
            $formatted['gifts'] = array_map(function($gift) {
                return [
                    'id' => $gift['id'],
                    'eventId' => $gift['event_id'],
                    'eventDate' => $gift['event_date'] ?? null,
                    'eventName' => $gift['event_name'] ?? null,
                    'giftType' => [
                        'id' => $gift['gift_type_id'],
                        'name' => $gift['gift_type_name'] ?? ''
                    ],
                    'eventType' => isset($gift['event_type_name']) ? $gift['event_type_name'] : null,
                    'value' => (float)$gift['value'],
                    'description' => $gift['description'] ?? '',
                    'direction' => isset($gift['event_category']) ? ($gift['event_category'] === 'self_event' ? 'received' : 'given') : null,
                    'createdAt' => $gift['created_at']
                ];
            }, $customer['gifts']);
        }
        
        return $formatted;
    }
}
