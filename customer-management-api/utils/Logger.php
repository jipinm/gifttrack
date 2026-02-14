<?php
/**
 * Request Logger
 * Logs all API requests with details
 * 
 * Usage: require_once __DIR__ . '/utils/Logger.php';
 */

class Logger {
    private static $instance = null;
    private $logDir;
    private $maxFileSize = 10485760; // 10MB
    private $maxFiles = 10;
    
    private function __construct() {
        $this->logDir = __DIR__ . '/../logs';
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Log API request
     * @param array $data Request data
     */
    public function logRequest($data = []) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'user_id' => $data['user_id'] ?? null,
            'user_role' => $data['user_role'] ?? null,
            'status_code' => http_response_code(),
            'execution_time' => $data['execution_time'] ?? null,
        ];
        
        $logFile = $this->logDir . '/api-requests-' . date('Y-m-d') . '.log';
        $logLine = json_encode($logData) . "\n";
        
        file_put_contents($logFile, $logLine, FILE_APPEND);
        $this->rotateIfNeeded($logFile);
    }
    
    /**
     * Log authentication attempt
     * @param string $mobileNumber User mobile number
     * @param bool $success Success status
     * @param string $message Optional message
     */
    public function logAuth($mobileNumber, $success, $message = '') {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'mobile_number' => $mobileNumber,
            'ip' => $_SERVER['REMOTE_ADDR'],
            'success' => $success,
            'message' => $message,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ];
        
        $logFile = $this->logDir . '/auth-' . date('Y-m-d') . '.log';
        $logLine = json_encode($logData) . "\n";
        
        file_put_contents($logFile, $logLine, FILE_APPEND);
        $this->rotateIfNeeded($logFile);
    }
    
    /**
     * Log error
     * @param string $message Error message
     * @param Exception|null $exception Exception object
     * @param array $context Additional context
     */
    public function logError($message, $exception = null, $context = []) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => 'ERROR',
            'message' => $message,
            'uri' => $_SERVER['REQUEST_URI'] ?? 'CLI',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'CLI',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'localhost',
            'context' => $context
        ];
        
        if ($exception) {
            $logData['exception'] = [
                'message' => $exception->getMessage(),
                'code' => $exception->getCode(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ];
        }
        
        $logFile = $this->logDir . '/errors-' . date('Y-m-d') . '.log';
        $logLine = json_encode($logData, JSON_PRETTY_PRINT) . "\n" . str_repeat('-', 80) . "\n";
        
        file_put_contents($logFile, $logLine, FILE_APPEND);
        $this->rotateIfNeeded($logFile);
    }
    
    /**
     * Log database query
     * @param string $query SQL query
     * @param float $executionTime Execution time in seconds
     * @param array $params Query parameters
     */
    public function logQuery($query, $executionTime, $params = []) {
        // Only log slow queries (> 1 second)
        if ($executionTime < 1.0) {
            return;
        }
        
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'query' => $query,
            'execution_time' => round($executionTime, 4) . 's',
            'params' => $params,
            'uri' => $_SERVER['REQUEST_URI'] ?? 'CLI'
        ];
        
        $logFile = $this->logDir . '/slow-queries-' . date('Y-m-d') . '.log';
        $logLine = json_encode($logData, JSON_PRETTY_PRINT) . "\n" . str_repeat('-', 80) . "\n";
        
        file_put_contents($logFile, $logLine, FILE_APPEND);
        $this->rotateIfNeeded($logFile);
    }
    
    /**
     * Log info message
     * @param string $message Info message
     * @param array $context Additional context
     */
    public function logInfo($message, $context = []) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => 'INFO',
            'message' => $message,
            'context' => $context
        ];
        
        $logFile = $this->logDir . '/info-' . date('Y-m-d') . '.log';
        $logLine = json_encode($logData) . "\n";
        
        file_put_contents($logFile, $logLine, FILE_APPEND);
        $this->rotateIfNeeded($logFile);
    }
    
    /**
     * Rotate log file if it exceeds max size
     * @param string $logFile Log file path
     */
    private function rotateIfNeeded($logFile) {
        if (!file_exists($logFile)) {
            return;
        }
        
        if (filesize($logFile) < $this->maxFileSize) {
            return;
        }
        
        // Rotate files
        $baseName = $logFile;
        
        // Delete oldest file
        $oldestFile = $baseName . '.' . $this->maxFiles;
        if (file_exists($oldestFile)) {
            unlink($oldestFile);
        }
        
        // Shift existing rotated files
        for ($i = $this->maxFiles - 1; $i >= 1; $i--) {
            $oldFile = $baseName . '.' . $i;
            $newFile = $baseName . '.' . ($i + 1);
            if (file_exists($oldFile)) {
                rename($oldFile, $newFile);
            }
        }
        
        // Rotate current file
        rename($logFile, $baseName . '.1');
    }
    
    /**
     * Clean up old log files (older than 30 days)
     */
    public function cleanup($days = 30) {
        $cutoffTime = time() - ($days * 24 * 60 * 60);
        $files = glob($this->logDir . '/*.log*');
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
    }
    
    /**
     * Get log statistics
     * @return array Statistics
     */
    public function getStats() {
        $files = glob($this->logDir . '/*.log');
        $totalSize = 0;
        $fileCount = 0;
        
        foreach ($files as $file) {
            $totalSize += filesize($file);
            $fileCount++;
        }
        
        return [
            'total_files' => $fileCount,
            'total_size' => $totalSize,
            'total_size_mb' => round($totalSize / 1048576, 2),
            'log_directory' => $this->logDir
        ];
    }
}

// Global logging functions for convenience
function logRequest($data = []) {
    Logger::getInstance()->logRequest($data);
}

function logAuth($mobileNumber, $success, $message = '') {
    Logger::getInstance()->logAuth($mobileNumber, $success, $message);
}

function logError($message, $exception = null, $context = []) {
    Logger::getInstance()->logError($message, $exception, $context);
}

function logInfo($message, $context = []) {
    Logger::getInstance()->logInfo($message, $context);
}

function logQuery($query, $executionTime, $params = []) {
    Logger::getInstance()->logQuery($query, $executionTime, $params);
}
