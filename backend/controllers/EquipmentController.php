<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Equipment.php';
require_once __DIR__ . '/../helpers/JWTHelper.php';

class EquipmentController {
    private $db;
    private $equipment;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->equipment = new Equipment($this->db);
    }

    // Get all equipment listings (filtered/searched)
    public function getAll($filters) {
        $items = $this->equipment->readAll($filters);
        http_response_code(200);
        return $items;
    }

    // Get a single equipment detail
    public function getOne($id) {
        $item = $this->equipment->readOne($id);
        if ($item) {
            http_response_code(200);
            return $item;
        }
        http_response_code(404);
        return ["error" => "Equipment listing not found."];
    }

    // Get owner specific listings
    public function getByOwner($owner_id) {
        $items = $this->equipment->readByOwner($owner_id);
        http_response_code(200);
        return $items;
    }

    // Create a new equipment listing (Owner only)
    public function createListing($data, $userId, $userRole) {
        if ($userRole !== 'owner' && $userRole !== 'admin') {
            http_response_code(403);
            return ["error" => "Access denied. Only owners/admins can list equipment."];
        }

        if (empty($data['name']) || empty($data['category']) || empty($data['daily_rate'])) {
            http_response_code(400);
            return ["error" => "Please complete name, category, and daily rate."];
        }

        $description = isset($data['description']) ? $data['description'] : '';
        $image_url = isset($data['image_url']) ? $data['image_url'] : null;

        $equipmentId = $this->equipment->create(
            $userId, 
            $data['name'], 
            $description, 
            $data['category'], 
            $data['daily_rate'], 
            $image_url
        );

        if ($equipmentId) {
            http_response_code(201);
            return [
                "message" => "Equipment listed successfully.",
                "equipment_id" => $equipmentId
            ];
        }

        http_response_code(500);
        return ["error" => "Failed to create equipment listing."];
    }

    // Update equipment listing (Owner/Admin only)
    public function updateListing($id, $data, $userId, $userRole) {
        // Fetch original listing to verify ownership
        $original = $this->equipment->readOne($id);
        if (!$original) {
            http_response_code(404);
            return ["error" => "Equipment listing not found."];
        }

        if ($userRole !== 'admin' && intval($original['owner_id']) !== intval($userId)) {
            http_response_code(403);
            return ["error" => "Access denied. You do not own this equipment listing."];
        }

        if ($this->equipment->update($id, $data)) {
            http_response_code(200);
            return ["message" => "Listing updated successfully."];
        }

        http_response_code(500);
        return ["error" => "Failed to update listing."];
    }

    // Delete equipment listing (Owner/Admin only)
    public function deleteListing($id, $userId, $userRole) {
        // Fetch original listing to verify ownership
        $original = $this->equipment->readOne($id);
        if (!$original) {
            http_response_code(404);
            return ["error" => "Equipment listing not found."];
        }

        if ($userRole !== 'admin' && intval($original['owner_id']) !== intval($userId)) {
            http_response_code(403);
            return ["error" => "Access denied. You do not own this equipment listing."];
        }

        if ($this->equipment->delete($id)) {
            http_response_code(200);
            return ["message" => "Listing deleted successfully."];
        }

        http_response_code(500);
        return ["error" => "Failed to delete listing."];
    }
}
