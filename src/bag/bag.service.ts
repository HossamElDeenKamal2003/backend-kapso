// import { Injectable } from '@nestjs/common';
// import { CatchError } from 'decorators/CatchError.decorator';
// import { DataBaseService } from 'src/database/database.service';
// import languages from 'languages.json';
// import { Transaction } from 'types/Transaction';

// @Injectable()
// export class BagService {
//   constructor(private readonly database: DataBaseService) {}

//   @CatchError()
//   async getBag({ userId }: { userId: string }) {
//     const bag = await this.database.bag.findUnique({
//       where: { userId },
//       include: {
//         bagMall: {
//           include: {
//             mall: true,
//           },
//         },
//       },
//     });
//     bag.bagMall = bag.bagMall.filter((item) => {
//       const { spend, spendAt } = item;
//       const { priceForMonth } = item.mall;
//       const months = Math.floor(spend / priceForMonth);
//       spendAt.setMonth(spendAt.getMonth() + months);
//       return Number(spendAt) > Date.now();
//     });
//     return bag;
//   }

//   @CatchError()
//   async addItemToBag({
//     userId,
//     spend,
//     itemId,
//   }: {
//     userId: string;
//     spend: number;
//     itemId: string;
//   }) {
//     return this.database.$transaction(async (tx: Transaction) => {
//       const bag = await this.getBagInfo({ tx, userId });
//       if (bag.coins < spend)
//         return {
//           messages: [
//             { isSuccess: false, content: languages['insufficientFunds'] },
//           ],
//         };

//       const bagMallId = await this.getBagMallId({
//         tx,
//         bagId: bag.id,
//         mallId: itemId,
//         spend,
//       });

//       return tx.bag.update({
//         where: { userId },
//         data: { coins: bag.coins - spend },
//       });
//     });
//   }

//   @CatchError()
//   async getBagInfo({ tx, userId }: { tx: Transaction; userId: string }) {
//     const { bag } = await tx.user.findUnique({
//       where: { id: userId },
//       select: {
//         bag: true,
//       },
//     });

//     if (!bag) {
//       return await tx.bag.create({
//         data: { userId },
//       });
//     }
//     return bag;
//   }

//   @CatchError()
//   async getBagMallId({
//     tx,
//     bagId,
//     mallId,
//     spend,
//   }: {
//     tx: Transaction;
//     bagId: string;
//     mallId: string;
//     spend: number;
//   }) {
//     const { id } = await tx.bagMall.update({
//       where: {
//         bagId_mallId: {
//           bagId,
//           mallId,
//         },
//       },
//       select: {
//         id: true,
//       },
//       data: {
//         spendAt: new Date(),
//         spend,
//       },
//     });
//     if (!id) {
//       const bagMall = await tx.bagMall.create({
//         data: {
//           bagId,
//           mallId,
//           spend,
//         },
//       });
//       return bagMall.id;
//     }
//     return id;
//   }
// }
