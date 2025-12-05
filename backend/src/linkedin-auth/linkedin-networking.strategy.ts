import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import axios from 'axios';

@Injectable()
export class LinkedInNetworkingStrategy extends PassportStrategy(OAuth2Strategy, 'linkedin-networking') {
  constructor() {
    const clientID = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const callbackURL = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/linkedin-auth/callback';

    super({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: clientID || 'missing-client-id',
      clientSecret: clientSecret || 'missing-client-secret',
      callbackURL,
      scope: ['openid', 'profile', 'email'],
      state: true,
      store: {
        store: (req: any, cb: any) => {
          // Store the state from the query parameter
          const state = req.query.state;
          cb(null, state);
        },
        verify: (req: any, state: any, cb: any) => {
          // Verify returns the state unchanged
          cb(null, true, state);
        },
      },
    });
  }

  // This strategy is used for networking/contacts, not authentication
  // The validate method fetches profile and attaches tokens
  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    try {
      // Fetch user profile from LinkedIn OpenID Connect endpoint
      const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const linkedInProfile = {
        id: response.data.sub,
        displayName: response.data.name,
        name: {
          givenName: response.data.given_name,
          familyName: response.data.family_name,
        },
        emails: [{ value: response.data.email }],
        photos: [{ value: response.data.picture }],
        provider: 'linkedin',
        _raw: JSON.stringify(response.data),
        _json: response.data,
        accessToken,
        refreshToken,
      };

      done(null, linkedInProfile);
    } catch (error) {
      done(error, null);
    }
  }
}
