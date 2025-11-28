// Simple test to verify create request API
const API_URL = 'https://procure-to-pay-system-xnwp.onrender.com/api';

// Test login first
fetch(`${API_URL}/auth/login/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'example@example.com',
    password: 'Password123!'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login response:', data);
  
  if (data.access) {
    // Test create request
    const formData = new FormData();
    formData.append('title', 'Test Request');
    formData.append('description', 'Test Description');
    formData.append('amount', '100.00');
    
    return fetch(`${API_URL}/requests/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.access}`
      },
      body: formData
    });
  }
})
.then(response => response.json())
.then(data => {
  console.log('Create request response:', data);
})
.catch(error => {
  console.error('Error:', error);
});