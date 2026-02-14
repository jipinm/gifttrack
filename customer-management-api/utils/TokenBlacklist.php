<?php
/**
 * Token Blacklist
 * Stores invalidated tokens to prevent reuse after logout
 */

class TokenBlacklist {
    private static $instance = null;
    private $storageFile;
    private $blacklist = [];
    
    private function __construct() {
        $this->storageFile = __DIR__ . '/../logs/token-blacklist.json';
        $this->load();
        $this->cleanup(); // Remove expired tokens on load
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Load blacklist from file
     */
    private function load() {
        if (file_exists($this->storageFile)) {
            $content = file_get_contents($this->storageFile);
            $this->blacklist = json_decode($content, true) ?: [];
        }
    }
    
    /**
     * Save blacklist to file
     */
    private function save() {
        $dir = dirname($this->storageFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($this->storageFile, json_encode($this->blacklist, JSON_PRETTY_PRINT));
    }
    
    /**
     * Add token to blacklist
     * @param string $token JWT token
     * @param int $expiresAt Token expiration timestamp
     */
    public function add($token, $expiresAt = null) {
        // Store hash of token instead of full token for security
        $tokenHash = hash('sha256', $token);
        
        // If no expiration provided, default to 24 hours
        if ($expiresAt === null) {
            $expiresAt = time() + 86400;
        }
        
        $this->blacklist[$tokenHash] = [
            'added_at' => time(),
            'expires_at' => $expiresAt
        ];
        
        $this->save();
    }
    
    /**
     * Check if token is blacklisted
     * @param string $token JWT token
     * @return bool True if blacklisted
     */
    public function isBlacklisted($token) {
        $tokenHash = hash('sha256', $token);
        return isset($this->blacklist[$tokenHash]);
    }
    
    /**
     * Remove expired tokens from blacklist
     */
    public function cleanup() {
        $now = time();
        $changed = false;
        
        foreach ($this->blacklist as $hash => $data) {
            if ($data['expires_at'] < $now) {
                unset($this->blacklist[$hash]);
                $changed = true;
            }
        }
        
        if ($changed) {
            $this->save();
        }
    }
    
    /**
     * Clear all blacklisted tokens
     */
    public function clear() {
        $this->blacklist = [];
        $this->save();
    }
    
    /**
     * Get count of blacklisted tokens
     */
    public function count() {
        return count($this->blacklist);
    }
}

/**
 * Helper function to check if token is blacklisted
 * @param string $token JWT token
 * @return bool True if blacklisted
 */
function isTokenBlacklisted($token) {
    return TokenBlacklist::getInstance()->isBlacklisted($token);
}

/**
 * Helper function to blacklist a token
 * @param string $token JWT token
 * @param int $expiresAt Token expiration timestamp
 */
function blacklistToken($token, $expiresAt = null) {
    TokenBlacklist::getInstance()->add($token, $expiresAt);
}
