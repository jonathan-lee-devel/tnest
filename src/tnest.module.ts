import { Module } from '@nestjs/common';
import { TnestService } from './tnest.service';

@Module({
  providers: [TnestService],
  exports: [TnestService],
})
export class TnestModule {}
