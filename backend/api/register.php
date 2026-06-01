<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../controllers/AuthController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use POST."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$controller = new AuthController();
$response = $controller->register($data);

echo json_encode($response);
