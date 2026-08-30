/*
 * Integración con BankyFinanzas: el cobro se realiza dentro de una
 * ventana propia de la pasarela. ClinicaIntegrador nunca recibe el número
 * completo de la tarjeta ni el código de seguridad, solo el
 * resultado del cobro y datos no sensibles.
 */

// En producción esta dirección debe ser 'https://bankyfinanzas.netlify.app'.
// Solo el dominio, sin '/checkout': se reutiliza tal cual para comparar
// contra event.origin en el listener de message, que nunca trae path.
export const BANKY_URL = 'https://bankyfinanzas.netlify.app';

// Se obtiene registrando el negocio en BankyFinanzas, en la pantalla
// de Credenciales API.
export const MERCHANT_ID = '6InbGN0SPVUIMMtHZ3Gy31NLPxg1';

const CANAL_CHECKOUT = 'bankyfinanzas:checkout';
const ANCHO_VENTANA = 560;
const ALTO_VENTANA = 760;
const INTERVALO_VIGILANCIA_MS = 500;

const MENSAJES_RECHAZO = {
    INSUFFICIENT_FUNDS: 'La tarjeta no tiene fondos suficientes.',
    CARD_EXPIRED: 'La tarjeta se encuentra vencida.',
    CARD_DECLINED: 'El cobro supera el límite permitido por transacción.',
    INVALID_CARD: 'Los datos de la tarjeta no son válidos.',
    NETWORK_ERROR: 'No se pudo contactar al banco emisor.',
};

function construirUrlCheckout(datos) {
    // El dominio de ClinicaIntegrador es obligatorio: sin él, BankyFinanzas no
    // sabe a qué origen enviarle el postMessage con el resultado.
    const parametros = new URLSearchParams({
        merchantId: MERCHANT_ID,
        orderId: datos.orderId,
        amount: String(datos.amount),
        description: datos.description,
        currency: datos.currency || 'CRC',
        origin: window.location.origin,
    });

    return ${BANKY_URL}/checkout?${parametros.toString()};
}

export function pagarConBanky(datos) {
    return new Promise((resolve, reject) => {
        const url = construirUrlCheckout(datos);

        const ventana = window.open(
            url,
            'bankyfinanzas-checkout',
            width=${ANCHO_VENTANA},height=${ALTO_VENTANA},
        );

        if (!ventana) {
            reject(new Error(
                'El navegador bloqueó la ventana de pago de '
                + 'BankyFinanzas. Habilita las ventanas emergentes '
                + 'para este sitio e intenta de nuevo.',
            ));

            return;
        }

        let finalizado = false;

        function limpiar() {
            window.removeEventListener(
                'message',
                manejarMensaje,
            );

            clearInterval(intervaloVigilancia);
        }

        function manejarMensaje(evento) {
            if (evento.origin !== BANKY_URL) {
                return;
            }

            const datos = evento.data || {};

            if (datos.channel !== CANAL_CHECKOUT) {
                return;
            }

            if (!datos.result) {
                return;
            }

            finalizado = true;
            limpiar();
            resolve(datos.result);
        }

        // Sin este vigía, si el usuario cierra la ventana sin pagar
        // la promesa quedaría pendiente para siempre y la pantalla
        // se congelaría en el estado de procesando.
        const intervaloVigilancia = setInterval(() => {
            if (ventana.closed && !finalizado) {
                finalizado = true;
                limpiar();
                resolve({ status: 'cancelled' });
            }
        }, INTERVALO_VIGILANCIA_MS);

        window.addEventListener('message', manejarMensaje);
    });
}

export function describirResultado(resultado) {
    if (resultado?.status === 'completed') {
        return 'El pago se procesó correctamente.';
    }

    if (resultado?.status === 'cancelled') {
        return 'El pago fue cancelado antes de finalizar.';
    }

    if (resultado?.status === 'rejected') {
        return MENSAJES_RECHAZO[resultado.rejectionCode]
            || 'El pago fue rechazado por el banco emisor.';
    }

    return 'No fue posible determinar el resultado del pago.';
}

export function aMetodoDePago(resultado) {
    return {
        titular: resultado?.cardholderName || '',
        tipoTarjeta: resultado?.cardBrand || '',
        ultimosDigitos: resultado?.cardLastFourDigits || '',
        vencimiento: resultado?.cardExpiration || '',
    };
}