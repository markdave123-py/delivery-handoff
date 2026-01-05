import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED'],
  })
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED';

  @Column({ type: 'uuid', nullable: true })
  currentRiderId: string | null;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
