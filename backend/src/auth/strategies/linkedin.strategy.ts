import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import axios from 'axios';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(OAuth2Strategy, 'linkedin') {
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

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    try {
      // Fetch user profile using OpenID Connect userinfo endpoint
      const { data } = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // LinkedIn OpenID Connect returns: sub, name, given_name, family_name, email, picture
      const user = {
        email: data.email,
        firstname: data.given_name || data.name?.split(' ')?.[0] || '',
        lastname: data.family_name || data.name?.split(' ')?.slice(1).join(' ') || '',
      };

      done(null, user);
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error);
      done(error, null);
    }
  }
}
