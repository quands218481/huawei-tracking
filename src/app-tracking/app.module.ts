import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { AppTracking, AppTrackingSchema } from './app.schema';
import { AppTrackingController } from './app.controller';
import { AppTrackingService } from './app.service';
import { AppGroup, AppGroupSchema } from './group.schema';
import { AppCategory, AppCategorySchema } from './category.schema';

@Module({
  imports: [HttpModule,
    MongooseModule.forFeature(
    [
      {
        name: AppTracking.name,
        schema: AppTrackingSchema
      },
      {
        name: AppGroup.name,
        schema: AppGroupSchema
      },
      {
        name: AppCategory.name,
        schema: AppCategorySchema
      }
    ]),
  ],
  controllers: [AppTrackingController],
  providers: [AppTrackingService],
  exports: [AppTrackingService],
})
export class AppTrackingModule {}