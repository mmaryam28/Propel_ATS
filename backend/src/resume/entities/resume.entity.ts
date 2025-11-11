export class Resume {
  id: string;
  userId: string;
  templateId?: string;
  title: string;
  sections?: Record<string, any>;
  skills?: Record<string, any>;
  experience?: Record<string, any>;
  aiContent?: Record<string, any>;
  versionTag?: string;
  createdAt: Date;
  updatedAt: Date;
}
