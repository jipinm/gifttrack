<?php
/**
 * Pagination Utility
 * Helps paginate database query results
 */

class Paginator {
    private $page;
    private $perPage;
    private $total;
    private $data;
    
    /**
     * Create paginator instance
     * @param int $page Current page number (1-based)
     * @param int $perPage Items per page
     */
    public function __construct($page = 1, $perPage = 20) {
        $this->page = max(1, (int)$page);
        $this->perPage = max(1, min(100, (int)$perPage)); // Max 100 items per page
    }
    
    /**
     * Get SQL LIMIT clause
     * @return string SQL LIMIT clause
     */
    public function getLimitClause() {
        $offset = ($this->page - 1) * $this->perPage;
        return "LIMIT {$this->perPage} OFFSET {$offset}";
    }
    
    /**
     * Get offset value
     * @return int Offset value
     */
    public function getOffset() {
        return ($this->page - 1) * $this->perPage;
    }
    
    /**
     * Get limit value
     * @return int Limit value
     */
    public function getLimit() {
        return $this->perPage;
    }
    
    /**
     * Set total count of items
     * @param int $total Total count
     * @return self
     */
    public function setTotal($total) {
        $this->total = (int)$total;
        return $this;
    }
    
    /**
     * Set data array
     * @param array $data Data array
     * @return self
     */
    public function setData($data) {
        $this->data = $data;
        return $this;
    }
    
    /**
     * Get total pages
     * @return int Total pages
     */
    public function getTotalPages() {
        if (!isset($this->total)) {
            return 0;
        }
        return (int)ceil($this->total / $this->perPage);
    }
    
    /**
     * Check if there's a next page
     * @return bool
     */
    public function hasNext() {
        return $this->page < $this->getTotalPages();
    }
    
    /**
     * Check if there's a previous page
     * @return bool
     */
    public function hasPrevious() {
        return $this->page > 1;
    }
    
    /**
     * Get next page number
     * @return int|null
     */
    public function getNextPage() {
        return $this->hasNext() ? $this->page + 1 : null;
    }
    
    /**
     * Get previous page number
     * @return int|null
     */
    public function getPreviousPage() {
        return $this->hasPrevious() ? $this->page - 1 : null;
    }
    
    /**
     * Get pagination metadata
     * @return array Pagination metadata
     */
    public function getMeta() {
        return [
            'current_page' => $this->page,
            'per_page' => $this->perPage,
            'total' => $this->total ?? 0,
            'total_pages' => $this->getTotalPages(),
            'from' => $this->total > 0 ? (($this->page - 1) * $this->perPage) + 1 : 0,
            'to' => min($this->page * $this->perPage, $this->total ?? 0),
            'has_next' => $this->hasNext(),
            'has_previous' => $this->hasPrevious(),
            'next_page' => $this->getNextPage(),
            'previous_page' => $this->getPreviousPage()
        ];
    }
    
    /**
     * Get pagination links
     * @param string $baseUrl Base URL for links
     * @param array $params Additional query parameters
     * @return array Pagination links
     */
    public function getLinks($baseUrl, $params = []) {
        $buildUrl = function($page) use ($baseUrl, $params) {
            $params['page'] = $page;
            $params['perPage'] = $this->perPage;
            $query = http_build_query($params);
            return $baseUrl . '?' . $query;
        };
        
        $links = [
            'first' => $buildUrl(1),
            'last' => $buildUrl($this->getTotalPages()),
            'prev' => $this->hasPrevious() ? $buildUrl($this->getPreviousPage()) : null,
            'next' => $this->hasNext() ? $buildUrl($this->getNextPage()) : null,
            'self' => $buildUrl($this->page)
        ];
        
        return array_filter($links); // Remove null values
    }
    
    /**
     * Get paginated response format
     * @param string $baseUrl Base URL for links
     * @param array $params Additional query parameters
     * @return array Complete paginated response
     */
    public function toArray($baseUrl = '', $params = []) {
        $response = [
            'data' => $this->data ?? [],
            'meta' => $this->getMeta()
        ];
        
        if ($baseUrl) {
            $response['links'] = $this->getLinks($baseUrl, $params);
        }
        
        return $response;
    }
    
    /**
     * Create paginator from request parameters
     * @param array $params Request parameters (e.g., $_GET)
     * @param int $defaultPerPage Default items per page
     * @return Paginator
     */
    public static function fromRequest($params, $defaultPerPage = 20) {
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $perPage = isset($params['perPage']) ? (int)$params['perPage'] : $defaultPerPage;
        
        return new self($page, $perPage);
    }
}

/**
 * Helper function to create paginator from request
 * @param int $defaultPerPage Default items per page
 * @return Paginator
 */
function paginate($defaultPerPage = 20) {
    return Paginator::fromRequest($_GET, $defaultPerPage);
}
