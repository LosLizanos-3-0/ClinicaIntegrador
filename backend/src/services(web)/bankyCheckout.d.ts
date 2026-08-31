export interface BankyCheckoutRequest {
  orderId: string;
  amount: number;
  description: string;
  currency?: string;
}

export interface BankyCheckoutResult {
  status: "completed" | "cancelled" | "rejected";
  rejectionCode?: string;
  cardholderName?: string;
  cardBrand?: string;
  cardLastFourDigits?: string;
  cardExpiration?: string;
}

export function pagarConBanky(
  datos: BankyCheckoutRequest,
): Promise<BankyCheckoutResult>;

export function describirResultado(
  resultado: BankyCheckoutResult | undefined,
): string;

export function aMetodoDePago(resultado: BankyCheckoutResult): {
  titular: string;
  tipoTarjeta: string;
  ultimosDigitos: string;
  vencimiento: string;
};
