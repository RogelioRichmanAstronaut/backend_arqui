export class MarginEntity {
  constructor(
    public readonly base: number,     // Precio base del proveedor
    public readonly margin: number,   // Valor del margen calculado
    public readonly final: number,    // Precio final al cliente
  ) {}
}

