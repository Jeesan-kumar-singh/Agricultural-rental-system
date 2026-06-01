<?php
class Equipment {
    private $conn;
    private $table_name = "equipment";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create a new listing
    public function create($owner_id, $name, $description, $category, $daily_rate, $image_url = null) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (owner_id, name, description, category, daily_rate, image_url) 
                  VALUES (:owner_id, :name, :description, :category, :daily_rate, :image_url)";

        $stmt = $this->conn->prepare($query);

        $name = htmlspecialchars(strip_tags($name));
        $description = htmlspecialchars(strip_tags($description));
        $category = htmlspecialchars(strip_tags($category));
        $daily_rate = floatval($daily_rate);
        $image_url = $image_url ? htmlspecialchars(strip_tags($image_url)) : null;

        $stmt->bindParam(":owner_id", $owner_id);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":category", $category);
        $stmt->bindParam(":daily_rate", $daily_rate);
        $stmt->bindParam(":image_url", $image_url);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Read all listings with optional filters
    public function readAll($filters = []) {
        $query = "SELECT e.*, u.name as owner_name 
                  FROM " . $this->table_name . " e
                  JOIN users u ON e.owner_id = u.id
                  WHERE 1=1";

        $params = [];

        // Category filter
        if (!empty($filters['category'])) {
            $query .= " AND e.category = :category";
            $params[':category'] = $filters['category'];
        }

        // Search query
        if (!empty($filters['search'])) {
            $query .= " AND (e.name LIKE :search OR e.description LIKE :search)";
            $params[':search'] = "%" . $filters['search'] . "%";
        }

        // Max price filter
        if (isset($filters['max_price']) && $filters['max_price'] !== '') {
            $query .= " AND e.daily_rate <= :max_price";
            $params[':max_price'] = floatval($filters['max_price']);
        }

        // Availability filter
        if (isset($filters['available'])) {
            $query .= " AND e.availability_status = :available";
            $params[':available'] = intval($filters['available']);
        }

        $query .= " ORDER BY e.created_at DESC";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => &$val) {
            $stmt->bindParam($key, $val);
        }

        $stmt->execute();
        return $stmt->fetchAll();
    }

    // Read details of a specific piece of equipment
    public function readOne($id) {
        $query = "SELECT e.*, u.name as owner_name, u.email as owner_email 
                  FROM " . $this->table_name . " e
                  JOIN users u ON e.owner_id = u.id
                  WHERE e.id = :id LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    // Read equipment belonging to a specific owner
    public function readByOwner($owner_id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE owner_id = :owner_id 
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":owner_id", $owner_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Update equipment listing details
    public function update($id, $data) {
        $fields = [];
        $params = [':id' => $id];

        $allowed_fields = ['name', 'description', 'category', 'daily_rate', 'availability_status', 'image_url'];

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                if ($field === 'daily_rate') {
                    $params[":$field"] = floatval($data[$field]);
                } elseif ($field === 'availability_status') {
                    $params[":$field"] = intval($data[$field]);
                } else {
                    $params[":$field"] = htmlspecialchars(strip_tags($data[$field]));
                }
            }
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE " . $this->table_name . " 
                  SET " . implode(', ', $fields) . " 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }

    // Delete equipment
    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}
