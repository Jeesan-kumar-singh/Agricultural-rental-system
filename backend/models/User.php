<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $name;
    public $email;
    public $password_hash;
    public $role;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Register user
    public function create($name, $email, $password, $role) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (name, email, password_hash, role) 
                  VALUES (:name, :email, :password_hash, :role)";

        $stmt = $this->conn->prepare($query);

        // Sanitize & hash
        $name = htmlspecialchars(strip_tags($name));
        $email = htmlspecialchars(strip_tags($email));
        $role = htmlspecialchars(strip_tags($role));
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        // Bind
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password_hash", $password_hash);
        $stmt->bindParam(":role", $role);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Check if email already exists
    public function emailExists($email) {
        $query = "SELECT id, name, password_hash, role 
                  FROM " . $this->table_name . " 
                  WHERE email = :email LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $email = htmlspecialchars(strip_tags($email));
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->password_hash = $row['password_hash'];
            $this->role = $row['role'];
            return true;
        }

        return false;
    }

    // Find user by ID
    public function findById($id) {
        $query = "SELECT id, name, email, role, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return null;
    }
}
