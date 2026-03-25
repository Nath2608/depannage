import { Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
