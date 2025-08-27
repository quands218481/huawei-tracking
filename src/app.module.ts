import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionModule } from './Transaction/transaction.module';
import { config } from 'dotenv';
import { AppTrackingModule } from './app-tracking/app.module';

config();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AppTrackingModule
    // TransactionModule
  ],
})
export class AppModule implements OnApplicationBootstrap { 
  constructor() {}
  onApplicationBootstrap(): any {

  }
 }
