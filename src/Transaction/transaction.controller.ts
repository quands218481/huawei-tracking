import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from "@nestjs/common";
import { TransactionService } from "./transaction.service";

class AddAccountDto {
  account: string
  name: string
}

@Controller('')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}


  @Post('worldfirst')
  async saveWFOtp(@Body()body: { account: string, otp: string }) {
    return this.transactionService.saveWFOtp(body)
  }

  @Get('worldfirst/:account')
  async getWFOtp(@Param('account') account: string) {
    return this.transactionService.getWFOtp(account)
  }

  @Post('payoneer')
  async getNewPOTransactions(@Body() body: any) {
    return this.transactionService.getNewPOTransactions(body)
  }

  @Post('account')
  async addAccount(@Body() body: AddAccountDto) {
    return this.transactionService.addAccount(body.account, body.name)
  }

  @Get('payoneer/:activityId')
  async getPOdetail(@Param('activityId') activityId: string ) {
    return this.transactionService.getPOdetail(activityId)
  }

  // @Get('')
  // async test() {
  //   return this.transactionService.sendMessage2('13/0/2024 16:23')
  // }
}