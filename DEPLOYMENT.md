# Deployment Guide

## Quick Start with Docker

1. **Clone and start the application:**
```bash
git clone <repository-url>
cd procure-to-pay-system
docker-compose up --build
```

2. **Access the applications:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/swagger/

## Manual Setup

### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Run migrations:**
```bash
python manage.py migrate
python manage.py create_demo_users
python manage.py createsuperuser  # Optional
```

5. **Start server:**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm start
```

## Production Deployment

### AWS EC2 Deployment

1. **Launch EC2 instance** (Ubuntu 22.04 LTS)

2. **Install Docker:**
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```

3. **Clone and deploy:**
```bash
git clone <repository-url>
cd procure-to-pay-system
sudo docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

```env
SECRET_KEY=your-secure-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ip-address
DB_NAME=procure_to_pay
DB_USER=postgres
DB_PASSWORD=secure-password
OPENAI_API_KEY=your-openai-key
```

### Render Deployment

1. **Create new Web Service**
2. **Connect GitHub repository**
3. **Set build command:** `cd backend && pip install -r requirements.txt`
4. **Set start command:** `cd backend && python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT`
5. **Add environment variables**

### DigitalOcean App Platform

1. **Create new App**
2. **Connect GitHub repository**
3. **Configure build settings:**
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Run Command: `cd backend && python manage.py runserver 0.0.0.0:8080`

## Testing

### API Testing with curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "staff1", "password": "password123"}'

# Create request
curl -X POST http://localhost:8000/api/requests/ \
  -H "Authorization: Bearer <token>" \
  -F "title=Test Request" \
  -F "description=Test Description" \
  -F "amount=100.00"

# List requests
curl -X GET http://localhost:8000/api/requests/ \
  -H "Authorization: Bearer <token>"
```

## Features Implemented

✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Staff, Approver L1/L2, Finance)
- User profile management

✅ **Purchase Request Management**
- Create, read, update requests
- Multi-level approval workflow
- Status tracking (pending → approved/rejected)
- File uploads (proforma, PO, receipt)

✅ **AI-Powered Document Processing**
- OCR for image documents
- PDF text extraction
- OpenAI integration for data extraction
- Receipt validation against PO

✅ **Approval Workflow**
- Multi-level approvals required
- Any rejection → request rejected
- All approvals → automatic PO generation
- Immutable status once approved/rejected

✅ **API Endpoints**
- RESTful API with proper HTTP codes
- File upload support
- Pagination and filtering
- Comprehensive error handling

✅ **Containerization**
- Docker and docker-compose ready
- PostgreSQL and Redis integration
- Production-ready configuration

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Staff | staff1 | password123 |
| Approver L1 | approver1 | password123 |
| Approver L2 | approver2 | password123 |
| Finance | finance1 | password123 |

## API Documentation

- Swagger UI: http://localhost:8000/swagger/
- Detailed docs: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Troubleshooting

### Common Issues

1. **Database connection error:**
   - Ensure PostgreSQL is running
   - Check database credentials in .env

2. **File upload issues:**
   - Check media directory permissions
   - Verify MEDIA_ROOT settings

3. **AI processing errors:**
   - Verify OpenAI API key
   - Check file format support

### Logs

```bash
# Docker logs
docker-compose logs backend
docker-compose logs frontend

# Application logs
tail -f backend/logs/django.log
```