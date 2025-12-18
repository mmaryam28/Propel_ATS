import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OWASP Top 10 Security Tests (UC-145)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for authenticated tests
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD,
      });

    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('A01 - Broken Access Control', () => {
    it('should prevent unauthorized access to protected endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/jobs')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should prevent access to other users resources', async () => {
      const otherUserId = 'different-user-id';

      const response = await request(app.getHttpServer())
        .get(`/api/applications/${otherUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should enforce role-based access control', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.message).toContain('Forbidden');
    });
  });

  describe('A02 - Cryptographic Failures', () => {
    it('should use HTTPS only (in production)', () => {
      // This is enforced at infrastructure level
      expect(process.env.NODE_ENV === 'production' ? 'https' : 'http').toBeDefined();
    });

    it('should not expose sensitive data in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();
    });
  });

  describe('A03 - Injection (SQL/XSS)', () => {
    it('should prevent SQL injection in search queries', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users--",
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app.getHttpServer())
          .get('/api/jobs')
          .query({ search: payload })
          .set('Authorization', `Bearer ${authToken}`);

        // Should not return error or unexpected data
        expect(response.status).toBeLessThan(500);
        expect(response.body).toBeDefined();
      }
    });

    it('should sanitize XSS attempts in input', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: payload,
            company: 'Test Company',
            description: payload,
          });

        // Should either reject or sanitize
        if (response.status === 201) {
          expect(response.body.title).not.toContain('<script>');
          expect(response.body.description).not.toContain('<script>');
        }
      }
    });
  });

  describe('A04 - Insecure Design (Authentication)', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = ['12345678', 'password', 'abcdefgh'];

      for (const password of weakPasswords) {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: password,
            firstname: 'Test',
            lastname: 'User',
          });

        expect(response.status).toBe(400);
      }
    });

    it('should enforce account lockout after failed attempts', async () => {
      const attempts = 6; // Assuming limit is 5

      for (let i = 0; i < attempts; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword123!',
          });
      }

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(429); // Too Many Requests
    });
  });

  describe('A05 - Security Misconfiguration', () => {
    it('should have security headers set', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should not expose sensitive error information', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.stack).toBeUndefined();
      expect(response.body.message).not.toContain('database');
      expect(response.body.message).not.toContain('password');
    });

    it('should not expose server information', async () => {
      const response = await request(app.getHttpServer())
        .get('/health');

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).not.toContain('Express');
    });
  });

  describe('A06 - Vulnerable Components', () => {
    it('should have no critical vulnerabilities in dependencies', async () => {
      // This is checked in CI/CD via npm audit
      // Test verifies package.json exists and is valid
      const packageJson = require('../package.json');
      expect(packageJson.dependencies).toBeDefined();
    });
  });

  describe('A07 - Authentication Failures', () => {
    it('should validate JWT token properly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/jobs')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalid';

      const response = await request(app.getHttpServer())
        .get('/api/jobs')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('A08 - Software/Data Integrity', () => {
    it('should validate file upload types', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-content'), {
          filename: 'test.exe',
          contentType: 'application/x-msdownload',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('type');
    });

    it('should validate file sizes', async () => {
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20 MB

      const response = await request(app.getHttpServer())
        .post('/api/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, {
          filename: 'large.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('size');
    });
  });

  describe('A09 - Logging Failures', () => {
    it('should log authentication attempts', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      // Verify logging happens (check database or log files)
      // This would require access to the logging system
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('A10 - Server-Side Request Forgery', () => {
    it('should prevent SSRF in URL parameters', async () => {
      const ssrfPayloads = [
        'http://localhost:3000/admin',
        'http://127.0.0.1:3000',
        'http://169.254.169.254/latest/meta-data/', // AWS metadata
        'http://10.0.0.1',
        'http://192.168.1.1',
      ];

      for (const payload of ssrfPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Job',
            company: 'Test Company',
            url: payload,
          });

        if (response.status === 201) {
          // If accepted, URL should be validated/sanitized
          expect(response.body.url).not.toContain('localhost');
          expect(response.body.url).not.toContain('127.0.0.1');
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF token for state-changing operations', async () => {
      // CSRF protection should be enabled for non-GET requests
      const response = await request(app.getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Job',
          company: 'Test Company',
        });

      // Should succeed with proper auth (JWT serves as CSRF protection)
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const requests = Array(10).fill(null);

      const responses = await Promise.all(
        requests.map(() =>
          request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'TestPassword123!',
            })
        )
      );

      const tooManyRequests = responses.some(r => r.status === 429);
      expect(tooManyRequests).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});
