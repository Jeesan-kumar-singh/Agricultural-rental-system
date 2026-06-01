<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../controllers/EquipmentController.php';
require_once __DIR__ . '/../helpers/JWTHelper.php';

$method = $_SERVER['REQUEST_METHOD'];
$controller = new EquipmentController();

// Authentication middleware helper for write operations
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
        if (isset($_GET['id'])) {
            $response = $controller->getOne(intval($_GET['id']));
        } elseif (isset($_GET['owner_id'])) {
            // Read listings for a specific owner
            $response = $controller->getByOwner(intval($_GET['owner_id']));
        } else {
            // Read all catalogs with filters
            $filters = [
                'category' => isset($_GET['category']) ? $_GET['category'] : '',
                'search' => isset($_GET['search']) ? $_GET['search'] : '',
                'max_price' => isset($_GET['max_price']) ? $_GET['max_price'] : '',
                'available' => isset($_GET['available']) ? $_GET['available'] : null
            ];
            $response = $controller->getAll($filters);
        }
        echo json_encode($response);
        break;

    case 'POST':
        $user = getAuthenticatedUser();
        $data = json_decode(file_get_contents("php://input"), true);
        $response = $controller->createListing($data, $user['id'], $user['role']);
        echo json_encode($response);
        break;

    case 'PUT':
        $user = getAuthenticatedUser();
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Equipment ID is required in URL query string."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"), true);
        $response = $controller->updateListing(intval($_GET['id']), $data, $user['id'], $user['role']);
        echo json_encode($response);
        break;

    case 'DELETE':
        $user = getAuthenticatedUser();
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Equipment ID is required in URL query string."]);
            exit();
        }
        $response = $controller->deleteListing(intval($_GET['id']), $user['id'], $user['role']);
        echo json_encode($response);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}
