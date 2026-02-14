<?php
/**
 * URL Rewriting Test Script
 * Tests all URL patterns configured in .htaccess
 */

echo "=== URL REWRITING TEST RESULTS ===\n\n";

// Test 1: Current request URI
echo "1. Current Request URI:\n";
echo "   Original: {$_SERVER['REQUEST_URI']}\n";
echo "   Script: {$_SERVER['SCRIPT_NAME']}\n";
echo "   Path Info: " . ($_SERVER['PATH_INFO'] ?? 'N/A') . "\n\n";

// Test 2: Query parameters
echo "2. Query Parameters:\n";
if (!empty($_GET)) {
    foreach ($_GET as $key => $value) {
        echo "   $key = $value\n";
    }
} else {
    echo "   (none)\n";
}
echo "\n";

// Test 3: HTTP Method
echo "3. HTTP Method: {$_SERVER['REQUEST_METHOD']}\n\n";

// Test 4: Headers
echo "4. Key Headers:\n";
echo "   Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'N/A') . "\n";
echo "   Authorization: " . (isset($_SERVER['HTTP_AUTHORIZATION']) ? 'Present' : 'Not present') . "\n\n";

// Test 5: Rewrite verification
echo "5. URL Rewriting Status:\n";
if (strpos($_SERVER['REQUEST_URI'], '.php') === false && 
    strpos($_SERVER['SCRIPT_NAME'], '.php') !== false) {
    echo "   ✓ URL REWRITING ACTIVE - Clean URL routed to PHP file\n";
} else if (strpos($_SERVER['REQUEST_URI'], '.php') !== false) {
    echo "   ✓ DIRECT PHP ACCESS - Using .php extension\n";
} else {
    echo "   ? UNKNOWN STATE\n";
}

echo "\n=== END TEST ===\n";
