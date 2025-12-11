import React from 'react';
import { Container, Section } from '../components/ui/Card';
import ProfileEditForm from '../components/profile/ProfileEditForm';

export default function Profile() {
  return (
    <Container>
      <Section className="pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your personal and professional information</p>
      </Section>

      <Section className="pt-0">
        <ProfileEditForm />
      </Section>
    </Container>
  );
}
