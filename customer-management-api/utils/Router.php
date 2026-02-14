<?php
/**
 * Simple Router Class
 * Handles RESTful routing with dynamic parameters
 * 
 * Usage Example:
 * $router = new Router();
 * $router->get('/api/customers', function() { ... });
 * $router->post('/api/customers', function() { ... });
 * $router->get('/api/customers/{id}', function($id) { ... });
 * $router->run();
 */

class Router {
    private $routes = [];
    private $basePath = '';
    
    /**
     * Constructor
     * @param string $basePath Base path for routing (e.g., '/api')
     */
    public function __construct($basePath = '') {
        $this->basePath = rtrim($basePath, '/');
    }
    
    /**
     * Register a GET route
     * @param string $path Route path (can include {param} placeholders)
     * @param callable $callback Function to execute
     */
    public function get($path, $callback) {
        $this->addRoute('GET', $path, $callback);
    }
    
    /**
     * Register a POST route
     * @param string $path Route path
     * @param callable $callback Function to execute
     */
    public function post($path, $callback) {
        $this->addRoute('POST', $path, $callback);
    }
    
    /**
     * Register a PUT route
     * @param string $path Route path
     * @param callable $callback Function to execute
     */
    public function put($path, $callback) {
        $this->addRoute('PUT', $path, $callback);
    }
    
    /**
     * Register a DELETE route
     * @param string $path Route path
     * @param callable $callback Function to execute
     */
    public function delete($path, $callback) {
        $this->addRoute('DELETE', $path, $callback);
    }
    
    /**
     * Register a route for any HTTP method
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param string $path Route path
     * @param callable $callback Function to execute
     */
    private function addRoute($method, $path, $callback) {
        $path = $this->basePath . '/' . ltrim($path, '/');
        $pattern = $this->convertPathToRegex($path);
        
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'pattern' => $pattern,
            'callback' => $callback
        ];
    }
    
    /**
     * Convert route path to regex pattern
     * Converts {param} to named capture groups
     * 
     * @param string $path Route path with {param} placeholders
     * @return string Regex pattern
     */
    private function convertPathToRegex($path) {
        // Escape forward slashes
        $pattern = str_replace('/', '\/', $path);
        
        // Replace {param} with named capture group
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^\/]+)', $pattern);
        
        // Add anchors
        return '/^' . $pattern . '$/';
    }
    
    /**
     * Run the router - match current request to registered routes
     * @return mixed Result of the callback or false if no match
     */
    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        foreach ($this->routes as $route) {
            // Check if method matches
            if ($route['method'] !== $method) {
                continue;
            }
            
            // Check if path matches
            if (preg_match($route['pattern'], $uri, $matches)) {
                // Extract named parameters
                $params = array_filter($matches, function($key) {
                    return !is_numeric($key);
                }, ARRAY_FILTER_USE_KEY);
                
                // Execute callback with parameters
                return call_user_func_array($route['callback'], array_values($params));
            }
        }
        
        // No route matched
        return false;
    }
    
    /**
     * Get current request URI
     * @return string Current request URI without query string
     */
    public function getCurrentUri() {
        return parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    }
    
    /**
     * Get current HTTP method
     * @return string HTTP method (GET, POST, PUT, DELETE, etc.)
     */
    public function getCurrentMethod() {
        return $_SERVER['REQUEST_METHOD'];
    }
    
    /**
     * Get request body as JSON
     * @return array|null Decoded JSON data or null on failure
     */
    public function getJsonInput() {
        $json = file_get_contents('php://input');
        return json_decode($json, true);
    }
    
    /**
     * Get query parameter
     * @param string $key Parameter name
     * @param mixed $default Default value if not set
     * @return mixed Parameter value
     */
    public function query($key, $default = null) {
        return $_GET[$key] ?? $default;
    }
    
    /**
     * Redirect to another URL
     * @param string $url URL to redirect to
     * @param int $statusCode HTTP status code (default: 302)
     */
    public function redirect($url, $statusCode = 302) {
        header('Location: ' . $url, true, $statusCode);
        exit;
    }
    
    /**
     * Send JSON response
     * @param mixed $data Data to encode as JSON
     * @param int $statusCode HTTP status code
     */
    public function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    /**
     * Set 404 Not Found response
     * @param string $message Error message
     */
    public function notFound($message = 'Route not found') {
        $this->json([
            'success' => false,
            'error' => $message
        ], 404);
    }
    
    /**
     * Group routes with common prefix and middleware
     * @param string $prefix Path prefix for group
     * @param callable $callback Function to define routes
     */
    public function group($prefix, $callback) {
        $previousBasePath = $this->basePath;
        $this->basePath = $this->basePath . '/' . trim($prefix, '/');
        
        call_user_func($callback, $this);
        
        $this->basePath = $previousBasePath;
    }
    
    /**
     * Get all registered routes
     * @return array List of routes
     */
    public function getRoutes() {
        return array_map(function($route) {
            return [
                'method' => $route['method'],
                'path' => $route['path']
            ];
        }, $this->routes);
    }
}
