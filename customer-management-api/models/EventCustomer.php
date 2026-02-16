<?php
/**
 * EventCustomer Model
 * Handles event-customer attachment operations (pivot table)
 * 
 * Rules:
 * - Customer Event: Only ONE customer can be attached
 * - Self Event: Multiple customers can be attached
 * - Super Admin can attach any customer
 * - Admin can attach only customers they created
 */

class EventCustomer {
    private $connection;
    
    public function __construct() {
        $this->connection = Database::getInstance()->getConnection();
    }
    
    /**
     * Get all customers attached to an event
     * 
     * @param string $eventId Event UUID
     * @param string|null $adminId Optional admin ID to filter customers (admin sees only their own)
     * @return array
     */
    public function getByEventId($eventId, $adminId = null) {
        try {
            $sql = "SELECT 
                        ec.*,
                        c.name as customer_name,
                        c.mobile_number as customer_mobile,
                        c.address as customer_address,
                        c.created_by as customer_created_by,
                        ist.name as invitation_status_name,
                        co.name as care_of_name,
                        ua.name as attached_by_name,
                        (SELECT COUNT(*) FROM gifts g WHERE g.event_id = ec.event_id AND g.customer_id = ec.customer_id) as gift_count,
                        (SELECT COALESCE(SUM(g.value), 0) FROM gifts g WHERE g.event_id = ec.event_id AND g.customer_id = ec.customer_id) as total_gift_value
                    FROM event_customers ec
                    INNER JOIN customers c ON ec.customer_id = c.id
                    LEFT JOIN invitation_status ist ON ec.invitation_status_id = ist.id
                    LEFT JOIN care_of_options co ON ec.care_of_id = co.id
                    LEFT JOIN users ua ON ec.attached_by = ua.id
                    WHERE ec.event_id = :eventId";
            
            $params = ['eventId' => $eventId];
            
            // If admin, only show customers they created
            if ($adminId !== null) {
                $sql .= " AND c.created_by = :adminId";
                $params['adminId'] = $adminId;
            }
            
            $sql .= " ORDER BY ec.created_at DESC";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting event customers: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get all events a customer is attached to
     * 
     * @param string $customerId Customer UUID
     * @param Paginator|null $paginator
     * @return array|Paginator
     */
    public function getByCustomerId($customerId, $paginator = null) {
        try {
            if ($paginator) {
                $countSql = "SELECT COUNT(*) as total FROM event_customers WHERE customer_id = :customerId";
                $countStmt = $this->connection->prepare($countSql);
                $countStmt->execute(['customerId' => $customerId]);
                $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                $paginator->setTotal($total);
            }
            
            $sql = "SELECT 
                        ec.*,
                        e.name as event_name,
                        e.event_date,
                        e.event_type_id,
                        et.name as event_type_name,
                        e.event_category,
                        e.notes as event_notes,
                        ist.name as invitation_status_name,
                        co.name as care_of_name,
                        ua.name as attached_by_name,
                        g.id as gift_id,
                        g.gift_type_id,
                        gt.name as gift_type_name,
                        g.value as gift_value,
                        g.description as gift_description
                    FROM event_customers ec
                    INNER JOIN events e ON ec.event_id = e.id
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    LEFT JOIN invitation_status ist ON ec.invitation_status_id = ist.id
                    LEFT JOIN care_of_options co ON ec.care_of_id = co.id
                    LEFT JOIN users ua ON ec.attached_by = ua.id
                    LEFT JOIN gifts g ON g.event_id = ec.event_id AND g.customer_id = ec.customer_id
                    LEFT JOIN gift_types gt ON g.gift_type_id = gt.id
                    WHERE ec.customer_id = :customerId
                    ORDER BY e.event_date DESC";
            
            if ($paginator) {
                $sql .= " " . $paginator->getLimitClause();
            }
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['customerId' => $customerId]);
            
            $attachments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($paginator) {
                $paginator->setData($attachments);
                return $paginator;
            }
            
            return $attachments;
        } catch (PDOException $e) {
            error_log("Error getting customer events: " . $e->getMessage());
            if ($paginator) {
                $paginator->setTotal(0)->setData([]);
                return $paginator;
            }
            return [];
        }
    }
    
    /**
     * Get a single attachment by ID
     * 
     * @param string $id Attachment UUID
     * @return array|null
     */
    public function getById($id) {
        try {
            $sql = "SELECT 
                        ec.*,
                        e.name as event_name,
                        e.event_date,
                        e.event_type_id,
                        et.name as event_type_name,
                        e.event_category,
                        c.name as customer_name,
                        c.mobile_number as customer_mobile,
                        c.address as customer_address,
                        ist.name as invitation_status_name,
                        co.name as care_of_name,
                        ua.name as attached_by_name,
                        (SELECT COUNT(*) FROM gifts g WHERE g.event_id = ec.event_id AND g.customer_id = ec.customer_id) as gift_count,
                        (SELECT COALESCE(SUM(g.value), 0) FROM gifts g WHERE g.event_id = ec.event_id AND g.customer_id = ec.customer_id) as total_gift_value
                    FROM event_customers ec
                    INNER JOIN events e ON ec.event_id = e.id
                    INNER JOIN customers c ON ec.customer_id = c.id
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    LEFT JOIN invitation_status ist ON ec.invitation_status_id = ist.id
                    LEFT JOIN care_of_options co ON ec.care_of_id = co.id
                    LEFT JOIN users ua ON ec.attached_by = ua.id
                    WHERE ec.id = :id";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting attachment by ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Attach a customer to an event
     * 
     * @param array $data Attachment data
     * @return string|false Attachment ID or false
     */
    public function attach($data) {
        try {
            $id = $this->generateUUID();
            
            $sql = "INSERT INTO event_customers (
                        id, event_id, customer_id, invitation_status_id, care_of_id, attached_by
                    ) VALUES (
                        :id, :eventId, :customerId, :invitationStatusId, :careOfId, :attachedBy
                    )";
            
            $stmt = $this->connection->prepare($sql);
            $result = $stmt->execute([
                'id' => $id,
                'eventId' => $data['eventId'],
                'customerId' => $data['customerId'],
                'invitationStatusId' => $data['invitationStatusId'] ?? 1,
                'careOfId' => $data['careOfId'] ?? null,
                'attachedBy' => $data['attachedBy']
            ]);
            
            return $result ? $id : false;
        } catch (PDOException $e) {
            error_log("Error attaching customer to event: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update an attachment (invitation status, care of)
     * 
     * @param string $id Attachment UUID
     * @param array $data Updated data
     * @return bool
     */
    public function update($id, $data) {
        try {
            $updates = [];
            $params = ['id' => $id];
            
            if (isset($data['invitationStatusId'])) {
                $updates[] = "invitation_status_id = :invitationStatusId";
                $params['invitationStatusId'] = $data['invitationStatusId'];
            }
            
            if (array_key_exists('careOfId', $data)) {
                $updates[] = "care_of_id = :careOfId";
                $params['careOfId'] = $data['careOfId'];
            }
            
            if (empty($updates)) {
                return false;
            }
            
            $sql = "UPDATE event_customers SET " . implode(', ', $updates) . " WHERE id = :id";
            
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error updating attachment: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Detach a customer from an event (also deletes related gifts)
     * 
     * @param string $id Attachment UUID
     * @return bool
     */
    public function detach($id) {
        try {
            // First get the attachment details for gift cleanup
            $attachment = $this->getById($id);
            if (!$attachment) {
                return false;
            }
            
            // Delete related gifts first
            $deleteGiftsSql = "DELETE FROM gifts WHERE event_id = :eventId AND customer_id = :customerId";
            $deleteGiftsStmt = $this->connection->prepare($deleteGiftsSql);
            $deleteGiftsStmt->execute([
                'eventId' => $attachment['event_id'],
                'customerId' => $attachment['customer_id']
            ]);
            
            // Delete the attachment
            $sql = "DELETE FROM event_customers WHERE id = :id";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error detaching customer from event: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if attachment exists
     * 
     * @param string $id Attachment UUID
     * @param string|null $adminId Optional admin ID for ownership check
     * @return bool
     */
    public function exists($id, $adminId = null) {
        try {
            if ($adminId !== null) {
                $sql = "SELECT COUNT(*) as count FROM event_customers ec
                        INNER JOIN customers c ON ec.customer_id = c.id
                        WHERE ec.id = :id AND c.created_by = :adminId";
                $params = ['id' => $id, 'adminId' => $adminId];
            } else {
                $sql = "SELECT COUNT(*) as count FROM event_customers WHERE id = :id";
                $params = ['id' => $id];
            }
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking attachment existence: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if a customer is already attached to an event
     * 
     * @param string $eventId Event UUID
     * @param string $customerId Customer UUID
     * @return bool
     */
    public function isAttached($eventId, $customerId) {
        try {
            $sql = "SELECT COUNT(*) as count FROM event_customers 
                    WHERE event_id = :eventId AND customer_id = :customerId";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['eventId' => $eventId, 'customerId' => $customerId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking attachment: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Count customers attached to an event
     * 
     * @param string $eventId Event UUID
     * @return int
     */
    public function countByEvent($eventId) {
        try {
            $sql = "SELECT COUNT(*) as count FROM event_customers WHERE event_id = :eventId";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['eventId' => $eventId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)$result['count'];
        } catch (PDOException $e) {
            error_log("Error counting event customers: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Generate UUID
     */
    private function generateUUID() {
        return sprintf(
            '%s-%s-%s-%s-%s',
            bin2hex(random_bytes(4)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(6))
        );
    }
    
    /**
     * Format attachment for API response
     * 
     * @param array $attachment
     * @param string|null $eventCategory
     * @return array|null
     */
    public function formatForResponse($attachment, $eventCategory = null) {
        if (!$attachment) {
            return null;
        }
        
        $formatted = [
            'id' => $attachment['id'],
            'eventId' => $attachment['event_id'],
            'customerId' => $attachment['customer_id'],
            'invitationStatus' => [
                'id' => (int)$attachment['invitation_status_id'],
                'name' => $attachment['invitation_status_name'] ?? null
            ],
            'careOf' => $attachment['care_of_id'] ? [
                'id' => (int)$attachment['care_of_id'],
                'name' => $attachment['care_of_name'] ?? null
            ] : null,
            'attachedBy' => [
                'id' => $attachment['attached_by'],
                'name' => $attachment['attached_by_name'] ?? null
            ],
            'createdAt' => $attachment['created_at'],
            'updatedAt' => $attachment['updated_at'] ?? null
        ];
        
        // Include customer info if available
        if (isset($attachment['customer_name'])) {
            $formatted['customer'] = [
                'id' => $attachment['customer_id'],
                'name' => $attachment['customer_name'],
                'mobileNumber' => $attachment['customer_mobile'] ?? null,
                'address' => $attachment['customer_address'] ?? null
            ];
        }
        
        // Include event info if available
        if (isset($attachment['event_name'])) {
            $category = $eventCategory ?? ($attachment['event_category'] ?? null);
            $formatted['event'] = [
                'id' => $attachment['event_id'],
                'name' => $attachment['event_name'],
                'eventDate' => $attachment['event_date'] ?? null,
                'eventType' => isset($attachment['event_type_id']) ? [
                    'id' => (int)$attachment['event_type_id'],
                    'name' => $attachment['event_type_name'] ?? null
                ] : null,
                'eventCategory' => $category,
                'giftDirection' => $category === 'self_event' ? 'received' : 'given'
            ];
        }
        
        // Gift aggregates
        $category = $eventCategory ?? ($attachment['event_category'] ?? null);
        $formatted['giftDirection'] = $category === 'self_event' ? 'received' : 'given';
        if (isset($attachment['gift_count'])) {
            $formatted['giftCount'] = (int)$attachment['gift_count'];
            $formatted['totalGiftValue'] = (float)($attachment['total_gift_value'] ?? 0);
        } else {
            $formatted['giftCount'] = 0;
            $formatted['totalGiftValue'] = 0.0;
        }
        
        return $formatted;
    }
}
