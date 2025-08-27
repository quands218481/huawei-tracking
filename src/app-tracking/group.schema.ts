import { Prop, Schema, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

@Schema({ timestamps: true })
export class AppGroup extends Document {
    @Prop()
    group: string;
}
export const AppGroupSchema = createSchemaForClassWithMethods(AppGroup);