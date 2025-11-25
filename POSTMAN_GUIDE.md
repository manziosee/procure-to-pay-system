# 📮 Postman Collection Guide

## 🚀 Quick Start

1. **Import Collection**: Import `Procure-to-Pay-API.postman_collection.json` into Postman
2. **Set Base URL**: Collection variable `baseUrl` is set to `http://localhost:8000`
3. **Login**: Run the "Login" request to get authentication tokens
4. **Test Endpoints**: All requests will automatically use the JWT token

## 🔐 Authentication Flow

### Demo Users (Auto-created)
- **Staff**: `staff1@example.com` / `password123`
- **Approver L1**: `approver1@example.com` / `password123`
- **Approver L2**: `approver2@example.com` / `password123`
- **Finance**: `finance1@example.com` / `password123`

### Login Process
1. Run **"Login"** request with demo credentials
2. Access token is automatically saved to `{{accessToken}}` variable
3. All subsequent requests use this token automatically

## 📋 Testing Workflow

### Complete Purchase Request Flow
1. **Login** as staff user
2. **Create Request** - Creates new purchase request (saves ID automatically)
3. **Get Request Details** - View created request
4. **Update Request** - Modify pending request
5. **Login** as approver1 and **Approve Request**
6. **Login** as approver2 and **Approve Request** (final approval)
7. **Login** back as staff and **Submit Receipt**

### Document Processing
1. **Process Document** - Upload and process any document
2. **Upload Proforma** - Specialized proforma processing
3. **Generate PO** - Create PO from proforma
4. **Validate Receipt** - Check receipt against PO

## 🔧 Collection Features

### Auto-Variables
- `{{baseUrl}}` - API base URL
- `{{accessToken}}` - JWT access token (auto-set on login)
- `{{refreshToken}}` - JWT refresh token (auto-set on login)
- `{{requestId}}` - Last created request ID (auto-set on create)

### Test Scripts
- **Login**: Automatically saves tokens
- **Create Request**: Automatically saves request ID
- All requests include proper error handling

## 📚 API Documentation

Access interactive documentation:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🐳 Docker Setup

```bash
# Start the application
docker-compose up --build

# Access endpoints
curl http://localhost:8000/health/
```

## 📝 Request Examples

### Create Purchase Request
```json
{
  "title": "Office Supplies Request",
  "description": "Need office supplies for Q1 2024",
  "amount": "500.00"
}
```

### Approve Request
```json
{
  "comments": "Approved for processing"
}
```

### File Upload (Form Data)
- Key: `file` (File)
- Key: `document_type` (Text): `proforma` or `receipt`

## 🔍 Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (login required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found

## 🎯 Testing Tips

1. **Always login first** to get authentication tokens
2. **Use different user roles** to test permissions
3. **Check request status** before trying to approve/update
4. **Upload actual files** for document processing endpoints
5. **Follow the approval workflow** (L1 → L2 → Approved)

## 🚨 Common Issues

- **401 Unauthorized**: Run login request first
- **403 Forbidden**: Check user role permissions
- **400 Bad Request**: Verify request body format
- **404 Not Found**: Check endpoint URL and IDs