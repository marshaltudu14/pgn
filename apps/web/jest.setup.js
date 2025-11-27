// Jest setup file for Node.js environment tests

// Polyfill Web APIs for Node.js test environment
const { TextEncoder, TextDecoder } = require('util');

// Make TextEncoder and TextDecoder available globally
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Headers API for node environment - ensure it's available before any imports
class MockHeaders {
  constructor(init = {}) {
    this.headers = new Map();
    if (typeof init === 'object' && init !== null) {
      // Handle both objects and existing Headers-like objects
      if (init.forEach && typeof init.forEach === 'function') {
        // It's already a Headers-like object
        init.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else {
        // It's a plain object
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
  }
  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
    return this;
  }
  get(name) {
    return this.headers.get(name.toLowerCase());
  }
  has(name) { return this.headers.has(name.toLowerCase()); }
  delete(name) {
    this.headers.delete(name.toLowerCase());
    return this;
  }
  entries() { return this.headers.entries(); }
  keys() { return this.headers.keys(); }
  values() { return this.headers.values(); }
  forEach(callback, thisArg) { return this.headers.forEach(callback, thisArg); }
  * [Symbol.iterator]() {
    yield* this.headers.entries();
  }
}

// Set Headers globally before any other code runs
if (typeof Headers === 'undefined') {
  global.Headers = MockHeaders;
} else {
  // Override existing Headers with our mock
  global.Headers = MockHeaders;
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new global.Headers(init.headers);
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }

  async blob() { return new Blob([this.body]); }
  async arrayBuffer() { return Buffer.from(this.body).buffer; }
  clone() { return new global.Response(this.body, { status: this.status, headers: this.headers }); }
};

global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new global.Headers(init.headers || (input.headers ? Object.fromEntries(input.headers) : {}));
    this.body = init.body || null;
    this.signal = init.signal || null;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }

  async blob() { return new Blob([this.body]); }
  async arrayBuffer() { return Buffer.from(this.body).buffer; }
  clone() { return new global.Request(this.url, { method: this.method, headers: this.headers, body: this.body }); }
};

global.fetch = jest.fn();

// Mock sonner to prevent DOM manipulation in tests
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock Next.js server APIs
jest.mock('next/server', () => ({
  NextRequest: global.Request,
  NextResponse: class MockNextResponse {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new global.Headers(init.headers);
    }

    static json(body, init = {}) {
      return new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: { 'content-type': 'application/json', ...init?.headers }
      });
    }

    static redirect(url, init = {}) {
      return new MockNextResponse(null, {
        ...init,
        status: 302,
        headers: { location: url, ...init?.headers }
      });
    }

    static error(message, init = {}) {
      return new MockNextResponse.json({ error: message }, {
        ...init,
        status: 500
      });
    }

    static next(init = {}) {
      return new MockNextResponse(null, {
        ...init,
        status: 200
      });
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  },
}));

// Mock DOM APIs that some tests might expect
global.document = {
  createElement: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getElementsByTagName: jest.fn(() => []),
  head: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
  },
};

global.Image = class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
};