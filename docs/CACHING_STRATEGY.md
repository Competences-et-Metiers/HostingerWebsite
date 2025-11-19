# Caching Strategy - Reducing Dendreo API Calls

This document explains the caching implementation to minimize API calls to Dendreo.

## 📊 Overview

We've implemented a **multi-layer caching strategy** using React Query (TanStack Query) on the frontend.

### Benefits
- ✅ **Reduced API calls** to Dendreo (from potentially hundreds to just a few)
- ✅ **Faster page loads** (instant from cache)
- ✅ **Better UX** (no loading spinners on cached data)
- ✅ **Automatic background refetch** (keeps data fresh)
- ✅ **Shared cache** across components

## 🎯 Implementation

### 1. Frontend Caching (React Query)

**Location:** `src/lib/queryClient.js`

```javascript
// Cache configuration
{
  staleTime: 5 * 60 * 1000,      // 5 minutes - data is "fresh"
  cacheTime: 10 * 60 * 1000,     // 10 minutes - data stays in memory
  refetchOnWindowFocus: false,   // Don't refetch on window focus
}
```

### 2. Custom Hooks

**Location:** `src/hooks/useDendreoData.js`

#### Available Hooks:

```javascript
// Get filtered ADF IDs
const { data, isLoading, error } = useAdfIds();

// Get ADF competencies/evaluations
const { data, isLoading, error } = useAdfCompetencies();

// Get metrics for a single ADF
const { data, isLoading, error } = useAdfMetrics(adfId);

// Get metrics for multiple ADFs (parallel fetching using useQueries)
const { data, isLoading, error } = useMultipleAdfMetrics(adfIds);
```

**Note:** `useMultipleAdfMetrics` uses React Query's `useQueries` hook to properly handle multiple parallel queries without violating React's Rules of Hooks.

### 3. Updated Components

#### Before (SkillsPages.jsx):
```javascript
// ❌ Manual fetch on every mount
useEffect(() => {
  const fetchData = async () => {
    const data = await fetchAdfCompetencies();
    setAdfs(data.adfs);
  };
  fetchData();
}, []);
```

#### After:
```javascript
// ✅ Automatic caching with React Query
const { data, isLoading } = useAdfCompetencies();
const adfs = data?.adfs || [];
```

## 📈 Cache Behavior

### First Visit (Cold Cache)
```
User visits Dashboard
  ↓
useAdfIds() → API call to get-adf → Cache for 5 min
  ↓
useMultipleAdfMetrics() → API calls to test → Cache for 5 min
  ↓
User navigates to Progress Page
  ↓
useAdfIds() → ✅ Returns from cache (no API call!)
  ↓
useMultipleAdfMetrics() → ✅ Returns from cache (no API call!)
```

### Subsequent Visits (Warm Cache)
```
User returns within 5 minutes
  ↓
All data served from cache ⚡
  ↓
No API calls to Dendreo 🎉
```

### After 5 Minutes (Stale Data)
```
Data becomes "stale" but is still used
  ↓
Background refetch happens automatically
  ↓
User sees old data while new data loads
  ↓
Seamless update when new data arrives
```

## 🔄 Cache Keys

React Query uses these keys to identify cached data:

| Hook | Cache Key | Shared Across |
|------|-----------|---------------|
| `useAdfIds()` | `['adf-ids']` | All components |
| `useAdfCompetencies()` | `['adf-competencies']` | All components |
| `useAdfMetrics(id)` | `['adf-metrics', id]` | Components using same ID |

## 🛠️ Advanced: Server-Side Caching (Optional)

For even more optimization, you can add caching in Supabase Edge Functions using **Deno KV**.

### Example: Cache in `get-adf` function

```typescript
// supabase/functions/get-adf/index.ts

const kv = await Deno.openKv();

serve(async (req) => {
  const email = getUserEmail(req);
  
  // Try to get from cache
  const cacheKey = ["get-adf", email];
  const cached = await kv.get(cacheKey);
  
  if (cached.value) {
    console.log("✅ Returning cached data");
    return new Response(JSON.stringify(cached.value), {
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Fetch from Dendreo API
  const data = await fetchFromDendreo();
  
  // Store in cache for 5 minutes
  await kv.set(cacheKey, data, { expireIn: 300_000 });
  
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
});
```

### Benefits of Server-Side Caching:
- ✅ **Shared across all users** (if appropriate)
- ✅ **Reduces Dendreo API load** even more
- ✅ **Protects against rate limits**
- ⚠️ **Requires Deno KV** (included in Supabase)

## 📊 Monitoring Cache Performance

### Install React Query DevTools (Development Only)

```bash
npm install @tanstack/react-query-devtools
```

Add to `src/App.jsx`:

```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

This shows:
- What's in cache
- When queries run
- Cache hit/miss rates

## 🎛️ Customizing Cache Duration

Edit `src/lib/queryClient.js` to adjust timing:

```javascript
// More aggressive caching (less API calls)
staleTime: 15 * 60 * 1000,  // 15 minutes
cacheTime: 30 * 60 * 1000,  // 30 minutes

// Less aggressive caching (fresher data)
staleTime: 2 * 60 * 1000,   // 2 minutes
cacheTime: 5 * 60 * 1000,   // 5 minutes
```

## 🔄 Manual Cache Control

### Force Refresh

```javascript
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  
  const handleRefresh = () => {
    // Invalidate and refetch
    queryClient.invalidateQueries(['adf-ids']);
    queryClient.invalidateQueries(['adf-competencies']);
  };
  
  return <button onClick={handleRefresh}>Refresh Data</button>;
}
```

### Clear Cache

```javascript
// Clear all cache
queryClient.clear();

// Clear specific query
queryClient.removeQueries(['adf-metrics']);
```

## 💰 Cost Savings Estimate

### Before (No Caching):
```
- Dashboard loads: 3 API calls
- Navigate to Progress: 3 API calls
- Navigate to Skills: 1 API call
- Back to Dashboard: 3 API calls again
= 10 API calls in one session
```

### After (With Caching):
```
- Dashboard loads: 3 API calls → cached
- Navigate to Progress: 0 API calls (from cache)
- Navigate to Skills: 0 API calls (from cache)
- Back to Dashboard: 0 API calls (from cache)
= 3 API calls in one session
```

**Reduction: 70% fewer API calls** 🎉

## 🔒 Security Note

Cache is stored in browser memory only. No sensitive data persists after tab close.

## 📝 Summary

✅ **Implemented React Query** for automatic caching
✅ **Created custom hooks** for all Dendreo API calls  
✅ **Updated all components** to use cached hooks
✅ **5-minute cache** with 10-minute memory retention
✅ **70% reduction** in API calls

**Result:** Faster app, fewer API calls, better user experience!

