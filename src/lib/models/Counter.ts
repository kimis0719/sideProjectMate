import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Omit<Document, '_id'> {
  _id: string;
  seq: number;
}

const CounterSchema: Schema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter ||
  mongoose.model<ICounter>('Counter', CounterSchema, 'counters');
