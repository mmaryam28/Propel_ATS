import { Injectable } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';

/**
 * UC-135: Security utility service for input sanitization and XSS prevention
 */
@Injectable()
export class SecurityService {
  /**
   * Sanitize user input to prevent XSS attacks
   * Removes malicious HTML/JavaScript while preserving safe content
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove script tags, event handlers, and dangerous attributes
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href'],
      ALLOW_DATA_ATTR: false,
    });
  }

  /**
   * Sanitize an object's string properties recursively
   */
  sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Validate and sanitize email input
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Basic email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmed = email.trim().toLowerCase();
    
    if (!emailRegex.test(trimmed)) {
      throw new Error('Invalid email format');
    }
    
    return trimmed;
  }

  /**
   * Escape special characters for SQL-like operations
   * Note: Should still use parameterized queries, this is defense-in-depth
   */
  escapeSQLInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  /**
   * Validate file upload types
   */
  validateFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? allowedTypes.includes(ext) : false;
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }
}
