import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import axios from 'axios';

@Injectable()
export class LinkedInOAuthStrategy extends PassportStrategy(OAuth2Strategy, 'linkedin') {
  constructor() {
    const clientID = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const callbackURL = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/auth/linkedin/callback';

    super({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: clientID || 'missing-client-id',
      clientSecret: clientSecret || 'missing-client-secret',
      callbackURL,
      scope: ['openid', 'profile', 'email'],
      state: true,
    });
  }

  async userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void) {
    try {
      const { data } = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      console.log('LinkedIn userinfo response:', JSON.stringify(data, null, 2));
      done(null, data);
    } catch (error: any) {
      console.error('LinkedIn userinfo fetch error:', error.response?.data || error.message);
      done(error);
    }
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    console.log('LinkedIn validate - Profile:', JSON.stringify(profile, null, 2));
    
    // LinkedIn OpenID Connect returns: sub, name, given_name, family_name, email, picture
    const email = profile.email || '';
    
    if (!email) {
      console.error('LinkedIn profile missing email');
      throw new Error('Email not provided by LinkedIn');
    }
    
    const user = {
      email,
      firstname: profile.given_name || profile.name?.split(' ')?.[0] || '',
      lastname: profile.family_name || profile.name?.split(' ')?.slice(1).join(' ') || '',
      profilePicture: profile.picture || undefined,
    };

    console.log('LinkedIn user extracted:', user);
    return user;
  }
}
