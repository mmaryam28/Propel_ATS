import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwt: any;
  let supabase: any;
  let mail: any;

  beforeEach(async () => {
    jwt = { sign: jest.fn().mockReturnValue('token') };
    
    // Create a comprehensive mock for Supabase client chain
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    supabase = {
      getClient: jest.fn().mockReturnValue(mockChain),
    };

    mail = {
      sendResetPasswordEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        { provide: SupabaseService, useValue: supabase },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const firstname = 'Test';
      const lastname = 'User';
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      const mockClient = supabase.getClient();
      // First call checks if user exists (should return null)
      mockClient.single.mockResolvedValueOnce({ data: null, error: null });
      // Second call creates the user
      mockClient.single.mockResolvedValueOnce({ 
        data: { id: '1', email, firstname, lastname }, 
        error: null 
      });
      // Third call is for issueLoginForUser
      mockClient.single.mockResolvedValueOnce({ 
        data: { id: '1', email, firstname, lastname }, 
        error: null 
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.register(firstname, lastname, email, password);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('token');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = { 
        id: '1', 
        email, 
        password: 'hashedPassword',
        firstname: 'Test',
        lastname: 'User'
      };

      const mockClient = supabase.getClient();
      mockClient.single.mockResolvedValueOnce({ data: user, error: null });
      // Second call for issueLoginForUser
      mockClient.single.mockResolvedValueOnce({ data: user, error: null });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(email, password);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('token');
    });
  });
});
