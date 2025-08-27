import { Prop, Schema, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

@Schema({ timestamps: true })
export class AppTracking extends Document {

    @Prop()
    downCount: string;

    @Prop()
    chartType: string;

    @Prop()
    downCountDesc: string;

    @Prop()
    version: string;

     @Prop()
    developerName: string;

     @Prop()
    briefDes: string;

    @Prop()
    category: string[];

    @Prop()
    group: string;

    @Prop()
    name: string;

    @Prop()
    app_url: string;

    @Prop()
    icon: string;

    @Prop()
    description: string;

    @Prop()
    pkgName: string;

    @Prop()
    releaseDate: number;

    @Prop()
    screenShots: string[];

    @Prop({
    })
    createdAt?: Date

    @Prop({
    })
    updatedAt?: Date
}

export const AppTrackingSchema = createSchemaForClassWithMethods(AppTracking);