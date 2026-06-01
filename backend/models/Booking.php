<?php
class Booking {
    private $conn;
    private $table_name = "bookings";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Check if equipment is available for a given date range (prevent double booking)
    public function isAvailable($equipment_id, $start_date, $end_date) {
        $query = "SELECT COUNT(*) as count 
                  FROM " . $this->table_name . " 
                  WHERE equipment_id = :equipment_id 
                  AND status NOT IN ('rejected', 'cancelled')
                  AND (
                      (start_date <= :end_date AND end_date >= :start_date)
                  )";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":equipment_id", $equipment_id);
        $stmt->bindParam(":start_date", $start_date);
        $stmt->bindParam(":end_date", $end_date);
        $stmt->execute();
        
        $row = $stmt->fetch();
        return intval($row['count']) === 0;
    }

    // Create a new booking
    public function create($user_id, $equipment_id, $start_date, $end_date, $total_cost) {
        // Validate date availability
        if (!$this->isAvailable($equipment_id, $start_date, $end_date)) {
            return ["error" => "Equipment is already booked for these dates."];
        }

        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, equipment_id, start_date, end_date, total_cost, status) 
                  VALUES (:user_id, :equipment_id, :start_date, :end_date, :total_cost, 'pending')";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":equipment_id", $equipment_id);
        $stmt->bindParam(":start_date", $start_date);
        $stmt->bindParam(":end_date", $end_date);
        $stmt->bindParam(":total_cost", $total_cost);

        if ($stmt->execute()) {
            return ["id" => $this->conn->lastInsertId()];
        }
        return false;
    }

    // Read bookings made by a specific farmer
    public function readByUser($user_id) {
        $query = "SELECT b.*, e.name as equipment_name, e.category as equipment_category, 
                         e.image_url as equipment_image, u.name as owner_name
                  FROM " . $this->table_name . " b
                  JOIN equipment e ON b.equipment_id = e.id
                  JOIN users u ON e.owner_id = u.id
                  WHERE b.user_id = :user_id 
                  ORDER BY b.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Read booking requests received by an owner for their equipment
    public function readByOwner($owner_id) {
        $query = "SELECT b.*, e.name as equipment_name, e.category as equipment_category, 
                         e.daily_rate, u.name as farmer_name, u.email as farmer_email
                  FROM " . $this->table_name . " b
                  JOIN equipment e ON b.equipment_id = e.id
                  JOIN users u ON b.user_id = u.id
                  WHERE e.owner_id = :owner_id 
                  ORDER BY b.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":owner_id", $owner_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Read a single booking
    public function readOne($id) {
        $query = "SELECT b.*, e.owner_id, e.name as equipment_name, e.daily_rate 
                  FROM " . $this->table_name . " b
                  JOIN equipment e ON b.equipment_id = e.id
                  WHERE b.id = :id LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    // Update status of a booking (e.g. approve, reject, cancel)
    public function updateStatus($id, $status) {
        $query = "UPDATE " . $this->table_name . " 
                  SET status = :status 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $id);
        
        return $stmt->execute();
    }
}
