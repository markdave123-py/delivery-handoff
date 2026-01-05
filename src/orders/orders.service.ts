import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { DataSource, IsNull } from 'typeorm';
  import { randomUUID } from 'crypto';
  import { Order } from './entities/order.entity';
  import { OrderAssignment } from './entities/order-assignment.entity';
  
  @Injectable()
  export class OrdersService {
    constructor(private readonly dataSource: DataSource) {}
  
    async createOrder(): Promise<{ orderId: string }> {
      const order = this.dataSource.manager.create(Order, {
        id: randomUUID(),
        status: 'CREATED',
        currentRiderId: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
      await this.dataSource.manager.save(order);
      return { orderId: order.id };
    }
  
    async startOrder(orderId: string, riderId: string) {
      return this.dataSource.transaction(async (manager) => {
        const order = await manager.findOne(Order, {
          where: { id: orderId },
          lock: { mode: 'pessimistic_write' },
        });
  
        if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
  
        // Idempotent start
        if (order.currentRiderId === riderId) return order;
  
        if (order.currentRiderId) {
          throw new ConflictException('ORDER_ALREADY_ASSIGNED');
        }
  
        order.currentRiderId = riderId;
        order.status = 'IN_PROGRESS';
        order.version += 1;
        order.updatedAt = new Date();
  
        await manager.save(order);
  
        const assignment = manager.create(OrderAssignment, {
          id: randomUUID(),
          orderId,
          riderId,
          startedAt: new Date(),
          finishedAt: null,
        });
  
        await manager.save(assignment);
  
        return order;
      });
    }
  
    async finishOrder(orderId: string, riderId: string) {
      return this.dataSource.transaction(async (manager) => {
        const order = await manager.findOne(Order, {
          where: { id: orderId },
          lock: { mode: 'pessimistic_write' },
        });
  
        if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
  
        // Idempotent finish
        if (!order.currentRiderId) return order;
  
        if (order.currentRiderId !== riderId) {
          throw new ConflictException('RIDER_NOT_ACTIVE');
        }
  
        await manager.update(
          OrderAssignment,
          { orderId, riderId, finishedAt: IsNull() },
          { finishedAt: new Date() },
        );
  
        order.currentRiderId = null;
        order.status = 'CREATED';
        order.version += 1;
        order.updatedAt = new Date();
  
        await manager.save(order);
  
        return order;
      });
    }
  }
  