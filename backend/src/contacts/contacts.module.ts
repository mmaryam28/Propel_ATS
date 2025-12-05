import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ContactsController, DiscoveryController],
  providers: [ContactsService, DiscoveryService],
  exports: [ContactsService, DiscoveryService],
})
export class ContactsModule {}
