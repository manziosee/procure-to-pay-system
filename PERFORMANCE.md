# Performance Optimization Guide

## 🚀 Performance Improvements Implemented

### Database Optimizations
- **Query Optimization**: Added `select_related` and `prefetch_related` for efficient queries
- **Database Indexes**: Added indexes on frequently queried fields
- **Connection Pooling**: Configured for production environments
- **Query Monitoring**: Middleware to track slow queries

### API Performance
- **Response Caching**: Implemented caching for frequently accessed data
- **Pagination**: Efficient pagination for large datasets
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Compression**: Response compression for reduced bandwidth

### Frontend Optimizations
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Minimized JavaScript bundles
- **Image Optimization**: Compressed images and proper formats
- **Caching Strategy**: Browser caching for static assets

## 📊 Performance Monitoring

### Backend Monitoring
```python
# Performance middleware logs:
# - Requests taking >1 second
# - Queries exceeding 10 per request
# - Memory usage patterns
# - Response times by endpoint
```

### Key Performance Metrics
- **Response Time**: Target <200ms for API calls
- **Database Queries**: <10 queries per request
- **Memory Usage**: Monitor for memory leaks
- **Cache Hit Rate**: >80% for cached endpoints

### Monitoring Tools
```bash
# Django Debug Toolbar (development)
pip install django-debug-toolbar

# Performance profiling
python manage.py runserver --settings=procure_to_pay.settings.profiling

# Database query analysis
python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)
```

## 🔧 Database Performance

### Query Optimization Examples
```python
# Before: N+1 query problem
requests = PurchaseRequest.objects.all()
for request in requests:
    print(request.created_by.username)  # Causes N queries

# After: Optimized with select_related
requests = PurchaseRequest.objects.select_related('created_by').all()
for request in requests:
    print(request.created_by.username)  # Single query
```

### Index Usage
```sql
-- Indexes added for common queries
CREATE INDEX idx_requests_status_created ON requests_purchaserequest(status, created_at);
CREATE INDEX idx_requests_created_by_status ON requests_purchaserequest(created_by_id, status);
CREATE INDEX idx_requests_amount ON requests_purchaserequest(amount);
```

### Database Configuration
```python
# settings/production.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'OPTIONS': {
                'MAX_CONNS': 20,
            }
        },
        'CONN_MAX_AGE': 600,  # Connection pooling
    }
}
```

## 🗄️ Caching Strategy

### Cache Implementation
```python
# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Cache usage example
from django.core.cache import cache

def get_user_requests(user_id):
    cache_key = f'user_requests_{user_id}'
    requests = cache.get(cache_key)
    if not requests:
        requests = PurchaseRequest.objects.filter(created_by_id=user_id)
        cache.set(cache_key, requests, 300)  # 5 minutes
    return requests
```

### Cache Invalidation
```python
# Invalidate cache when data changes
def invalidate_user_cache(user_id):
    cache_keys = [
        f'user_requests_{user_id}',
        f'user_stats_{user_id}',
    ]
    cache.delete_many(cache_keys)
```

## 📱 Frontend Performance

### Bundle Optimization
```javascript
// Code splitting with React.lazy
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const RequestForm = React.lazy(() => import('./components/RequestForm'));

// Lazy loading with Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### API Optimization
```typescript
// Request deduplication
const useRequests = () => {
  return useQuery(['requests'], fetchRequests, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Pagination for large datasets
const useRequestsPaginated = (page: number) => {
  return useQuery(['requests', page], () => fetchRequests(page), {
    keepPreviousData: true,
  });
};
```

## 🔍 Performance Testing

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/requests/

# Using wrk
wrk -t12 -c400 -d30s http://localhost:8000/api/requests/

# Using Django's test client
python manage.py test procure_to_pay.apps.requests.tests.test_performance
```

### Performance Test Results
```
Target Performance Metrics:
- API Response Time: <200ms (95th percentile)
- Database Query Time: <50ms average
- Page Load Time: <2 seconds
- Time to Interactive: <3 seconds
```

## 📈 Optimization Checklist

### Backend Optimizations
- [x] Database query optimization
- [x] Response caching
- [x] Database indexes
- [x] Connection pooling
- [x] Rate limiting
- [x] Compression
- [x] Performance monitoring
- [x] Slow query logging

### Frontend Optimizations
- [x] Code splitting
- [x] Bundle optimization
- [x] Image optimization
- [x] Browser caching
- [x] API request optimization
- [x] Component memoization
- [x] Virtual scrolling for large lists

### Infrastructure Optimizations
- [ ] CDN for static assets
- [ ] Load balancing
- [ ] Database read replicas
- [ ] Redis clustering
- [ ] Container optimization
- [ ] HTTP/2 support

## 🛠️ Performance Tools

### Development Tools
- Django Debug Toolbar
- React DevTools Profiler
- Chrome DevTools Performance
- Lighthouse audits

### Production Monitoring
- Application Performance Monitoring (APM)
- Database performance monitoring
- Real User Monitoring (RUM)
- Error tracking and alerting

## 📊 Performance Metrics Dashboard

### Key Metrics to Track
1. **Response Times**
   - API endpoint response times
   - Database query times
   - Page load times

2. **Throughput**
   - Requests per second
   - Concurrent users
   - Data transfer rates

3. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Database connections
   - Cache hit rates

4. **User Experience**
   - Time to first byte (TTFB)
   - First contentful paint (FCP)
   - Largest contentful paint (LCP)
   - Cumulative layout shift (CLS)