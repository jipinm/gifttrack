<?php
/**
 * Input Validation Helper Class
 */

class Validator {
    private $errors = [];
    
    /**
     * Validate required field
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     * @param string $label Human-readable field name
     */
    public function required($field, $value, $label = null) {
        $label = $label ?? $field;
        
        if (empty($value) && $value !== '0' && $value !== 0) {
            $this->errors[$field] = "$label is required";
        }
        
        return $this;
    }
    
    /**
     * Validate mobile number (10 digits)
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     */
    public function mobileNumber($field, $value) {
        if (!empty($value) && !preg_match('/^[0-9]{10}$/', $value)) {
            $this->errors[$field] = "Mobile number must be 10 digits";
        }
        
        return $this;
    }
    
    /**
     * Validate minimum length
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     * @param int $min Minimum length
     */
    public function minLength($field, $value, $min, $label = null) {
        $label = $label ?? $field;
        
        if (!empty($value) && strlen($value) < $min) {
            $this->errors[$field] = "$label must be at least $min characters";
        }
        
        return $this;
    }
    
    /**
     * Validate maximum length
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     * @param int $max Maximum length
     */
    public function maxLength($field, $value, $max, $label = null) {
        $label = $label ?? $field;
        
        if (!empty($value) && strlen($value) > $max) {
            $this->errors[$field] = "$label must not exceed $max characters";
        }
        
        return $this;
    }
    
    /**
     * Validate email format
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     */
    public function email($field, $value) {
        if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "Invalid email format";
        }
        
        return $this;
    }
    
    /**
     * Validate date format (YYYY-MM-DD)
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     */
    public function date($field, $value) {
        if (!empty($value)) {
            $date = DateTime::createFromFormat('Y-m-d', $value);
            if (!$date || $date->format('Y-m-d') !== $value) {
                $this->errors[$field] = "Invalid date format. Use YYYY-MM-DD";
            }
        }
        
        return $this;
    }
    
    /**
     * Validate numeric value
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     */
    public function numeric($field, $value, $label = null) {
        $label = $label ?? $field;
        
        if (!empty($value) && !is_numeric($value)) {
            $this->errors[$field] = "$label must be a number";
        }
        
        return $this;
    }
    
    /**
     * Validate positive number
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     */
    public function positive($field, $value, $label = null) {
        $label = $label ?? $field;
        
        if (!empty($value) && (is_numeric($value) && $value <= 0)) {
            $this->errors[$field] = "$label must be a positive number";
        }
        
        return $this;
    }
    
    /**
     * Validate value in array
     * 
     * @param string $field Field name
     * @param mixed $value Field value
     * @param array $allowed Allowed values
     */
    public function inArray($field, $value, $allowed, $label = null) {
        $label = $label ?? $field;
        
        if (!empty($value) && !in_array($value, $allowed, true)) {
            $allowedStr = implode(', ', $allowed);
            $this->errors[$field] = "$label must be one of: $allowedStr";
        }
        
        return $this;
    }
    
    /**
     * Add custom error
     * 
     * @param string $field Field name
     * @param string $message Error message
     */
    public function addError($field, $message) {
        $this->errors[$field] = $message;
        return $this;
    }
    
    /**
     * Check if validation passed
     * 
     * @return bool True if no errors
     */
    public function passes() {
        return empty($this->errors);
    }
    
    /**
     * Check if validation failed
     * 
     * @return bool True if has errors
     */
    public function fails() {
        return !empty($this->errors);
    }
    
    /**
     * Get all errors
     * 
     * @return array Validation errors
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * Static method to validate mobile number
     * 
     * @param string $value Mobile number
     * @return bool True if valid
     */
    public static function validateMobileNumber($value) {
        return !empty($value) && preg_match('/^[0-9]{10}$/', $value);
    }
    
    /**
     * Sanitize string input
     * 
     * @param string $value Input value
     * @return string Sanitized value
     */
    public static function sanitize($value) {
        return strip_tags(trim($value));
    }
    
    /**
     * Sanitize array of inputs
     * 
     * @param array $data Input data
     * @return array Sanitized data
     */
    public static function sanitizeArray($data) {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeArray($value);
            } else {
                $sanitized[$key] = self::sanitize($value);
            }
        }
        
        return $sanitized;
    }
}
