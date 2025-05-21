// import { Body, Controller, Get, ValidationPipe } from '@nestjs/common';
// import { UserDecorator } from 'decorators/user.decorator';
// import { BagService } from './bag.service';

// @Controller('bag')
// export class BagController {
//   constructor(private bagService: BagService) {}

//   @Get()
//   async getMyBag(@UserDecorator({ idOnly: true }) userId: string) {
//     return this.bagService.getBag({ userId });
//   }
//   @Get()
//   async addItemToBag(
//     @UserDecorator({ idOnly: true }) userId: string,
//     @Body(new ValidationPipe()) { itemId, spend }: any,
//   ) {
//     return this.bagService.addItemToBag({ userId, itemId: '', spend: 0 });
//   }
// }
