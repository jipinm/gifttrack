<?php
/**
 * API Response Helper Class
 * Standardized JSON responses
 */

class Response {
    /**
     * Recursively decode HTML entities in all string values.
     * Fixes legacy data stored with htmlspecialchars encoding (e.g. &#039; → ')
     *
     * @param mixed $data
     * @return mixed
     */
    private static function decodeHtmlEntities($data) {
        if (is_string($data)) {
            return html_entity_decode($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = self::decodeHtmlEntities($value);
            }
        }
        return $data;
    }

    /**
     * Send success response
     * 
     * @param mixed $data Response data
     * @param string $message Optional message
     * @param int $statusCode HTTP status code
     */
    public static function success($data = null, $message = '', $statusCode = 200) {
        http_response_code($statusCode);
        
        $response = ['success' => true];
        
        if ($data !== null) {
            $response['data'] = self::decodeHtmlEntities($data);
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * Send error response
     * 
     * @param string $error Error message
     * @param int $statusCode HTTP status code
     * @param array $details Optional error details
     */
    public static function error($error, $statusCode = 400, $details = null) {
        http_response_code($statusCode);
        
        $response = [
            'success' => false,
            'error' => $error
        ];
        
        if ($details !== null) {
            $response['details'] = $details;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * Send validation error response
     * 
     * @param array $errors Array of validation errors
     */
    public static function validationError($errors) {
        self::error('Validation failed', 400, $errors);
    }
    
    /**
     * Send unauthorized response
     * 
     * @param string $message Error message
     */
    public static function unauthorized($message = 'Unauthorized access') {
        self::error($message, 401);
    }
    
    /**
     * Send forbidden response
     * 
     * @param string $message Error message
     */
    public static function forbidden($message = 'Access forbidden') {
        self::error($message, 403);
    }
    
    /**
     * Send not found response
     * 
     * @param string $message Error message
     */
    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
    
    /**
     * Send server error response
     * 
     * @param string $message Error message
     */
    public static function serverError($message = 'Internal server error') {
        self::error($message, 500);
    }
    
    /**
     * Send method not allowed response
     * 
     * @param string $allowedMethods Comma-separated allowed methods
     */
    public static function methodNotAllowed($allowedMethods = 'GET, POST') {
        header("Allow: $allowedMethods");
        self::error('Method not allowed', 405);
    }
}
