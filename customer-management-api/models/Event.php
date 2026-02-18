<?php
/**
 * Event Model
 * Handles database operations for standalone events
 * 
 * Events can be managed by Super Admin (all events) or Admin (own events only).
 * Events can be of category: self_event or customer_event
 * Customers are attached to events via event_customers pivot table
 * Supports soft delete via deleted_at column
 */

class Event {
    private $connection;
    
    public function __construct() {
        $this->connection = Database::getInstance()->getConnection();
    }
    
    /**
     * Get all events with optional filters
     * 
     * @param array $filters Optional filters (search, eventTypeId, eventCategory, dateFrom, dateTo)
     * @param Paginator|null $paginator
     * @return array|Paginator
     */
    public function getAll($filters = [], $paginator = null) {
        try {
            $whereClause = "WHERE e.deleted_at IS NULL";
            $params = [];
            
            // Search filter (event name)
            if (isset($filters['search']) && !empty(trim($filters['search']))) {
                $whereClause .= " AND e.name LIKE :search";
                $params['search'] = '%' . $filters['search'] . '%';
            }
            
            // Event type filter
            if (!empty($filters['eventTypeId'])) {
                $whereClause .= " AND e.event_type_id = :eventTypeId";
                $params['eventTypeId'] = $filters['eventTypeId'];
            }
            
            // Event category filter
            if (!empty($filters['eventCategory'])) {
                $whereClause .= " AND e.event_category = :eventCategory";
                $params['eventCategory'] = $filters['eventCategory'];
            }
            
            // Time frame filter (upcoming / past) — auto-sets date boundaries
            // This takes precedence; explicit dateFrom/dateTo can still further narrow
            if (!empty($filters['timeFrame'])) {
                $today = date('Y-m-d');
                if ($filters['timeFrame'] === 'upcoming') {
                    // Today and onwards
                    $whereClause .= " AND e.event_date >= :timeFrameDate";
                    $params['timeFrameDate'] = $today;
                } elseif ($filters['timeFrame'] === 'past') {
                    // Before today
                    $whereClause .= " AND e.event_date < :timeFrameDate";
                    $params['timeFrameDate'] = $today;
                }
            }
            
            // Date from filter (can work alongside timeFrame for further narrowing)
            if (!empty($filters['dateFrom'])) {
                $whereClause .= " AND e.event_date >= :dateFrom";
                $params['dateFrom'] = $filters['dateFrom'];
            }
            
            // Date to filter
            if (!empty($filters['dateTo'])) {
                $whereClause .= " AND e.event_date <= :dateTo";
                $params['dateTo'] = $filters['dateTo'];
            }
            
            // Determine sort order
            $sortOrder = 'DESC'; // default: most recent first
            if (!empty($filters['sortOrder']) && in_array(strtoupper($filters['sortOrder']), ['ASC', 'DESC'])) {
                $sortOrder = strtoupper($filters['sortOrder']);
            } elseif (!empty($filters['timeFrame'])) {
                // Auto-sort based on time frame
                $sortOrder = ($filters['timeFrame'] === 'upcoming') ? 'ASC' : 'DESC';
            }
            
            // If paginator is provided, get total count first
            if ($paginator) {
                $countSql = "SELECT COUNT(*) as total FROM events e " . $whereClause;
                $countStmt = $this->connection->prepare($countSql);
                $countStmt->execute($params);
                $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                $paginator->setTotal($total);
            }
            
            $sql = "SELECT 
                        e.*,
                        et.name as event_type_name,
                        u.name as created_by_name,
                        (SELECT COUNT(*) FROM event_customers ec WHERE ec.event_id = e.id) as customer_count,
                        (SELECT COALESCE(SUM(g.value), 0) FROM gifts g WHERE g.event_id = e.id) as total_gift_value,
                        (SELECT COUNT(*) FROM gifts g WHERE g.event_id = e.id) as gift_count
                    FROM events e
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    LEFT JOIN users u ON e.created_by = u.id
                    " . $whereClause . "
                    ORDER BY e.event_date " . $sortOrder . ", e.created_at " . $sortOrder;
            
            if ($paginator) {
                $sql .= " " . $paginator->getLimitClause();
            }
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($paginator) {
                $paginator->setData($events);
                return $paginator;
            }
            
            return $events;
        } catch (PDOException $e) {
            error_log("Error getting all events: " . $e->getMessage());
            if ($paginator) {
                $paginator->setTotal(0)->setData([]);
                return $paginator;
            }
            return [];
        }
    }
    
    /**
     * Get event by ID with attached customers and gifts
     * 
     * @param string $id Event UUID
     * @return array|null
     */
    public function getById($id) {
        try {
            $sql = "SELECT 
                        e.*,
                        et.name as event_type_name,
                        u.name as created_by_name,
                        (SELECT COUNT(*) FROM event_customers ec WHERE ec.event_id = e.id) as customer_count,
                        (SELECT COUNT(*) FROM gifts g WHERE g.event_id = e.id) as gift_count,
                        (SELECT COALESCE(SUM(g.value), 0) FROM gifts g WHERE g.event_id = e.id) as total_gift_value
                    FROM events e
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    LEFT JOIN users u ON e.created_by = u.id
                    WHERE e.id = :id AND e.deleted_at IS NULL LIMIT 1";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$event) {
                return null;
            }
            
            // Get attached customers with gift aggregates (no gift JOIN to avoid row duplication)
            $customersSql = "SELECT 
                                ec.*,
                                c.name as customer_name,
                                c.mobile_number as customer_mobile,
                                c.address as customer_address,
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
                            WHERE ec.event_id = :eventId
                            ORDER BY ec.created_at DESC";
            
            $customersStmt = $this->connection->prepare($customersSql);
            $customersStmt->execute(['eventId' => $id]);
            $event['customers'] = $customersStmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $event;
        } catch (PDOException $e) {
            error_log("Error getting event by ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Create a new event
     * 
     * @param array $data Event data
     * @return string|false Event ID or false on failure
     */
    public function create($data) {
        try {
            $id = $this->generateUUID();
            
            $sql = "INSERT INTO events (
                        id, name, event_date, event_type_id, event_category, notes, created_by
                    ) VALUES (
                        :id, :name, :eventDate, :eventTypeId, :eventCategory, :notes, :createdBy
                    )";
            
            $stmt = $this->connection->prepare($sql);
            $result = $stmt->execute([
                'id' => $id,
                'name' => $data['name'],
                'eventDate' => $data['eventDate'],
                'eventTypeId' => $data['eventTypeId'],
                'eventCategory' => $data['eventCategory'] ?? 'self_event',
                'notes' => $data['notes'] ?? null,
                'createdBy' => $data['createdBy']
            ]);
            
            return $result ? $id : false;
        } catch (PDOException $e) {
            error_log("Error creating event: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update an event
     * 
     * @param string $id Event UUID
     * @param array $data Updated data
     * @return bool
     */
    public function update($id, $data) {
        try {
            $updates = [];
            $params = ['id' => $id];
            
            if (isset($data['name'])) {
                $updates[] = "name = :name";
                $params['name'] = $data['name'];
            }
            
            if (isset($data['eventDate'])) {
                $updates[] = "event_date = :eventDate";
                $params['eventDate'] = $data['eventDate'];
            }
            
            if (isset($data['eventTypeId'])) {
                $updates[] = "event_type_id = :eventTypeId";
                $params['eventTypeId'] = $data['eventTypeId'];
            }
            
            if (isset($data['eventCategory'])) {
                $updates[] = "event_category = :eventCategory";
                $params['eventCategory'] = $data['eventCategory'];
            }
            
            if (array_key_exists('notes', $data)) {
                $updates[] = "notes = :notes";
                $params['notes'] = $data['notes'];
            }
            
            if (empty($updates)) {
                return false;
            }
            
            $sql = "UPDATE events SET " . implode(', ', $updates) . " WHERE id = :id";
            
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error updating event: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Soft delete an event (sets deleted_at timestamp)
     * 
     * @param string $id Event UUID
     * @return bool
     */
    public function delete($id) {
        try {
            $sql = "UPDATE events SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error soft-deleting event: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if event exists
     * 
     * @param string $id Event UUID
     * @return bool
     */
    public function exists($id) {
        try {
            $sql = "SELECT COUNT(*) as count FROM events WHERE id = :id AND deleted_at IS NULL";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking event existence: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get event category
     * 
     * @param string $id Event UUID
     * @return string|null 'self_event' or 'customer_event'
     */
    public function getCategory($id) {
        try {
            $sql = "SELECT event_category FROM events WHERE id = :id AND deleted_at IS NULL";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['event_category'] : null;
        } catch (PDOException $e) {
            error_log("Error getting event category: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get the created_by user ID for an event
     * 
     * @param string $id Event UUID
     * @return string|null User UUID who created the event
     */
    public function getCreatedBy($id) {
        try {
            $sql = "SELECT created_by FROM events WHERE id = :id AND deleted_at IS NULL";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['created_by'] : null;
        } catch (PDOException $e) {
            error_log("Error getting event creator: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get events by date (for notifications)
     * 
     * @param string $date Date in YYYY-MM-DD format
     * @return array
     */
    public function getByDate($date) {
        try {
            $sql = "SELECT 
                        e.*,
                        et.name as event_type_name,
                        (SELECT COUNT(*) FROM event_customers ec WHERE ec.event_id = e.id) as customer_count
                    FROM events e
                    LEFT JOIN event_types et ON e.event_type_id = et.id
                    WHERE e.event_date = :eventDate AND e.deleted_at IS NULL
                    ORDER BY e.name ASC";
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute(['eventDate' => $date]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting events by date: " . $e->getMessage());
            return [];
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
     * Format event data for API response
     * 
     * @param array $event Event data from database
     * @return array|null
     */
    public function formatForResponse($event) {
        if (!$event) {
            return null;
        }
        
        $formatted = [
            'id' => $event['id'],
            'name' => $event['name'],
            'eventDate' => $event['event_date'],
            'eventType' => [
                'id' => (int)$event['event_type_id'],
                'name' => $event['event_type_name'] ?? null
            ],
            'eventCategory' => $event['event_category'],
            'giftDirection' => $event['event_category'] === 'self_event' ? 'received' : 'given',
            'notes' => $event['notes'],
            'createdBy' => [
                'id' => $event['created_by'],
                'name' => $event['created_by_name'] ?? null
            ],
            'createdAt' => $event['created_at'],
            'updatedAt' => $event['updated_at'] ?? null
        ];
        
        // Add aggregate counts if available
        if (isset($event['customer_count'])) {
            $formatted['customerCount'] = (int)$event['customer_count'];
        }
        if (isset($event['gift_count'])) {
            $formatted['giftCount'] = (int)$event['gift_count'];
        }
        if (isset($event['total_gift_value'])) {
            $formatted['totalGiftValue'] = (float)$event['total_gift_value'];
        }
        
        // Format attached customers if available
        if (isset($event['customers'])) {
            $formatted['customers'] = array_map(function($ec) use ($event) {
                $customer = [
                    'id' => $ec['id'],
                    'eventId' => $ec['event_id'],
                    'customerId' => $ec['customer_id'],
                    'customer' => [
                        'id' => $ec['customer_id'],
                        'name' => $ec['customer_name'],
                        'mobileNumber' => $ec['customer_mobile'] ?? null,
                        'address' => $ec['customer_address'] ?? null
                    ],
                    'invitationStatus' => [
                        'id' => (int)$ec['invitation_status_id'],
                        'name' => $ec['invitation_status_name'] ?? null
                    ],
                    'careOf' => $ec['care_of_id'] ? [
                        'id' => (int)$ec['care_of_id'],
                        'name' => $ec['care_of_name'] ?? null
                    ] : null,
                    'giftDirection' => $event['event_category'] === 'self_event' ? 'received' : 'given',
                    'giftCount' => (int)($ec['gift_count'] ?? 0),
                    'totalGiftValue' => (float)($ec['total_gift_value'] ?? 0),
                    'attachedBy' => [
                        'id' => $ec['attached_by'],
                        'name' => $ec['attached_by_name'] ?? null
                    ],
                    'createdAt' => $ec['created_at']
                ];
                
                return $customer;
            }, $event['customers']);
        }
        
        return $formatted;
    }
}
