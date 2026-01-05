import { Body, Controller, Param, Post, HttpCode } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create() {
    return this.ordersService.createOrder();
  }

  @Post(':id/start')
  @HttpCode(200)
  start(
    @Param('id') orderId: string,
    @Body('riderId') riderId: string,
  ) {
    return this.ordersService.startOrder(orderId, riderId);
  }

  @Post(':id/finish')
  @HttpCode(200)
  finish(
    @Param('id') orderId: string,
    @Body('riderId') riderId: string,
  ) {
    return this.ordersService.finishOrder(orderId, riderId);
  }
}
