import { Prop, Schema, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

@Schema({ timestamps: true })
export class AppCategory extends Document {
    @Prop()
    category: string;
}
export const AppCategorySchema = createSchemaForClassWithMethods(AppCategory);