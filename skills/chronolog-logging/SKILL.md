---
name: farmart-chronolog-logging
description: >
  Implement structured logging using FarMart's chronolog library with OpenTelemetry
  distributed tracing, proper log levels, contextual logging, PII handling, and
  cross-service trace propagation. Use for logging, observability, distributed tracing,
  or debugging in FarMart applications.
---

# FarMart Chronolog Logging

Comprehensive guide to implementing structured, secure, and performant logging using FarMart's `@farmart-engineering/chronolog` library across Node.js/Express backends and React frontends.

## Table of Contents

- [Overview](#overview)
- [When to Use](#when-to-use)
- [Quick Start](#quick-start)
- [Package-Specific Usage](#package-specific-usage)
- [Best Practices](#best-practices)
- [Advanced Features](#advanced-features)
- [Common Patterns](#common-patterns)

## Overview

FarMart's chronolog library is a centralized logging solution with three packages:
- **`@farmart-engineering/chronolog-core`** - Core logging functionality
- **`@farmart-engineering/chronolog-express`** - Express.js/Node.js integration with OpenTelemetry auto-instrumentation
- **`@farmart-engineering/chronolog-react`** - React integration with browser-side logging

All packages include:
- Structured JSON logging
- OpenTelemetry integration for distributed tracing
- Sentry integration for error tracking
- Multiple log levels (log, info, warn, debug, error)
- Event tracking capabilities

## When to Use

Use this skill when:
- Setting up logging in FarMart applications
- Implementing distributed tracing across microservices
- Debugging production issues with trace context
- Propagating trace context through message queues (SQS)
- Adding contextual logging with request IDs, user IDs, etc.
- Integrating with OpenTelemetry collectors
- Setting up Sentry error tracking
- Implementing proper error logging with stack traces
- Creating audit trails
- Tracking business events

## Quick Start

### Express/Node.js Backend

```javascript
import chronolog from '@farmart-engineering/chronolog-express';
import express from 'express';

const app = express();

// Initialize chronolog (do this ONCE at application startup)
chronolog.initialize({
  serviceName: 'farmart-app-backend',
  version: '10.27.2',
  environment: process.env.NODE_ENV || 'development',
  sentry: {
    dsn: process.env.SENTRY_DSN,
    expressApp: app,
  },
  opentelemetry: {
    logExporterUrl: process.env.OTEL_LOG_EXPORTER_URL || 'http://localhost:4318/v1/logs',
    traceExporterUrl: process.env.OTEL_TRACE_EXPORTER_URL || 'http://localhost:4318/v1/traces',
    metricExporterUrl: process.env.OTEL_METRIC_EXPORTER_URL || 'http://localhost:4318/v1/metrics',
  },
});

// Use chronolog for logging
chronolog.info('Application started on port 3000');
chronolog.log(`Processing request for userId: 123, orderId: 456`);
chronolog.warn(`Rate limit approaching: 95 requests per minute`);
chronolog.error(new Error('Database connection failed'), {
  source: 'database',
  errorCode: 500
});
```

### React Frontend

```javascript
import chronolog from '@farmart-engineering/chronolog-react';

// Initialize chronolog (do this ONCE at application startup)
chronolog.initialize({
  serviceName: 'farmartos-frontend',
  version: '4.7.0',
  environment: process.env.NODE_ENV || 'development',
  sentry: {
    dsn: process.env.REACT_APP_SENTRY_DSN,
    enableReplay: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },
  opentelemetry: {
    traceExporterUrl: process.env.REACT_APP_OTEL_TRACE_EXPORTER_URL,
  },
});

// Use in components
function MyComponent() {
  const handleClick = () => {
    chronolog.info('Button clicked', { buttonId: 'submit-order' });
  };

  return <button onClick={handleClick}>Submit Order</button>;
}
```

## Package-Specific Usage

### Core Package (@farmart-engineering/chronolog-core)

Use when building custom integrations or libraries.

```javascript
import chronolog from '@farmart-engineering/chronolog-core';

chronolog.initialize({
  serviceName: 'my-service',
  version: '1.0.0',
  environment: 'production',
});

chronolog.log('General log message');
chronolog.info(`Informational message for user: 123`);
chronolog.warn(`Warning: threshold reached at 90%`);
chronolog.debug(`Debug info: connection details`);
chronolog.error(new Error('Something went wrong'), { errorCode: 500 });
chronolog.event_track({ message: 'User signed up', userId: '123' });
```

### Express Package (@farmart-engineering/chronolog-express)

Use in Node.js/Express backends like `farmart-app-backend`.

**Import styles:**
```javascript
// Default export (recommended for familiarity)
import chronolog from '@farmart-engineering/chronolog-express';
chronolog.initialize({ ... });
chronolog.info('Message');

// Named exports (better for tree-shaking)
import { initialize, info, error } from '@farmart-engineering/chronolog-express';
initialize({ ... });
info('Message');
```

**Auto-instrumentation:**
The Express package automatically instruments:
- HTTP requests/responses
- Database queries
- External API calls

**Manual tracing:**
```javascript
import { withSpan, getTraceContext } from '@farmart-engineering/chronolog-express';

// Create manual spans
await withSpan('process-order', async () => {
  // All logs here will be linked to this span
  chronolog.info('Processing order', { orderId: '123' });
  await processOrder('123');
}, { attributes: { 'order.id': '123' } });

// Get current trace context
const { traceId, spanId, isValid } = getTraceContext();
chronolog.info('Current trace', { traceId, spanId });
```

### React Package (@farmart-engineering/chronolog-react)

Use in React frontends like `farmartos-frontend`.

```javascript
import chronolog from '@farmart-engineering/chronolog-react';
import { useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

chronolog.initialize({
  serviceName: 'farmartos-frontend',
  version: '4.7.0',
  sentry: {
    dsn: process.env.REACT_APP_SENTRY_DSN,
    reactRouter: {
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    },
  },
});

// Log user interactions
chronolog.info('Page viewed', { page: '/products' });
chronolog.event_track({ message: 'Add to cart', productId: '456' });
```

## Best Practices

### ⚠️ CRITICAL: Understanding the `meta` Field

**The `meta` field is ONLY for repo-specific configuration data, NOT for log-specific variables!**

**What is `meta` for?**
- Repository-wide configuration (userId, appId, environment)
- Cross-cutting concerns that apply to ALL logs
- Data that needs to be searchable across all log entries

**What is `meta` NOT for?**
- Log-specific variables (orderId, productId, transactionId, etc.)
- Dynamic data that changes per log statement
- Variables that describe what happened in that specific log

### ✅ DO

1. **Use template strings for log-specific variables**
   ```javascript
   // ✅ CORRECT - Variables in the message string using template literals
   chronolog.log(`Sending POST request to ${url}`);
   chronolog.info(`Processing order for userId: ${userId}, orderId: ${orderId}`);
   chronolog.warn(`Rate limit approaching: ${requestsPerMinute} requests per minute`);
   chronolog.log(`Response received from ${url} with status code ${statusCode}`);

   // ❌ WRONG - Don't put log-specific variables in payload object
   chronolog.info('Processing order', { userId, orderId }); // NO!
   chronolog.warn('Rate limit approaching', { requestsPerMinute }); // NO!
   ```

2. **Use the second parameter ONLY for repo-specific data or error context**
   ```javascript
   // ✅ CORRECT - For repo-specific data in `meta` field
   chronolog.event_track({
     message: 'User signed up',
     userId: user.id,  // Repo-specific: user identifier
     meta: {
       signupMethod: 'google',
       referralSource: req.query.ref,
     }
   });

   // ✅ CORRECT - For error-specific fields
   chronolog.error(new Error('Payment failed'), {
     source: 'payment-service',
     errorCode: err.code,
     errorMessage: err.message,
   });
   ```

3. **Initialize chronolog ONCE at application startup**
   ```javascript
   // ✅ Good - in main.js/index.js
   chronolog.initialize({ serviceName: 'my-service' });
   ```

4. **Use appropriate log levels**
   ```javascript
   // ✅ Good - use info for business events
   chronolog.info(`Order placed for userId: ${userId}, orderId: ${orderId}`);

   // ✅ Good - use warn for issues that don't stop execution
   chronolog.warn(`Cache miss for key: user:${userId}`);

   // ✅ Good - use error for exceptions
   chronolog.error(new Error('Payment failed'), {
     source: 'payment-service',
     errorCode: err.code,
   });

   // ✅ Good - use debug for development debugging
   chronolog.debug(`Cache hit for key: user:${userId}, TTL: ${ttl} seconds`);
   ```

5. **Log errors with full context using error payload (not meta)**
   ```javascript
   // ✅ CORRECT - Use error-specific fields in payload
   try {
     await processPayment(orderId);
   } catch (err) {
     chronolog.error(err, {
       source: 'payment-service',
       errorCode: err.code,
       errorMessage: err.message,
     });
     throw err;
   }

   // ❌ WRONG - Don't mix log variables with error context
   chronolog.error(err, { orderId, userId, source: 'payment' }); // NO!

   // ✅ CORRECT - Include context in error message instead
   chronolog.error(new Error(`Payment failed for orderId: ${orderId}`), {
     source: 'payment-service',
     errorCode: err.code,
   });
   ```

6. **Use distributed tracing for cross-service requests**
   ```javascript
   // ✅ Good - propagate trace context through SQS
   import { getTraceContextForSQS } from '@farmart-engineering/chronolog-express';

   await sqs.sendMessage({
     MessageBody: JSON.stringify(data),
     MessageAttributes: {
       ...getTraceContextForSQS(),
       orderId: { DataType: 'String', StringValue: data.orderId },
     },
   });
   ```

7. **Extract trace context in consumers**
   ```javascript
   // ✅ Good - continue trace in SQS consumer
   import { extractTraceContextFromSQS, withSpan } from '@farmart-engineering/chronolog-express';

   async function processMessage(message) {
     const parentContext = extractTraceContextFromSQS(message.MessageAttributes);

     await withSpan('process-order-message', async () => {
       chronolog.info(`Processing order: ${data.orderId}`);
       // All logs here have the same traceId as the producer
     }, { context: parentContext });
   }
   ```

8. **Use fire-and-forget pattern correctly**
   ```javascript
   // ✅ Good - use runWithSQSContext for fire-and-forget operations
   import { runWithSQSContext } from '@farmart-engineering/chronolog-express';

   async function processMessage(message) {
     return runWithSQSContext(message.MessageAttributes, async () => {
       sendNotification(data); // Fire-and-forget, still has trace context
       chronolog.info(`Message processed for userId: ${data.userId}`);
       return true;
     });
   }
   ```

### ❌ DON'T

1. **Don't use payload objects for log-specific variables**
   ```javascript
   // ❌ WRONG - Putting variables in payload object
   chronolog.info('Order placed', { orderId, userId, amount });
   chronolog.warn('Rate limit', { current: 95, max: 100 });
   chronolog.log('Processing', { itemId, status, timestamp });

   // ✅ CORRECT - Use template strings for variables
   chronolog.info(`Order placed for orderId: ${orderId}, userId: ${userId}, amount: ${amount}`);
   chronolog.warn(`Rate limit: ${current}/${max} requests`);
   chronolog.log(`Processing itemId: ${itemId}, status: ${status}, timestamp: ${timestamp}`);
   ```

2. **Don't log sensitive data (PII, passwords, tokens)**
   ```javascript
   // ❌ Bad - logging sensitive data
   chronolog.info(`User login with password: ${req.body.password}`);

   // ✅ Good - redact sensitive data or don't log it
   chronolog.info(`User login successful for userId: ${user.id}`);
   ```

3. **Don't use console.log in production**
   ```javascript
   // ❌ Bad - no structured data, no trace context
   console.log('Order placed:', orderId);

   // ✅ Good - use chronolog with template strings
   chronolog.info(`Order placed with orderId: ${orderId}`);
   ```

4. **Don't initialize chronolog multiple times**
   ```javascript
   // ❌ Bad - initializing in every file
   import chronolog from '@farmart-engineering/chronolog-express';
   chronolog.initialize({ ... }); // Don't do this in multiple files!

   // ✅ Good - initialize once in entry point (index.js/app.js)
   // Then just import and use in other files
   import chronolog from '@farmart-engineering/chronolog-express';
   chronolog.info('Message'); // Just use it
   ```

5. **Don't log inside tight loops without sampling**
   ```javascript
   // ❌ Bad - creates millions of logs
   for (const item of largeArray) {
     chronolog.debug(`Processing item: ${item.id}`);
   }

   // ✅ Good - log summary instead
   chronolog.info(`Processing ${largeArray.length} items`);
   // Process items...
   chronolog.info(`Items processed successfully: ${successCount}, failed: ${failureCount}`);
   ```

6. **Don't ignore trace context in async operations**
   ```javascript
   // ❌ Bad - fire-and-forget loses trace context
   async function handleRequest(req, res) {
     processOrder(orderId); // No await, loses trace context
     res.json({ success: true });
   }

   // ✅ Good - use runWithContext for fire-and-forget
   import { runWithContext } from '@farmart-engineering/chronolog-express';
   import { context } from '@opentelemetry/api';

   async function handleRequest(req, res) {
     const ctx = context.active(); // Get current context
     runWithContext(ctx, () => {
       processOrder(orderId); // Fire-and-forget with trace context
     });
     res.json({ success: true });
   }
   ```

7. **Don't log large objects or binary data**
   ```javascript
   // ❌ Bad - logging entire response body
   chronolog.info(`API response: ${JSON.stringify(largeResponseObject)}`);

   // ✅ Good - log summary
   chronolog.info(`API response with status: ${response.status}, recordCount: ${response.data.length}`);
   ```

## Advanced Features

### Distributed Tracing Across Services

**Service A (Producer) - Express API:**
```javascript
import chronolog, { getTraceContextForSQS } from '@farmart-engineering/chronolog-express';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

chronolog.initialize({
  serviceName: 'order-api',
  version: '1.0.0',
  opentelemetry: {
    traceExporterUrl: 'http://otel-collector:4318/v1/traces',
  },
});

app.post('/orders', async (req, res) => {
  const order = req.body;

  chronolog.info(`Received order: ${order.id}`);

  // Send to SQS with trace context
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.ORDER_QUEUE_URL,
    MessageBody: JSON.stringify(order),
    MessageAttributes: {
      ...getTraceContextForSQS(), // Automatically includes traceparent
      orderType: { DataType: 'String', StringValue: order.type },
    },
  }));

  res.json({ success: true });
});
```

**Service B (Consumer) - SQS Processor:**
```javascript
import chronolog, { extractTraceContextFromSQS, withSpan } from '@farmart-engineering/chronolog-express';

chronolog.initialize({
  serviceName: 'order-processor',
  version: '1.0.0',
  opentelemetry: {
    traceExporterUrl: 'http://otel-collector:4318/v1/traces',
  },
});

async function processMessage(message) {
  // Extract trace context from SQS message
  const parentContext = extractTraceContextFromSQS(message.MessageAttributes);

  // All operations inside withSpan share the same traceId as Service A
  await withSpan('process-order', async () => {
    const order = JSON.parse(message.Body);

    // This log has the same traceId as the original API request
    chronolog.info(`Processing order: ${order.id}`);

    await fulfillOrder(order);

    chronolog.info(`Order processed successfully: ${order.id}`);
  }, {
    context: parentContext,
    attributes: { 'messaging.system': 'aws_sqs' },
  });
}
```

### Manual Span Creation

```javascript
import { withSpan, getTraceContext } from '@farmart-engineering/chronolog-express';

async function processOrder(orderId) {
  await withSpan('process-order', async () => {
    chronolog.info(`Processing order: ${orderId}`);

    // Nested span for sub-operations
    await withSpan('validate-order', async () => {
      chronolog.debug(`Validating order: ${orderId}`);
      await validateOrder(orderId);
    });

    await withSpan('charge-payment', async () => {
      chronolog.info(`Charging payment for order: ${orderId}`);
      await chargePayment(orderId);
    });

    await withSpan('fulfill-order', async () => {
      chronolog.info(`Fulfilling order: ${orderId}`);
      await fulfillOrder(orderId);
    });

  }, { attributes: { 'order.id': orderId } });
}
```

### Fire-and-Forget with Trace Context

```javascript
import { runWithSQSContext } from '@farmart-engineering/chronolog-express';

async function processMessage(message) {
  return runWithSQSContext(message.MessageAttributes, async () => {
    const data = JSON.parse(message.Body);

    // Fire-and-forget operations maintain trace context
    sendNotification(data.userId, 'Order placed'); // Not awaited
    sendDLR(data.userId, 'delivered', data.messageId); // Not awaited

    chronolog.info(`Message processed for userId: ${data.userId}`);
    return true;
  });
}
```

### API Request Logging Pattern

```javascript
import chronolog from '@farmart-engineering/chronolog-express';

async function makeAPIRequest(url, body, headers, entity) {
  const startTime = Date.now();

  try {
    chronolog.log(`Sending POST request to ${url}`);

    const response = await axios.post(url, body, { headers });
    const duration = Date.now() - startTime;

    chronolog.log(`Response received from ${url} with status code ${response.status}, duration: ${duration}ms`);

    return response;
  } catch (err) {
    const duration = Date.now() - startTime;

    chronolog.error(new Error(`POST request to ${url} failed with status ${err.response?.status}, duration: ${duration}ms`), {
      source: 'external-api',
      errorCode: err.response?.status,
    });

    throw err;
  }
}
```

### Event Tracking for Business Metrics

```javascript
// Track business events
chronolog.event_track({
  message: 'Order placed',
  userId: user.id,
  meta: {
    orderId: order.id,
    amount: order.total,
    currency: 'INR',
    paymentMethod: order.paymentMethod,
  },
});

chronolog.event_track({
  message: 'User signup',
  userId: user.id,
  meta: {
    signupMethod: 'google',
    referralSource: req.query.ref,
  },
});
```

## Common Patterns

### 1. Express Middleware Logging

```javascript
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    chronolog.log(`Request received: ${req.method} ${req.path}, status: ${res.statusCode}, duration: ${duration}ms, userId: ${req.user?.id || 'anonymous'}`);
  });

  next();
});
```

### 2. Database Query Logging

```javascript
async function queryDatabase(query, params) {
  const startTime = Date.now();

  try {
    const result = await db.query(query, params);
    const duration = Date.now() - startTime;

    chronolog.debug(`Database query executed: ${query.substring(0, 100)}..., duration: ${duration}ms, rows: ${result.rowCount}`);

    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    chronolog.error(new Error(`Database query failed: ${query.substring(0, 100)}..., duration: ${duration}ms`), {
      source: 'database',
      errorCode: err.code,
    });
    throw err;
  }
}
```

### 3. Background Job Logging

```javascript
import { withSpan } from '@farmart-engineering/chronolog-express';

async function processBackgroundJob(jobData) {
  await withSpan('background-job', async () => {
    chronolog.info(`Starting background job: ${jobData.type}, jobId: ${jobData.id}`);

    try {
      await executeJob(jobData);

      chronolog.info(`Background job completed: ${jobData.type}, jobId: ${jobData.id}`);
    } catch (err) {
      chronolog.error(new Error(`Background job failed: ${jobData.type}, jobId: ${jobData.id}`), {
        source: 'background-job',
        errorCode: err.code,
      });
      throw err;
    }
  }, { attributes: { 'job.type': jobData.type, 'job.id': jobData.id } });
}
```

### 4. React Component Logging

```javascript
import { useEffect } from 'react';
import chronolog from '@farmart-engineering/chronolog-react';

function ProductPage({ productId }) {
  useEffect(() => {
    chronolog.info(`Product page viewed: ${productId} at ${new Date().toISOString()}`);
  }, [productId]);

  const handleAddToCart = () => {
    chronolog.event_track({
      message: `Product added to cart: ${productId}`,
      meta: {
        source: 'product-page',
      },
    });
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

### 5. Error Boundary Logging (React)

```javascript
import React from 'react';
import chronolog from '@farmart-engineering/chronolog-react';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    chronolog.error(error, {
      source: 'react-error-boundary',
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    return this.props.children;
  }
}
```

## Environment-Specific Configuration

### Development
```javascript
chronolog.initialize({
  serviceName: 'my-service',
  environment: 'development',
  console: true, // Enable console output
  opentelemetry: {
    logExporterUrl: 'http://localhost:4318/v1/logs',
  },
});
```

### Production
```javascript
chronolog.initialize({
  serviceName: 'my-service',
  environment: 'production',
  console: false, // Disable console output
  opentelemetry: {
    logExporterUrl: process.env.OTEL_LOG_EXPORTER_URL,
    traceExporterUrl: process.env.OTEL_TRACE_EXPORTER_URL,
    traceSampleRate: 0.1, // Sample 10% of traces in high-volume production
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  },
});
```

## Log Levels Reference

| Method | When to Use | Example |
|--------|-------------|---------|
| `chronolog.log()` | General purpose logging | `chronolog.log(`Processing started for orderId: ${orderId}`)` |
| `chronolog.info()` | Informational messages, business events | `chronolog.info(`Order placed: ${orderId}`)` |
| `chronolog.warn()` | Warnings that don't stop execution | `chronolog.warn(`Rate limit approaching: ${count}/100`)` |
| `chronolog.debug()` | Development debugging (disable in production) | `chronolog.debug(`Cache hit for key: ${key}`)` |
| `chronolog.error()` | Exceptions and errors | `chronolog.error(err, { source: 'payment', errorCode: 500 })` |
| `chronolog.event_track()` | Business metrics and analytics | `chronolog.event_track({ message: 'User signup', userId: '123' })` |

## Troubleshooting

### Traces not appearing in observability platform
1. Verify OpenTelemetry exporter URLs are correct
2. Check that OpenTelemetry collector is running
3. Ensure trace context is propagated correctly through message queues
4. Check trace sampling rate (increase for debugging)

### Missing trace context in SQS consumers
1. Ensure producer uses `getTraceContextForSQS()`
2. Verify consumer uses `extractTraceContextFromSQS()` or `runWithSQSContext()`
3. Check that MessageAttributes are included in SQS receive call

### Logs not appearing
1. Verify chronolog.initialize() is called before logging
2. Check log exporter URL configuration
3. Ensure OpenTelemetry collector is accessible
4. Check if console output is enabled for debugging

## References

- **Chronolog Library**: `/Users/mehtabsinghgill/farmart/chronolog`
- **Backend Application**: `/Users/mehtabsinghgill/farmart/farmart-app-backend`
- **Frontend Application**: `/Users/mehtabsinghgill/farmart/farmartos-frontend`
- **Express Package README**: `/Users/mehtabsinghgill/farmart/chronolog/packages/express/readme.md`
- **React Package README**: `/Users/mehtabsinghgill/farmart/chronolog/packages/react/readme.md`
- **Core Package README**: `/Users/mehtabsinghgill/farmart/chronolog/packages/core/readme.md`

---

**Version**: 1.1.0
**Last Updated**: 2026-04-13
**Maintainer**: FarMart Engineering

## Changelog

### v1.1.0 (2026-04-13)
- **CRITICAL**: Added guidance on proper use of `meta` field (repo-specific data only)
- **BREAKING**: Updated all examples to use template strings for log-specific variables
- Clarified that variables should be in the log message string, NOT in payload objects
- Updated best practices with correct and incorrect examples
- Fixed all code examples throughout the document to match actual chronolog usage patterns
