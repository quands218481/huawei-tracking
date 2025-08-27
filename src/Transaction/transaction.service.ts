import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HttpService } from "@nestjs/axios";
import { Transaction } from "./transaction.schema";
import { Account } from "./account.schema";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WorldFirstAccount } from "./worldfirst.schema";

@Injectable()
export class TransactionService {
    constructor(
        private readonly http: HttpService,
        @InjectModel(WorldFirstAccount.name) private worldFirst: Model<WorldFirstAccount>,
        @InjectModel(Transaction.name) private po: Model<Transaction>,
        @InjectModel(Account.name) private accountModel: Model<Account>,
    ) {
    }

    async saveWFOtp(body: { account: string, otp: string }) {
        try {
            return await this.worldFirst.updateOne({account: body.account}, {$set: { otp: body.otp }}, {  upsert: true })
        } catch (error) {
            throw error
        }
    }

    async getWFOtp(account: string) {
        try {   
            return (await this.worldFirst.findOne({ account }))?.otp;
        } catch (error) {
            throw error
        }
    }

    async getNewPOTransactions(body: any) {
        try {
            console.log('call webhook')
            console.log(body.email)
            const { email, data } = body
            const transactions = data['Transactions']
            // await this.accountModel.updateOne({ email: email }, { $set: { updateAt: new Date() } }, { upsert: true })
            if (!transactions || !transactions.length) {
                return true
            }

            const productUrl = process.env.WEALIFY_TRANSACTION_URL
            const config = {
                headers: { 'x-api-key': process.env.API_KEY },
            }
            if (transactions.length) {
                const body2 = []
                for (const transaction of transactions) {
                    const existed = await this.po.findOne({ ActivityId: transaction['ActivityId'] });
                    if (!existed) {
                        body2.push(transaction)
                    }
                }
                if (body2.length) {
                    await this.po.insertMany(body2)
                    await this.http.axiosRef.post(productUrl, body2, config)
                    await this.sendPOTransaction(email, body2)
                }
            }
            return true;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async sendPOTransaction(email, body) {
        try {
            const formatTime = this.convertString(this.formatDateTimeGMT7())
            const title1 = `*PAYONEER DATA BOT*%0A${formatTime}%0A`
            let formatString = `${this.convertString(email)}%0A%0A%0A`
            body.forEach((b) => {
                formatString += `*${this.convertString(b['ActivityId'])}*%0A  └${this.convertString(b['Amount']['ResParams']['Amount'])} ${this.convertString(b['Amount']['ResParams']['Currency'])}%0A    └${this.convertString(this.formatDateToGMT7(b['Date']))}%0A%0A`
            })
            const url = 'https://api.telegram.org/bot7156903848:AAGLtlI3R00AGiT0Z8FmIOY22vbbngl1Z0E/sendMessage?chat_id=-4286939226&text='
            await this.http.axiosRef.get(`${url}${title1}${formatString}&parse_mode=MarkdownV2`)
        } catch (error) {
            throw error
        }
    }

    async getPOdetail(ActivityId: string) {
        try {
            const transaction = await this.po.findOne({ ActivityId })
            if (!transaction) throw new NotFoundException('Transaction not found!!')
            return transaction;
        } catch (error) {
            throw error
        }
    }

    // async sendMessage2(message: string) {
    //     const url = 'https://api.telegram.org/bot7156903848:AAGLtlI3R00AGiT0Z8FmIOY22vbbngl1Z0E/sendMessage?chat_id=-4188536400&text='
    //     const body = [{
    //         activity: '31273617263',
    //         amount: 100,
    //         currency: 'USD',
    //         account: 'quan080195@gmail.com'
    //     }, {
    //         activity: '36153615134',
    //         amount: 200,
    //         currency: 'EUR',
    //         account: 'minhduong@gmail.com'
    //     }, {
    //         activity: '098965651123',
    //         amount: 50,
    //         currency: 'AUD',
    //         account: 'vietnamtienlen36213676231@gmail.com'
    //     }]
    //     const formatBody = body.map((b) => {
    //         return { 
    //             activity: this.padString(b.activity,14),
    //             amountCurrency: this.padString((b.amount.toString() + ' ' + b.currency), 11),
    //             account: this.padString(b.account, 17)
    //          }
    //     })
    //     const title = '|  <b>ActivityId</b>  |   <b>Amoun</b>   |     <b>Account</b>     |%0A|--------------|-----------|-----------------|'
    //     let formatString = ''
    //     formatBody.forEach((b) => {
    //         formatString += (`%0A|${b.activity}|${b.amountCurrency}|${b.account}|`)
    //     })
    //     this.http.axiosRef.get(`${url}💰 💵 💸 Payoneer Data Bot💰 💵 💸%0A%0A🆘 🆘 🆘 🆘 🆘%0A🆘 🆘 🆘 🆘 🆘%0A🆘 🆘 🆘 🆘 🆘<pre>${title}${formatString}</pre>&parse_mode=HTML`)
    // }

    async sendMessage(message: string) {
        try {
            const result = message.replace(/\./g, '\\.')
            const url = 'https://api.telegram.org/bot7033207074:AAGZqoGFPdZGvQS_HCZgwu8hv8frZ1knZnY/sendMessage?chat_id=-4276805661&text='
            await this.http.axiosRef.get(`${url}🆘🆘🆘%0A%0A%0APLEASE CHECK ACCOUNT PAYONEER ${result}&parse_mode=MarkdownV2`)
        } catch (error) {
            throw error
        }
    }


    async addAccount(account: string, name: string) {
        try {
            await this.accountModel.create({ name, account })
        } catch (error) {
            throw error
        }
    }
    formatDateTimeGMT7() {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Bangkok', // GMT+07:00
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };

        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const parts = formatter.formatToParts(now);

        let day, month, year, hour, minute;

        for (const part of parts) {
            switch (part.type) {
                case 'day':
                    day = part.value;
                    break;
                case 'month':
                    month = part.value;
                    break;
                case 'year':
                    year = part.value;
                    break;
                case 'hour':
                    hour = part.value;
                    break;
                case 'minute':
                    minute = part.value;
                    break;
            }
        }

        return `\\[${day}-${month}-${year} ${hour}:${minute}\\]`;
    }

    formatDateToGMT7(dateString) {
        // Tạo đối tượng Date từ chuỗi ngày gốc (GMT+4)
        const date = new Date(dateString);

        // Chuyển đổi múi giờ từ GMT+4 sang UTC bằng cách trừ đi 4 giờ
        const dateInUTC = new Date(date.getTime() - (3 * 60 * 60 * 1000));

        // Chuyển đổi múi giờ từ UTC sang GMT+07 bằng cách cộng thêm 7 giờ
        const dateInGMT7 = new Date(dateInUTC.getTime() + (7 * 60 * 60 * 1000));

        // Lấy các thành phần ngày tháng và giờ phút
        const day = String(dateInGMT7.getDate()).padStart(2, '0');
        const month = String(dateInGMT7.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
        const year = dateInGMT7.getFullYear();
        const hours = String(dateInGMT7.getHours()).padStart(2, '0');
        const minutes = String(dateInGMT7.getMinutes()).padStart(2, '0');

        // Trả về chuỗi định dạng theo yêu cầu
        return `${day}-${month}-${year}T${hours}:${minutes}`;
    }

    padString(input, desiredLength) {
        let str = input.toString();
        if (str.length > desiredLength) {
            return str.substring(0, desiredLength - 2) + '..';
        } else if (str.length < desiredLength) {
            let spacesNeeded = desiredLength - str.length;
            return ' '.repeat(spacesNeeded) + str;
        }
        return str;
    }
    convertString(input: string) {
        return input.replace(/\-/g, '\\-').replace(/\./g, '\\.')
    }
    compareTimes(date1, date2) {
        // Tính chênh lệch thời gian (lấy giá trị tuyệt đối)
        const difference = Math.abs(date1 - date2);

        // So sánh chênh lệch thời gian với 60 giây (1 phút)
        return difference > 300000; // 60000 ms = 60 giây
    }
}