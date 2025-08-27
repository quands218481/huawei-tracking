import { Prop, Schema, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

export class Description {
    @Prop()
    Value: string;
  
    @Prop()
    ResKey: string;
  
    @Prop({ type: Map, of: String })
    ResParams: Map<string, string>;
  }
  
  export class Amount {
    @Prop()
    Amount: string;
  
    @Prop()
    Currency: string;
  
    @Prop()
    State: string;
  }
  
  @Schema({ timestamps: true })
  export class Transaction extends Document {
    @Prop({ required: true, index: true })
    ActivityId: string;
  
    @Prop()
    Icon: string;
  
    @Prop()
    TypeId: number;
  
    @Prop()
    Date: Date;
  
    @Prop({ type: Description })
    Description: Description;
  
    @Prop()
    ActivityName: string;
  
    @Prop(raw({
      Value: { type: String, default: null },
      ResKey: String,
      ResParams: { type: Map, of: String }
    }))
    Amount: Record<string, any>;
  
    @Prop()
    Account: string;
  
    @Prop(raw({
      Value: { type: String, default: null },
      ResKey: String,
      ResParams: { type: Map, of: String }
    }))
    Balance: Record<string, any>;
  
    @Prop(raw({
      Value: { type: String, default: null },
      ResKey: String,
      ResParams: { type: Map, of: String }
    }))
    Status: Record<string, any>;
  
    @Prop({ type: Amount })
    SplitAmount: Amount;
  
    @Prop({ type: Amount })
    SplitBalance: Amount;
  
    @Prop()
    HasStatement: boolean;
  
    @Prop()
    ActivityItemStatus: number;

    @Prop({
      })
      createdAt?: Date
    
      @Prop({
      })
      updatedAt?: Date
  }

export const TransactionSchema = createSchemaForClassWithMethods(Transaction);
