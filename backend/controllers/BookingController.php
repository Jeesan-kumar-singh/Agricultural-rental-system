<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Booking.php';
require_once __DIR__ . '/../models/Equipment.php';
require_once __DIR__ . '/../helpers/JWTHelper.php';

class BookingController {
    private $db;
    private $booking;
    private $equipment;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->booking = new Booking($this->db);
        $this->equipment = new Equipment($this->db);
    }

    // Get bookings for currently logged-in user (farmer sees own, owner sees requests)
    public function getMyBookings($userId, $userRole) {
        if ($userRole === 'owner' || $userRole === 'admin') {
            $items = $this->booking->readByOwner($userId);
        } else {
            $items = $this->booking->readByUser($userId);
        }
        
        http_response_code(200);
        return $items;
    }

    // Request a booking (Farmer only)
    public function createBooking($data, $userId, $userRole) {
        if ($userRole !== 'farmer') {
            http_response_code(403);
            return ["error" => "Access denied. Only farmers can book equipment."];
        }

        if (empty($data['equipment_id']) || empty($data['start_date']) || empty($data['end_date'])) {
            http_response_code(400);
            return ["error" => "Please complete equipment, start date, and end date."];
        }

        // Fetch equipment to compute cost
        $item = $this->equipment->readOne($data['equipment_id']);
        if (!$item) {
            http_response_code(404);
            return ["error" => "Equipment listing not found."];
        }

        if (!$item['availability_status']) {
            http_response_code(400);
            return ["error" => "Equipment is currently marked as unavailable."];
        }

        // Calculate days
        $start = new DateTime($data['start_date']);
        $end = new DateTime($data['end_date']);
        
        if ($start > $end) {
            http_response_code(400);
            return ["error" => "Start date cannot be after end date."];
        }
        
        // Add 1 day for inclusive rental
        $interval = $start->diff($end);
        $days = $interval->days + 1;
        
        $totalCost = $days * floatval($item['daily_rate']);

        // Create booking
        $result = $this->booking->create($userId, $data['equipment_id'], $data['start_date'], $data['end_date'], $totalCost);
        
        if (isset($result['error'])) {
            http_response_code(409);
            return ["error" => $result['error']];
        }

        if ($result && isset($result['id'])) {
            http_response_code(201);
            return [
                "message" => "Booking request submitted successfully.",
                "booking_id" => $result['id'],
                "total_cost" => $totalCost
            ];
        }

        http_response_code(500);
        return ["error" => "Failed to submit booking request."];
    }

    // Update booking status (Approve/Reject by Owner, Cancel by Farmer)
    public function updateBookingStatus($id, $status, $userId, $userRole) {
        $allowed_statuses = ['approved', 'rejected', 'completed', 'cancelled'];
        if (!in_array($status, $allowed_statuses)) {
            http_response_code(400);
            return ["error" => "Invalid booking status change request."];
        }

        $bookingDetails = $this->booking->readOne($id);
        if (!$bookingDetails) {
            http_response_code(404);
            return ["error" => "Booking request not found."];
        }

        // Authorization checks
        if ($status === 'cancelled') {
            // Renter (farmer) can cancel their pending/approved booking
            if (intval($bookingDetails['user_id']) !== intval($userId)) {
                http_response_code(403);
                return ["error" => "Access denied. You cannot cancel someone else's booking."];
            }
        } else {
            // Owner can approve, reject, or complete
            if ($userRole !== 'admin' && intval($bookingDetails['owner_id']) !== intval($userId)) {
                http_response_code(403);
                return ["error" => "Access denied. Only the equipment owner can manage this request."];
            }
        }

        if ($this->booking->updateStatus($id, $status)) {
            http_response_code(200);
            return [
                "message" => "Booking status updated successfully to $status."
            ];
        }

        http_response_code(500);
        return ["error" => "Failed to update booking status."];
    }
}
