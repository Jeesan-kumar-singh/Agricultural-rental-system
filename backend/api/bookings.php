<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../controllers/BookingController.php';
require_once __DIR__ . '/../helpers/JWTHelper.php';

$method = $_SERVER['REQUEST_METHOD'];
$controller = new BookingController();

// Authorization middleware helper
function getAuthenticatedUser() {
    $token = JWTHelper::getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized access. No authorization token supplied."]);
        exit();
    }
    
    $decoded = JWTHelper::decodeToken($token);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized access. Invalid or expired token."]);
        exit();
    }
    return $decoded;
}

switch ($method) {
    case 'GET':
        $user = getAuthenticatedUser();
        $response = $controller->getMyBookings($user['id'], $user['role']);
        echo json_encode($response);
        break;

    case 'POST':
        $user = getAuthenticatedUser();
        $data = json_decode(file_get_contents("php://input"), true);
        $response = $controller->createBooking($data, $user['id'], $user['role']);
        echo json_encode($response);
        break;

    case 'PUT':
        $user = getAuthenticatedUser();
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Booking ID is required in URL query string."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['status'])) {
            http_response_code(400);
            echo json_encode(["error" => "Status parameter is required."]);
            exit();
        }

        $response = $controller->updateBookingStatus(
            intval($_GET['id']), 
            $data['status'], 
            $user['id'], 
            $user['role']
        );
        echo json_encode($response);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}
