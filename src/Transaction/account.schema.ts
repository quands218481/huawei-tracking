import { Prop, Schema, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

export class BaseAccount {
    @Prop()
    account: string;

    @Prop()
    name: string;

}

@Schema({ timestamps: true })
export class Account extends Document {

    @Prop()
    email: string;

    @Prop({
    })
    createdAt?: Date

    @Prop({
    })
    updatedAt?: Date
}

export const AccountSchema = createSchemaForClassWithMethods(Account);