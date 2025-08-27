import { Prop, Schema, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

@Schema({ timestamps: true })
export class WorldFirstAccount extends Document {

    @Prop()
    account: string;

    @Prop()
    otp: string;

    @Prop({
    })
    createdAt?: Date

    @Prop({
    })
    updatedAt?: Date
}

export const WorldFirstAccountSchema = createSchemaForClassWithMethods(WorldFirstAccount);