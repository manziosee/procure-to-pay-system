# Procure-to-Pay API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require JWT authentication except login.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### Login
```http
POST /auth/login/
```

**Request Body:**
```json
{
  "username": "staff1",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Get Profile
```http
GET /auth/profile/
```

**Response:**
```json
{
  "id": 1,
  "username": "staff1",
  "email": "staff1@example.com",
  "first_name": "John",
  "last_name": "Staff",
  "role": "staff",
  "department": ""
}
```

### Purchase Requests

#### Create Request
```http
POST /requests/
```

**Request Body (multipart/form-data):**
```
title: "Office Supplies"
description: "Monthly office supplies order"
amount: 1500.00
proforma: <file>
items: [
  {
    "name": "Printer Paper",
    "quantity": 10,
    "unit_price": 25.00
  }
]
```

**Response:**
```json
{
  "id": 1,
  "title": "Office Supplies",
  "description": "Monthly office supplies order",
  "amount": "1500.00",
  "status": "pending",
  "created_by": 1,
  "created_by_name": "John Staff",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "proforma": "/media/proformas/file.pdf",
  "purchase_order": null,
  "receipt": null,
  "items": [
    {
      "id": 1,
      "name": "Printer Paper",
      "quantity": 10,
      "unit_price": "25.00",
      "total_price": "250.00"
    }
  ],
  "approvals": [],
  "proforma_data": {
    "vendor": "Office Depot",
    "total_amount": "1500.00"
  }
}
```

#### List Requests
```http
GET /requests/
```

**Query Parameters:**
- `status`: Filter by status (pending, approved, rejected)
- `page`: Page number for pagination

**Response:**
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/requests/?page=2",
  "previous": null,
  "results": [...]
}
```

#### Get Request Details
```http
GET /requests/{id}/
```

#### Update Request (Staff only, pending requests)
```http
PUT /requests/{id}/
```

#### Approve Request (Approvers only)
```http
PATCH /requests/{id}/approve/
```

**Request Body:**
```json
{
  "comments": "Approved for procurement"
}
```

**Response:**
```json
{
  "message": "Request approved successfully",
  "request": {...}
}
```

#### Reject Request (Approvers only)
```http
PATCH /requests/{id}/reject/
```

**Request Body:**
```json
{
  "comments": "Budget exceeded"
}
```

#### Submit Receipt (Staff only, approved requests)
```http
POST /requests/{id}/submit-receipt/
```

**Request Body (multipart/form-data):**
```
receipt: <file>
```

**Response:**
```json
{
  "message": "Receipt submitted successfully",
  "validation_results": {
    "valid": true,
    "discrepancies": [],
    "warnings": []
  },
  "request": {...}
}
```

### Document Processing

#### Process Document
```http
POST /documents/process/
```

**Request Body (multipart/form-data):**
```
document: <file>
type: "proforma" | "receipt"
```

**Response:**
```json
{
  "extracted_data": {
    "vendor": "Office Depot",
    "total_amount": "1500.00",
    "items": [...],
    "terms": "Net 30"
  }
}
```

## User Roles & Permissions

### Staff
- Create purchase requests
- View own requests
- Update pending requests
- Submit receipts for approved requests

### Approver Level 1
- View pending requests
- Approve/reject requests
- View approval history

### Approver Level 2
- View pending requests (approved by Level 1)
- Final approve/reject requests
- View approval history
- Triggers automatic PO generation

### Finance
- View all requests
- Access financial reports
- Upload files

## Status Workflow

1. **pending** → Created by staff
2. **pending** → Approved by Level 1 → Still pending
3. **pending** → Approved by Level 2 → **approved** (PO generated)
4. **pending** → Rejected by any approver → **rejected**
5. **approved/rejected** → Status cannot be changed

## Error Responses

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Demo Users

| Username | Password | Role |
|----------|----------|------|
| staff1 | password123 | Staff |
| approver1 | password123 | Approver Level 1 |
| approver2 | password123 | Approver Level 2 |
| finance1 | password123 | Finance |