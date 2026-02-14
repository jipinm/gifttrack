<?php
/**
 * Simple Cache Implementation
 * File-based caching for API responses and database queries
 */

class Cache {
    private static $instance = null;
    private $cacheDir;
    private $defaultTTL = 3600; // 1 hour default
    
    private function __construct() {
        $this->cacheDir = __DIR__ . '/../cache';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get cached data
     * @param string $key Cache key
     * @return mixed|null Cached data or null if not found/expired
     */
    public function get($key) {
        $filename = $this->getCacheFilename($key);
        
        if (!file_exists($filename)) {
            return null;
        }
        
        $data = unserialize(file_get_contents($filename));
        
        // Check if expired
        if ($data['expires_at'] < time()) {
            unlink($filename);
            return null;
        }
        
        return $data['value'];
    }
    
    /**
     * Set cached data
     * @param string $key Cache key
     * @param mixed $value Data to cache
     * @param int $ttl Time to live in seconds
     * @return bool Success status
     */
    public function set($key, $value, $ttl = null) {
        $ttl = $ttl ?? $this->defaultTTL;
        $filename = $this->getCacheFilename($key);
        
        $data = [
            'value' => $value,
            'expires_at' => time() + $ttl,
            'created_at' => time()
        ];
        
        return file_put_contents($filename, serialize($data)) !== false;
    }
    
    /**
     * Check if key exists and is valid
     * @param string $key Cache key
     * @return bool
     */
    public function has($key) {
        return $this->get($key) !== null;
    }
    
    /**
     * Delete cached data
     * @param string $key Cache key
     * @return bool Success status
     */
    public function delete($key) {
        $filename = $this->getCacheFilename($key);
        
        if (file_exists($filename)) {
            return unlink($filename);
        }
        
        return true;
    }
    
    /**
     * Clear all cache
     * @return bool Success status
     */
    public function clear() {
        $files = glob($this->cacheDir . '/*.cache');
        foreach ($files as $file) {
            unlink($file);
        }
        return true;
    }
    
    /**
     * Clear cache by tag pattern
     * @param string $pattern Glob pattern (e.g., "customers_*")
     * @return int Number of files deleted
     */
    public function clearByPattern($pattern) {
        $files = glob($this->cacheDir . '/' . md5($pattern) . '*.cache');
        $count = 0;
        foreach ($files as $file) {
            if (unlink($file)) {
                $count++;
            }
        }
        return $count;
    }
    
    /**
     * Remember: Get from cache or execute callback and cache result
     * @param string $key Cache key
     * @param callable $callback Function to execute if cache miss
     * @param int $ttl Time to live
     * @return mixed Result from cache or callback
     */
    public function remember($key, $callback, $ttl = null) {
        $value = $this->get($key);
        
        if ($value !== null) {
            return $value;
        }
        
        $value = $callback();
        $this->set($key, $value, $ttl);
        
        return $value;
    }
    
    /**
     * Clean up expired cache files
     * @return int Number of files deleted
     */
    public function cleanup() {
        $files = glob($this->cacheDir . '/*.cache');
        $count = 0;
        
        foreach ($files as $file) {
            $data = unserialize(file_get_contents($file));
            if ($data['expires_at'] < time()) {
                unlink($file);
                $count++;
            }
        }
        
        return $count;
    }
    
    /**
     * Get cache statistics
     * @return array Statistics
     */
    public function getStats() {
        $files = glob($this->cacheDir . '/*.cache');
        $totalSize = 0;
        $validCount = 0;
        $expiredCount = 0;
        
        foreach ($files as $file) {
            $totalSize += filesize($file);
            $data = unserialize(file_get_contents($file));
            
            if ($data['expires_at'] < time()) {
                $expiredCount++;
            } else {
                $validCount++;
            }
        }
        
        return [
            'total_files' => count($files),
            'valid_entries' => $validCount,
            'expired_entries' => $expiredCount,
            'total_size' => $totalSize,
            'total_size_mb' => round($totalSize / 1048576, 2),
            'cache_directory' => $this->cacheDir
        ];
    }
    
    private function getCacheFilename($key) {
        return $this->cacheDir . '/' . md5($key) . '.cache';
    }
}

// Global cache functions
function cache_get($key) {
    return Cache::getInstance()->get($key);
}

function cache_set($key, $value, $ttl = null) {
    return Cache::getInstance()->set($key, $value, $ttl);
}

function cache_remember($key, $callback, $ttl = null) {
    return Cache::getInstance()->remember($key, $callback, $ttl);
}

function cache_forget($key) {
    return Cache::getInstance()->delete($key);
}

function cache_flush() {
    return Cache::getInstance()->clear();
}
