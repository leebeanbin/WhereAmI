import { SubwayArrivalDto } from '../dtos/TransportDto';

export class SubwayArrivalBuilder {
  static fromRaw(item: Record<string, string>): SubwayArrivalDto {
    return {
      lineId: item.subwayId,
      trainLineNm: item.trainLineNm,
      arvlMsg2: item.arvlMsg2,
      arvlMsg3: item.arvlMsg3,
      arvlCd: item.arvlCd,
      recptnDt: item.recptnDt,
    };
  }

  static fromRawList(items: Record<string, string>[]): SubwayArrivalDto[] {
    return items.map(SubwayArrivalBuilder.fromRaw);
  }
}
