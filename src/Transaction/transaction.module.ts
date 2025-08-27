import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Transaction, TransactionSchema } from './transaction.schema';
import { Account, AccountSchema } from './account.schema';
import { WorldFirstAccount, WorldFirstAccountSchema } from './worldfirst.schema';

@Module({
  imports: [HttpModule,
    MongooseModule.forFeature(
    [
      {
        name: Transaction.name,
        schema: TransactionSchema
      },
      {
        name: Account.name,
        schema: AccountSchema
      },
      {
        name: WorldFirstAccount.name,
        schema: WorldFirstAccountSchema
      },
    ]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}