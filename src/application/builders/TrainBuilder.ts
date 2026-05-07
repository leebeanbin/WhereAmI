import { TrainDto } from '../dtos/TransportDto';

export class TrainBuilder {
  static fromRaw(item: Record<string, any>): TrainDto {
    return {
      trainNo: item.trainNo,
      trainType: item.trainType,
      trainTypeName: item.trainTypeName,
      depPlaceName: item.depPlaceName,
      arrPlaceName: item.arrPlaceName,
      depPlandTime: item.depPlandTime,
      arrPlandTime: item.arrPlandTime,
      adultCharge: item.adultCharge,
    };
  }

  static fromRawList(items: Record<string, any>[]): TrainDto[] {
    return items.map(TrainBuilder.fromRaw);
  }
}
