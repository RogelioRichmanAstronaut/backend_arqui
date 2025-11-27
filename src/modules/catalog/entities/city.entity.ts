export class CityEntity {
  constructor(
    public readonly id: string,       // CO-BOG, CO-MDE, etc.
    public readonly name: string,     // Bogotá, Medellín, etc.
    public readonly country: string,  // Colombia, USA, etc.
    public readonly iataCode: string, // BOG, MDE, etc.
  ) {}
}

