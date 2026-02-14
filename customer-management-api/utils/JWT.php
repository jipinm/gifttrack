<?php
/**
 * JWT Token Management Class
 * Uses Firebase PHP-JWT library
 */

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;

class JWT {
    private static $config;
    
    /**
     * Load JWT configuration
     */
    private static function loadConfig() {
        if (self::$config === null) {
            self::$config = require __DIR__ . '/../config/jwt.php';
        }
        return self::$config;
    }
    
    /**
     * Generate JWT token
     * 
     * @param array $payload User data to encode in token
     * @return string JWT token
     */
    public static function generate($payload) {
        $config = self::loadConfig();
        
        $issuedAt = time();
        $expire = $issuedAt + $config['expiry'];
        
        $tokenPayload = [
            'iat' => $issuedAt,           // Issued at
            'exp' => $expire,              // Expiration time
            'iss' => $config['issuer'],    // Issuer
            'aud' => $config['audience'],  // Audience
            'data' => $payload             // User data
        ];
        
        return FirebaseJWT::encode(
            $tokenPayload,
            $config['secret'],
            $config['algorithm']
        );
    }
    
    /**
     * Validate and decode JWT token
     * 
     * @param string $token JWT token
     * @return object|null Decoded token data or null if invalid
     */
    public static function validate($token) {
        try {
            $config = self::loadConfig();
            
            $decoded = FirebaseJWT::decode(
                $token,
                new Key($config['secret'], $config['algorithm'])
            );
            
            // Verify issuer and audience
            if ($decoded->iss !== $config['issuer'] || $decoded->aud !== $config['audience']) {
                return null;
            }
            
            return $decoded;
            
        } catch (Exception $e) {
            error_log("JWT validation error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Decode token without validation (use cautiously)
     * 
     * @param string $token JWT token
     * @return object|null Decoded token data
     */
    public static function decode($token) {
        try {
            $config = self::loadConfig();
            
            return FirebaseJWT::decode(
                $token,
                new Key($config['secret'], $config['algorithm'])
            );
            
        } catch (Exception $e) {
            error_log("JWT decode error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Extract token from Authorization header
     * 
     * @return string|null Token or null if not found
     */
    public static function getTokenFromHeader() {
        // Try multiple methods to get Authorization header
        $authHeader = null;
        
        // Method 1: getallheaders() if available
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            }
        }
        
        // Method 2: $_SERVER['HTTP_AUTHORIZATION']
        if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        
        // Method 3: Apache-specific
        if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        // Method 4: apache_request_headers()
        if (!$authHeader && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            }
        }
        
        // Extract Bearer token
        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }
        
        return null;
    }
    
    /**
     * Get user data from token
     * 
     * @param string $token JWT token
     * @return array|null User data or null
     */
    public static function getUserData($token) {
        $decoded = self::validate($token);
        
        if ($decoded && isset($decoded->data)) {
            return (array) $decoded->data;
        }
        
        return null;
    }
}
