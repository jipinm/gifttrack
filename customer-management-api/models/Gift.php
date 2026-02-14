<?php
/**
 * Gift Model
 * Handles all gift-related database operations
 * 
 * Gifts are linked to standalone events + customers
 * Gift direction is derived from event category:
 *   self_event → received
 *   customer_event → given
 */

class Gift {
    private $connection;
    
    public function __construct() {
        $this->connection = Database::getInstance()->getConnection();
    }
    
    /**
     * Get all gifts for a specific customer (through events)
     * @param string $customerId Customer UUID
     * @param Paginator|null $paginator Paginator instance for pagination
     * @return array|Paginator Array of gifts or paginated response
     */
    public function getByCustomerId($customerId, $paginator = null) {
        try {
            // If paginator is provided, get total count first
            if ($paginator) {
                $countSql = "SELECT COUNT(*) as total FROM gifts g
                            WHERE g.customer_id = :customerId";
                $countStmt = $this->connection->prepare($countSql);
                $countStmt->execute(['customerId' => $customerId]);
                $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                $paginator->setTotal($total);
            }
            
            $sql = "SELECT 
                        g.*,
                        gt.name as gift_type_name,
                        e.id as event_id,
                        e.name as event_name,
                        e.event_date,
                        e.event_type_id,
                        et.name as event_type_name,
                        e.event_category
                    FROM gifts g
                    INNER JOIN events e ON g.event_id = e.id
                    LEFT JOIN gift_types gt ON g.gift_type_id = gt.id
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    WHERE g.customer_id = :customerId
                    ORDER BY e.event_date DESC";
            
            // Add pagination if provided
            if ($paginator) {
                $sql .= " " . $paginator->getLimitClause();
            }
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['customerId' => $customerId]);
            
            $gifts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Return paginated response or just data
            if ($paginator) {
                $paginator->setData($gifts);
                return $paginator;
            }
            
            return $gifts;
        } catch (PDOException $e) {
            error_log("Error getting gifts by customer ID: " . $e->getMessage());
            if ($paginator) {
                $paginator->setTotal(0)->setData([]);
                return $paginator;
            }
            return [];
        }
    }
    
    /**
     * Get a single gift by ID
     * @param string $id Gift UUID
     * @return array|null Gift data or null if not found
     */
    public function getById($id) {
        try {
            $sql = "SELECT 
                        g.*,
                        gt.name as gift_type_name,
                        e.id as event_id,
                        e.name as event_name,
                        e.event_date,
                        e.event_type_id,
                        et.name as event_type_name,
                        e.event_category,
                        c.name as customer_name,
                        c.mobile_number as customer_mobile
                    FROM gifts g
                    INNER JOIN events e ON g.event_id = e.id
                    LEFT JOIN gift_types gt ON g.gift_type_id = gt.id
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    LEFT JOIN customers c ON g.customer_id = c.id
                    WHERE g.id = :id";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting gift by ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get gift by event ID
     * @param string $eventId Event UUID
     * @return array|null Gift data or null if not found
     */
    public function getByEventId($eventId) {
        try {
            $sql = "SELECT 
                        g.*,
                        gt.name as gift_type_name,
                        e.event_date,
                        e.name as event_name,
                        e.event_type_id,
                        et.name as event_type_name,
                        e.event_category
                    FROM gifts g
                    INNER JOIN events e ON g.event_id = e.id
                    LEFT JOIN gift_types gt ON g.gift_type_id = gt.id
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    WHERE g.event_id = :eventId";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['eventId' => $eventId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting gift by event ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Create a new gift for an event
     * @param array $data Gift data (must include event_id)
     * @return string|false Gift ID or false on failure
     */
    public function create($data) {
        try {
            // Generate UUID
            $id = sprintf(
                '%s-%s-%s-%s-%s',
                bin2hex(random_bytes(4)),
                bin2hex(random_bytes(2)),
                bin2hex(random_bytes(2)),
                bin2hex(random_bytes(2)),
                bin2hex(random_bytes(6))
            );
            
            $sql = "INSERT INTO gifts (
                        id, event_id, customer_id, gift_type_id, value, description
                    ) VALUES (
                        :id, :eventId, :customerId, :giftTypeId, :value, :description
                    )";
            
            $stmt = $this->connection->prepare($sql);
            $result = $stmt->execute([
                'id' => $id,
                'eventId' => $data['event_id'],
                'customerId' => $data['customer_id'],
                'giftTypeId' => $data['gift_type_id'],
                'value' => $data['value'] ?? 0,
                'description' => $data['description'] ?? null
            ]);
            
            return $result ? $id : false;
        } catch (PDOException $e) {
            error_log("Error creating gift: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update a gift
     * @param string $id Gift UUID
     * @param array $data Updated gift data
     * @return bool Success status
     */
    public function update($id, $data) {
        try {
            $updates = [];
            $params = ['id' => $id];
            
            if (isset($data['gift_type_id'])) {
                $updates[] = "gift_type_id = :giftTypeId";
                $params['giftTypeId'] = $data['gift_type_id'];
            }
            
            if (isset($data['value'])) {
                $updates[] = "value = :value";
                $params['value'] = $data['value'];
            }
            
            if (isset($data['description'])) {
                $updates[] = "description = :description";
                $params['description'] = $data['description'];
            }
            
            if (empty($updates)) {
                return false;
            }
            
            $sql = "UPDATE gifts SET " . implode(', ', $updates) . " WHERE id = :id";
            
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error updating gift: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete a gift
     * @param string $id Gift UUID
     * @return string|false Customer ID or false on failure
     */
    public function delete($id) {
        try {
            // First get the customer_id before deleting
            $gift = $this->getById($id);
            if (!$gift) {
                return false;
            }
            
            $sql = "DELETE FROM gifts WHERE id = :id";
            
            $stmt = $this->connection->prepare($sql);
            $result = $stmt->execute(['id' => $id]);
            
            // Return the customer_id along with success status for trigger update
            return $result ? $gift['customer_id'] : false;
        } catch (PDOException $e) {
            error_log("Error deleting gift: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if a gift exists (optionally checking if it belongs to admin's customer)
     * @param string $id Gift UUID
     * @param string|null $adminId Optional admin ID to verify the gift's customer is owned by this admin
     * @return bool
     */
    public function exists($id, $adminId = null) {
        try {
            if ($adminId !== null) {
                // Check if gift exists AND its customer is owned by the admin
                $sql = "SELECT COUNT(*) as count FROM gifts g
                        INNER JOIN customers c ON g.customer_id = c.id
                        WHERE g.id = :id AND c.created_by = :adminId";
                $params = ['id' => $id, 'adminId' => $adminId];
            } else {
                $sql = "SELECT COUNT(*) as count FROM gifts WHERE id = :id";
                $params = ['id' => $id];
            }
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking gift existence: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if a gift belongs to a customer owned by a specific admin
     * @param string $giftId Gift UUID
     * @param string $adminId Admin user ID
     * @return bool True if the gift belongs to a customer owned by this admin
     */
    public function isOwnedByAdmin($giftId, $adminId) {
        return $this->exists($giftId, $adminId);
    }
    
    /**
     * Get the customer_id for a gift (through event)
     * @param string $giftId Gift UUID
     * @return string|null Customer ID or null if not found
     */
    public function getCustomerId($giftId) {
        try {
            $sql = "SELECT customer_id FROM gifts WHERE id = :id";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $giftId]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['customer_id'] : null;
        } catch (PDOException $e) {
            error_log("Error getting gift customer ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get total gift value for a customer (through events)
     * @param string $customerId Customer UUID
     * @return float Total value
     */
    public function getTotalValue($customerId) {
        try {
            $sql = "SELECT COALESCE(SUM(g.value), 0) as total_value 
                    FROM gifts g
                    WHERE g.customer_id = :customerId";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['customerId' => $customerId]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (float)$result['total_value'];
        } catch (PDOException $e) {
            error_log("Error getting total gift value: " . $e->getMessage());
            return 0.0;
        }
    }
    
    /**
     * Format gift data for API response
     * @param array $gift Gift data from database
     * @return array Formatted gift data
     */
    public function formatForResponse($gift) {
        if (!$gift) {
            return null;
        }
        
        $category = $gift['event_category'] ?? null;
        return [
            'id' => $gift['id'],
            'eventId' => $gift['event_id'],
            'customerId' => $gift['customer_id'],
            'eventName' => $gift['event_name'] ?? null,
            'eventDate' => $gift['event_date'] ?? null,
            'giftType' => [
                'id' => (int)$gift['gift_type_id'],
                'name' => $gift['gift_type_name'] ?? null
            ],
            'eventType' => isset($gift['event_type_id']) ? [
                'id' => (int)$gift['event_type_id'],
                'name' => $gift['event_type_name'] ?? null
            ] : null,
            'eventCategory' => $category,
            'direction' => $category === 'self_event' ? 'received' : ($category === 'customer_event' ? 'given' : null),
            'value' => (float)$gift['value'],
            'description' => $gift['description'],
            'createdAt' => $gift['created_at'],
            'updatedAt' => $gift['updated_at'] ?? null
        ];
    }
}
