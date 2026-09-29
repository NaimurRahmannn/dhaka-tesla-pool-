export class CalculateFareDto {
  constructor(
    public readonly distanceMeter: number,
    public readonly isPooled: boolean,
  ) {}
}
