<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/JWTHelper.php';

class AuthController {
    private $db;
    private $user;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }

    // Register a new user
    public function register($data) {
        if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            http_response_code(400);
            return ["error" => "Please complete all fields."];
        }

        // Validate role
        $allowed_roles = ['farmer', 'owner'];
        if (!in_array($data['role'], $allowed_roles)) {
            http_response_code(400);
            return ["error" => "Invalid user role."];
        }

        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            return ["error" => "Invalid email format."];
        }

        // Check if email already exists
        if ($this->user->emailExists($data['email'])) {
            http_response_code(409);
            return ["error" => "Email already registered."];
        }

        // Create the user
        $userId = $this->user->create($data['name'], $data['email'], $data['password'], $data['role']);
        if ($userId) {
            http_response_code(201);
            return [
                "message" => "User registered successfully.",
                "user" => [
                    "id" => $userId,
                    "name" => $data['name'],
                    "email" => $data['email'],
                    "role" => $data['role']
                ]
            ];
        }

        http_response_code(500);
        return ["error" => "Failed to register user."];
    }

    // Login user and return JWT
    public function login($data) {
        if (empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            return ["error" => "Please complete all fields."];
        }

        // Verify credentials
        if ($this->user->emailExists($data['email']) && password_verify($data['password'], $this->user->password_hash)) {
            // Generate payload for JWT
            $payload = [
                "id" => $this->user->id,
                "name" => $this->user->name,
                "email" => $data['email'],
                "role" => $this->user->role
            ];

            $token = JWTHelper::generateToken($payload);

            http_response_code(200);
            return [
                "message" => "Login successful.",
                "token" => $token,
                "user" => $payload
            ];
        }

        http_response_code(401);
        return ["error" => "Invalid email or password."];
    }
}
