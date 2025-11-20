# Swagger API Documentation

## Access Points

- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/
- **JSON Schema**: http://localhost:8000/swagger.json

## Complete API Endpoints with Swagger Documentation

### 🔐 Authentication Endpoints

#### POST `/api/auth/login/`
**Login and obtain JWT tokens**

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

#### POST `/api/auth/refresh/`
**Refresh JWT access token**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### GET `/api/auth/profile/`
**Get current user profile**

**Headers:** `Authorization: Bearer <access_token>`

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

### 📋 Purchase Request Endpoints

#### GET `/api/requests/`
**List purchase requests (role-filtered)**

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

#### POST `/api/requests/`
**Create new purchase request (Staff only)**

**Content-Type:** `multipart/form-data`

**Fields:**
- `title`: Request title
- `description`: Request description
- `amount`: Total amount
- `proforma`: File upload (optional)
- `items`: JSON array of items

**Example:**
```
title: "Office Supplies"
description: "Monthly office supplies order"
amount: 1500.00
proforma: <file>
items: [{"name": "Paper", "quantity": 10, "unit_price": 25.00}]
```

#### GET `/api/requests/{id}/`
**Get purchase request details**

#### PUT `/api/requests/{id}/`
**Update purchase request (Staff only, pending requests)**

#### PATCH `/api/requests/{id}/approve/`
**Approve purchase request (Approvers only)**

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

#### PATCH `/api/requests/{id}/reject/`
**Reject purchase request (Approvers only)**

**Request Body:**
```json
{
  "comments": "Budget exceeded"
}
```

#### POST `/api/requests/{id}/submit-receipt/`
**Submit receipt for approved request (Staff only)**

**Content-Type:** `multipart/form-data`

**Fields:**
- `receipt`: Receipt file (PDF, JPG, PNG)

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

### 🤖 Document Processing Endpoints

#### POST `/api/documents/process/`
**Process document using AI/OCR**

**Content-Type:** `multipart/form-data`

**Fields:**
- `document`: Document file (PDF, JPG, PNG)
- `type`: Document type (`proforma` or `receipt`)

**Response:**
```json
{
  "message": "Document processed successfully",
  "extracted_data": {
    "vendor": "Office Depot",
    "total_amount": "1500.00",
    "items": [],
    "terms": "Net 30"
  }
}
```

## Swagger Features Implemented

### 📝 **Comprehensive Documentation**
- Operation descriptions for all endpoints
- Request/response examples
- Parameter documentation
- Error response codes

### 🏷️ **Organized Tags**
- **Authentication**: Login, profile, token management
- **Purchase Requests**: CRUD operations, approvals
- **Documents**: AI processing endpoints

### 🔒 **Security Schemes**
- JWT Bearer token authentication
- Role-based access documentation
- Permission requirements per endpoint

### 📊 **Schema Definitions**
- Complete model serializers
- Request/response schemas
- Validation rules documentation

### 🎯 **Interactive Testing**
- Try-it-out functionality
- Authentication integration
- File upload testing
- Real-time API testing

## Docker Integration

### 🐳 **Enhanced Docker Configuration**
- Health checks for all services
- Proper dependency management
- Environment variable documentation
- Volume management for persistence

### 🔍 **Health Monitoring**
- Database connection health checks
- Redis availability monitoring
- Application readiness probes
- Service dependency validation

### 📦 **Container Features**
- Multi-stage builds for optimization
- Security best practices
- Proper logging configuration
- Resource management

## Usage Examples

### 1. **Authentication Flow**
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "staff1", "password": "password123"}'

# Use token for authenticated requests
curl -X GET http://localhost:8000/api/requests/ \
  -H "Authorization: Bearer <access_token>"
```

### 2. **Create Request with File**
```bash
curl -X POST http://localhost:8000/api/requests/ \
  -H "Authorization: Bearer <token>" \
  -F "title=Test Request" \
  -F "description=Test Description" \
  -F "amount=100.00" \
  -F "proforma=@proforma.pdf"
```

### 3. **Approval Workflow**
```bash
# Approve as Level 1
curl -X PATCH http://localhost:8000/api/requests/1/approve/ \
  -H "Authorization: Bearer <approver1_token>" \
  -H "Content-Type: application/json" \
  -d '{"comments": "Approved by Level 1"}'

# Approve as Level 2 (triggers PO generation)
curl -X PATCH http://localhost:8000/api/requests/1/approve/ \
  -H "Authorization: Bearer <approver2_token>" \
  -H "Content-Type: application/json" \
  -d '{"comments": "Final approval"}'
```

### 4. **Document Processing**
```bash
curl -X POST http://localhost:8000/api/documents/process/ \
  -H "Authorization: Bearer <token>" \
  -F "document=@receipt.pdf" \
  -F "type=receipt"
```

## Demo Credentials for Testing

| Role | Username | Password | Swagger Login |
|------|----------|----------|---------------|
| Staff | staff1 | password123 | ✅ Can create/update requests |
| Approver L1 | approver1 | password123 | ✅ Can approve/reject requests |
| Approver L2 | approver2 | password123 | ✅ Final approval, PO generation |
| Finance | finance1 | password123 | ✅ View all requests |

Access Swagger UI at http://localhost:8000/swagger/ and use the "Authorize" button to test with different user roles.