import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

    if (!clientID || !clientSecret) {
      // If not configured, still construct strategy with dummy keys to avoid boot failure in dev
      super({
        clientID: clientID || 'missing-client-id',
        clientSecret: clientSecret || 'missing-client-secret',
        callbackURL,
        scope: ['email', 'profile'],
      });
      return;
    }

    super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const firstname = profile.name?.givenName;
    const lastname = profile.name?.familyName;
    const profilePicture = profile.photos?.[0]?.value;
    return { email, firstname, lastname, profilePicture };
  }
}
