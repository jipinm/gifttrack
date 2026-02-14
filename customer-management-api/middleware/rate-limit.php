<?php
/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 * 
 * Usage: require_once __DIR__ . '/middleware/rate-limit.php';
 */

class RateLimiter {
    private static $instance = null;
    private $storage = [];
    private $storageFile;
    
    // Rate limit configuration
    private $limits = [
        'login' => ['max' => 5, 'window' => 300],        // 5 attempts per 5 minutes
        'api' => ['max' => 100, 'window' => 60],         // 100 requests per minute
        'default' => ['max' => 60, 'window' => 60]       // 60 requests per minute
    ];
    
    private function __construct() {
        $this->storageFile = __DIR__ . '/../logs/rate-limit.json';
        $this->loadStorage();
        $this->cleanup();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Check if request should be rate limited
     * @param string $identifier User identifier (IP, user ID, etc.)
     * @param string $type Request type (login, api, default)
     * @return bool True if allowed, false if rate limited
     */
    public function check($identifier, $type = 'default') {
        $key = $this->getKey($identifier, $type);
        $limit = $this->limits[$type] ?? $this->limits['default'];
        
        $now = time();
        
        // Get or initialize storage for this key
        if (!isset($this->storage[$key])) {
            $this->storage[$key] = [
                'count' => 0,
                'reset_at' => $now + $limit['window']
            ];
        }
        
        $entry = $this->storage[$key];
        
        // Reset if window expired
        if ($now >= $entry['reset_at']) {
            $this->storage[$key] = [
                'count' => 1,
                'reset_at' => $now + $limit['window']
            ];
            $this->saveStorage();
            return true;
        }
        
        // Check if limit exceeded
        if ($entry['count'] >= $limit['max']) {
            $this->logRateLimitExceeded($identifier, $type, $entry['reset_at']);
            return false;
        }
        
        // Increment counter
        $this->storage[$key]['count']++;
        $this->saveStorage();
        return true;
    }
    
    /**
     * Get remaining requests for identifier
     * @param string $identifier User identifier
     * @param string $type Request type
     * @return array Remaining count and reset time
     */
    public function getRemaining($identifier, $type = 'default') {
        $key = $this->getKey($identifier, $type);
        $limit = $this->limits[$type] ?? $this->limits['default'];
        
        if (!isset($this->storage[$key])) {
            return [
                'remaining' => $limit['max'],
                'reset_at' => time() + $limit['window']
            ];
        }
        
        $entry = $this->storage[$key];
        $now = time();
        
        if ($now >= $entry['reset_at']) {
            return [
                'remaining' => $limit['max'],
                'reset_at' => $now + $limit['window']
            ];
        }
        
        return [
            'remaining' => max(0, $limit['max'] - $entry['count']),
            'reset_at' => $entry['reset_at']
        ];
    }
    
    /**
     * Reset rate limit for identifier
     * @param string $identifier User identifier
     * @param string $type Request type
     */
    public function reset($identifier, $type = 'default') {
        $key = $this->getKey($identifier, $type);
        unset($this->storage[$key]);
        $this->saveStorage();
    }
    
    private function getKey($identifier, $type) {
        return md5($type . ':' . $identifier);
    }
    
    private function loadStorage() {
        if (file_exists($this->storageFile)) {
            $data = file_get_contents($this->storageFile);
            $this->storage = json_decode($data, true) ?: [];
        }
    }
    
    private function saveStorage() {
        $dir = dirname($this->storageFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($this->storageFile, json_encode($this->storage));
    }
    
    private function cleanup() {
        $now = time();
        $cleaned = false;
        
        foreach ($this->storage as $key => $entry) {
            if ($now >= $entry['reset_at']) {
                unset($this->storage[$key]);
                $cleaned = true;
            }
        }
        
        if ($cleaned) {
            $this->saveStorage();
        }
    }
    
    private function logRateLimitExceeded($identifier, $type, $resetAt) {
        $logFile = __DIR__ . '/../logs/rate-limit-exceeded.log';
        $timestamp = date('Y-m-d H:i:s');
        $resetTime = date('Y-m-d H:i:s', $resetAt);
        $message = "[$timestamp] Rate limit exceeded - Type: $type, Identifier: $identifier, Reset at: $resetTime\n";
        
        $dir = dirname($logFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        file_put_contents($logFile, $message, FILE_APPEND);
    }
}

// Helper function for easy rate limiting
function checkRateLimit($type = 'default') {
    $limiter = RateLimiter::getInstance();
    
    // Use IP address as identifier, or user ID if authenticated
    $identifier = $_SERVER['REMOTE_ADDR'];
    
    // Check if authenticated and use user ID instead
    if (isset($GLOBALS['authUser']) && isset($GLOBALS['authUser']['id'])) {
        $identifier = $GLOBALS['authUser']['id'];
    }
    
    if (!$limiter->check($identifier, $type)) {
        $remaining = $limiter->getRemaining($identifier, $type);
        $retryAfter = $remaining['reset_at'] - time();
        
        http_response_code(429);
        header('Retry-After: ' . $retryAfter);
        header('X-RateLimit-Limit: ' . ($type === 'login' ? 5 : 100));
        header('X-RateLimit-Remaining: 0');
        header('X-RateLimit-Reset: ' . $remaining['reset_at']);
        
        echo json_encode([
            'success' => false,
            'error' => 'Too many requests. Please try again later.',
            'retry_after' => $retryAfter
        ]);
        exit;
    }
    
    // Add rate limit headers to response
    $remaining = $limiter->getRemaining($identifier, $type);
    header('X-RateLimit-Limit: ' . ($type === 'login' ? 5 : 100));
    header('X-RateLimit-Remaining: ' . $remaining['remaining']);
    header('X-RateLimit-Reset: ' . $remaining['reset_at']);
}
