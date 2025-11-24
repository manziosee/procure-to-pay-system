from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

# Common response schemas
error_response = openapi.Response(
    description="Error response",
    schema=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'error': openapi.Schema(type=openapi.TYPE_STRING, description='Error message'),
            'details': openapi.Schema(type=openapi.TYPE_OBJECT, description='Error details')
        }
    )
)

validation_error_response = openapi.Response(
    description="Validation error",
    schema=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'field_name': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_STRING),
                description='Field validation errors'
            )
        }
    )
)

# Request schemas
purchase_request_create_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['title', 'description', 'amount'],
    properties={
        'title': openapi.Schema(
            type=openapi.TYPE_STRING,
            description='Request title (3-200 characters, no HTML)',
            example='Office Supplies Purchase'
        ),
        'description': openapi.Schema(
            type=openapi.TYPE_STRING,
            description='Detailed description (no HTML)',
            example='Purchase of office supplies including pens, paper, and folders'
        ),
        'amount': openapi.Schema(
            type=openapi.TYPE_NUMBER,
            format=openapi.FORMAT_DECIMAL,
            description='Total amount (0-1,000,000)',
            example=150.50
        ),
        'proforma': openapi.Schema(
            type=openapi.TYPE_FILE,
            description='Proforma document (PDF, JPG, PNG, max 10MB)',
        ),
        'items': openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'name': openapi.Schema(type=openapi.TYPE_STRING, example='Ballpoint Pens'),
                    'description': openapi.Schema(type=openapi.TYPE_STRING, example='Blue ink, pack of 10'),
                    'quantity': openapi.Schema(type=openapi.TYPE_INTEGER, example=5),
                    'unit_price': openapi.Schema(type=openapi.TYPE_NUMBER, example=12.50)
                }
            ),
            description='Request line items'
        )
    }
)

# Response schemas
purchase_request_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
        'title': openapi.Schema(type=openapi.TYPE_STRING, example='Office Supplies Purchase'),
        'description': openapi.Schema(type=openapi.TYPE_STRING),
        'amount': openapi.Schema(type=openapi.TYPE_STRING, example='150.50'),
        'status': openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=['pending', 'approved', 'rejected'],
            example='pending'
        ),
        'created_by': openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
        'created_by_name': openapi.Schema(type=openapi.TYPE_STRING, example='John Doe'),
        'created_at': openapi.Schema(
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_DATETIME,
            example='2024-01-15T10:30:00Z'
        ),
        'updated_at': openapi.Schema(
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_DATETIME
        ),
        'proforma': openapi.Schema(
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_URI,
            example='https://example.com/media/proformas/document.pdf'
        ),
        'purchase_order': openapi.Schema(
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_URI,
            nullable=True
        ),
        'receipt': openapi.Schema(
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_URI,
            nullable=True
        ),
        'approvals': openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'approver_name': openapi.Schema(type=openapi.TYPE_STRING),
                    'approved': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    'comments': openapi.Schema(type=openapi.TYPE_STRING),
                    'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
                }
            )
        ),
        'items': openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'name': openapi.Schema(type=openapi.TYPE_STRING),
                    'description': openapi.Schema(type=openapi.TYPE_STRING),
                    'quantity': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'unit_price': openapi.Schema(type=openapi.TYPE_STRING),
                    'total_price': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        ),
        'proforma_data': openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='AI-extracted data from proforma'
        ),
        'receipt_data': openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='AI-extracted data from receipt'
        ),
        'validation_results': openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='Receipt validation results'
        )
    }
)

# Common parameters
pagination_parameters = [
    openapi.Parameter(
        'page',
        openapi.IN_QUERY,
        description="Page number",
        type=openapi.TYPE_INTEGER,
        example=1
    ),
    openapi.Parameter(
        'page_size',
        openapi.IN_QUERY,
        description="Number of results per page (max 100)",
        type=openapi.TYPE_INTEGER,
        example=20
    )
]

filter_parameters = [
    openapi.Parameter(
        'status',
        openapi.IN_QUERY,
        description="Filter by status",
        type=openapi.TYPE_STRING,
        enum=['pending', 'approved', 'rejected']
    ),
    openapi.Parameter(
        'amount_min',
        openapi.IN_QUERY,
        description="Minimum amount filter",
        type=openapi.TYPE_NUMBER
    ),
    openapi.Parameter(
        'amount_max',
        openapi.IN_QUERY,
        description="Maximum amount filter",
        type=openapi.TYPE_NUMBER
    ),
    openapi.Parameter(
        'created_after',
        openapi.IN_QUERY,
        description="Filter requests created after date (ISO format)",
        type=openapi.TYPE_STRING,
        format=openapi.FORMAT_DATETIME
    ),
    openapi.Parameter(
        'created_before',
        openapi.IN_QUERY,
        description="Filter requests created before date (ISO format)",
        type=openapi.TYPE_STRING,
        format=openapi.FORMAT_DATETIME
    ),
    openapi.Parameter(
        'search',
        openapi.IN_QUERY,
        description="Search in title and description",
        type=openapi.TYPE_STRING
    )
]

# Example responses
example_responses = {
    'purchase_request_list': {
        "count": 25,
        "next": "https://api.example.com/requests/?page=2",
        "previous": None,
        "results": [
            {
                "id": 1,
                "title": "Office Supplies Purchase",
                "description": "Monthly office supplies",
                "amount": "150.50",
                "status": "pending",
                "created_by": 1,
                "created_by_name": "John Doe",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "proforma": "https://example.com/media/proformas/doc.pdf",
                "purchase_order": None,
                "receipt": None,
                "approvals": [],
                "items": [
                    {
                        "id": 1,
                        "name": "Ballpoint Pens",
                        "description": "Blue ink, pack of 10",
                        "quantity": 5,
                        "unit_price": "12.50",
                        "total_price": "62.50"
                    }
                ]
            }
        ]
    },
    'approval_success': {
        "message": "Request approved successfully",
        "request": {
            "id": 1,
            "status": "approved",
            "approvals": [
                {
                    "id": 1,
                    "approver_name": "Jane Smith",
                    "approved": True,
                    "comments": "Approved - within budget",
                    "created_at": "2024-01-15T11:00:00Z"
                }
            ]
        }
    },
    'receipt_validation': {
        "message": "Receipt submitted successfully",
        "validation_results": {
            "valid": True,
            "discrepancies": [],
            "warnings": [
                "Receipt date is 30 days after PO date"
            ],
            "total_match": True,
            "vendor_match": True
        }
    }
}