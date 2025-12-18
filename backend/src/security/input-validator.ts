import { BadRequestException } from '@nestjs/common';
import * as validator from 'validator';
import xss from 'xss';

export class InputValidator {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    if (!input) return input;
    return xss(validator.escape(input));
  }
  
  /**
   * Sanitize HTML content (for rich text fields)
   */
  static sanitizeHtml(input: string): string {
    if (!input) return input;
    
    const options = {
      whiteList: {
        p: [],
        br: [],
        strong: [],
        em: [],
        u: [],
        ul: [],
        ol: [],
        li: [],
        a: ['href', 'title', 'target'],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    };
    
    return xss(input, options);
  }
  
  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    
    if (!validator.isEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }
    
    return true;
  }
  
  /**
   * Validate password strength
   */
  static validatePassword(password: string): boolean {
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      throw new BadRequestException('Password is too long');
    }
    
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
    
    return true;
  }
  
  /**
   * Validate URL
   */
  static validateUrl(url: string, options?: validator.IsURLOptions): boolean {
    if (!url) return true; // URL is optional in most cases
    
    const defaultOptions: validator.IsURLOptions = {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      ...options,
    };
    
    if (!validator.isURL(url, defaultOptions)) {
      throw new BadRequestException('Invalid URL format');
    }
    
    // Additional check for localhost/internal IPs to prevent SSRF
    if (url.match(/localhost|127\.0\.0\.1|0\.0\.0\.0|::1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/i)) {
      throw new BadRequestException('Internal URLs are not allowed');
    }
    
    return true;
  }
  
  /**
   * Validate UUID
   */
  static validateUuid(uuid: string): boolean {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
    
    if (!validator.isUUID(uuid)) {
      throw new BadRequestException('Invalid UUID format');
    }
    
    return true;
  }
  
  /**
   * Validate integer
   */
  static validateInteger(value: any, min?: number, max?: number): number {
    const num = parseInt(value, 10);
    
    if (isNaN(num)) {
      throw new BadRequestException('Value must be a valid integer');
    }
    
    if (min !== undefined && num < min) {
      throw new BadRequestException(`Value must be at least ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw new BadRequestException(`Value must be at most ${max}`);
    }
    
    return num;
  }
  
  /**
   * Validate date
   */
  static validateDate(date: string): Date {
    if (!date) {
      throw new BadRequestException('Date is required');
    }
    
    if (!validator.isISO8601(date)) {
      throw new BadRequestException('Invalid date format (use ISO 8601)');
    }
    
    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    
    return parsedDate;
  }
  
  /**
   * Validate string length
   */
  static validateLength(value: string, min: number, max: number, fieldName: string = 'Field'): boolean {
    if (!value) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    
    if (value.length < min) {
      throw new BadRequestException(`${fieldName} must be at least ${min} characters`);
    }
    
    if (value.length > max) {
      throw new BadRequestException(`${fieldName} must be at most ${max} characters`);
    }
    
    return true;
  }
  
  /**
   * Validate enum value
   */
  static validateEnum<T>(value: T, allowedValues: T[], fieldName: string = 'Value'): boolean {
    if (!allowedValues.includes(value)) {
      throw new BadRequestException(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
    
    return true;
  }
  
  /**
   * Sanitize filename to prevent directory traversal
   */
  static sanitizeFilename(filename: string): string {
    if (!filename) {
      throw new BadRequestException('Filename is required');
    }
    
    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[/\\]/g, '');
    
    // Remove special characters except dots, dashes, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }
    
    if (!sanitized) {
      throw new BadRequestException('Invalid filename');
    }
    
    return sanitized;
  }
  
  /**
   * Validate file size
   */
  static validateFileSize(sizeInBytes: number, maxSizeInMB: number = 10): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    if (sizeInBytes > maxSizeInBytes) {
      throw new BadRequestException(`File size must be less than ${maxSizeInMB} MB`);
    }
    
    return true;
  }
  
  /**
   * Validate file type
   */
  static validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    if (!allowedTypes.includes(mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
    
    return true;
  }
  
  /**
   * Validate phone number
   */
  static validatePhone(phone: string): boolean {
    if (!phone) return true; // Phone is optional in most cases
    
    if (!validator.isMobilePhone(phone, 'any')) {
      throw new BadRequestException('Invalid phone number format');
    }
    
    return true;
  }
  
  /**
   * Check for SQL injection patterns
   */
  static checkSqlInjection(input: string): boolean {
    if (!input) return true;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
      /(--|\;|\/\*|\*\/)/g,
      /(\bOR\b.*=.*|1=1|'=')/gi,
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        throw new BadRequestException('Input contains potential SQL injection attempt');
      }
    }
    
    return true;
  }
}
