<?php
class JWTHelper {
    private static $secret_key = "agri_rental_super_secure_secret_key_123!";

    // Generate JWT
    public static function generateToken($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        // Add expiration (default 24 hours)
        if (!isset($payload['exp'])) {
            $payload['exp'] = time() + (24 * 60 * 60);
        }
        
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    // Verify and Decode JWT
    public static function decodeToken($token) {
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            return false;
        }
        
        $header = self::base64UrlDecode($tokenParts[0]);
        $payload = self::base64UrlDecode($tokenParts[1]);
        $signatureProvided = $tokenParts[2];
        
        // Verify expiration
        $payloadData = json_decode($payload, true);
        if (!$payloadData || (isset($payloadData['exp']) && $payloadData['exp'] < time())) {
            return false;
        }
        
        // Verify signature
        $base64UrlHeader = self::base64UrlEncode(json_encode(json_decode($header, true)));
        $base64UrlPayload = self::base64UrlEncode(json_encode($payloadData));
        $signatureCheck = hash_hmac('sha256', $tokenParts[0] . "." . $tokenParts[1], self::$secret_key, true);
        $base64UrlSignatureCheck = self::base64UrlEncode($signatureCheck);
        
        if ($signatureProvided === $base64UrlSignatureCheck) {
            return $payloadData;
        }
        
        return false;
    }

    // Get bearer token from request headers
    public static function getBearerToken() {
        $headers = self::getRequestHeaders();
        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    private static function getRequestHeaders() {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (substr($key, 0, 5) <> 'HTTP_') {
                continue;
            }
            $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
            $headers[$header] = $value;
        }
        
        // Alternative if apache_request_headers is available
        if (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            $headers = array_merge($headers, $requestHeaders);
        }
        
        return $headers;
    }

    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
