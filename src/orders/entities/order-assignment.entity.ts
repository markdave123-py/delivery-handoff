import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('order_assignments')
export class OrderAssignment {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date | null;
}
