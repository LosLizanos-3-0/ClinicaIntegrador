/*
 * Integración con HSM Sign CR: la firma se realiza dentro de una ventana
 * propia del servicio. El sitio que integra nunca recibe el PIN de firma
 * del usuario, solo el resultado de la operación (el documento ya firmado
 * o el motivo del error).
 */

// HSM Sign CR corre como un solo servicio (Render sirve el frontend Y la
// API desde el mismo origen, igual que en local), así que el popup y el
// backend real viven en el mismo dominio — a diferencia de cuando la app
// estaba dividida entre Netlify (frontend) y AWS (backend).
const HSM_URL = 'https://hsm-sign-cr.onrender.com';

// Dónde vive el POPUP (el formulario donde el usuario escribe su PIN).
// Solo el dominio, sin ruta: se reutiliza tal cual para comparar contra
// event.origin en el listener de message, que nunca trae path.
export const HSM_SIGN_URL = HSM_URL;

// Dónde vive el BACKEND real (la API con base de datos).
export const HSM_API_URL = HSM_URL;

const CANAL_LISTO = 'hsmsigncr:listo';
const CANAL_FIRMA = 'hsmsigncr:firmar';
const ANCHO_VENTANA = 480;
const ALTO_VENTANA = 640;
const INTERVALO_VIGILANCIA_MS = 500;

const MENSAJES_ERROR = {
    PIN_INCORRECTO: 'El PIN de firma es incorrecto.',
    SIN_CERTIFICADO: 'El contribuyente no tiene un certificado digital vigente.',
    NO_ENCONTRADO: 'No existe un contribuyente con esa identificación en HSM Sign CR.',
};

function construirUrlPopup() {
    // El origin del sitio que integra es obligatorio: sin él, el popup no
    // sabe a quién devolverle el resultado por postMessage.
    const parametros = new URLSearchParams({
        origin: window.location.origin,
    });

    return `${HSM_SIGN_URL}/firmar_popup.html?${parametros.toString()}`;
}

/**
 * Abre el popup de HSM Sign CR para firmar un documento XML. El usuario
 * escribe su identificación y PIN directamente en el popup (nunca en tu
 * sitio), y el popup llama al backend real de HSM Sign CR para firmar.
 *
 * @param {object} datos
 * @param {string} datos.identificacion - Cédula/DIMEX del contribuyente.
 * @param {string} datos.xmlFactura - El XML sin firmar, como texto.
 * @returns {Promise<object>} Resuelve con el resultado, nunca rechaza por
 *   un PIN incorrecto o una firma fallida (revisa `result.status`):
 *   { status: 'completed', xmlFirmado, hashDocumento, serialCertificado }
 *   { status: 'cancelled' }
 *   { status: 'rejected', motivo }
 */
export function firmarConHSMSignCR(datos) {
    return new Promise((resolve, reject) => {
        const url = construirUrlPopup();

        const ventana = window.open(
            url,
            'hsmsigncr-firmar',
            `width=${ANCHO_VENTANA},height=${ALTO_VENTANA}`,
        );

        if (!ventana) {
            reject(new Error(
                'El navegador bloqueó la ventana de firma de '
                + 'HSM Sign CR. Habilita las ventanas emergentes '
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
            if (evento.origin !== HSM_SIGN_URL) {
                return;
            }

            const mensaje = evento.data || {};

            // El popup avisa que ya cargó y está listo para recibir el
            // documento a firmar — se lo mandamos por postMessage en vez
            // de meterlo en la URL, porque un XML de factura no cabe en
            // un query string.
            if (mensaje.channel === CANAL_LISTO) {
                ventana.postMessage(
                    {
                        channel: CANAL_FIRMA,
                        identificacion: datos.identificacion,
                        xmlFactura: datos.xmlFactura,
                    },
                    HSM_SIGN_URL,
                );

                return;
            }

            if (mensaje.channel !== CANAL_FIRMA) {
                return;
            }

            if (!mensaje.result) {
                return;
            }

            finalizado = true;
            limpiar();
            resolve(mensaje.result);
        }

        // Sin este vigía, si el usuario cierra la ventana sin firmar la
        // promesa quedaría pendiente para siempre y la pantalla se
        // congelaría en el estado de procesando.
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

export function describirResultadoFirma(resultado) {
    if (resultado?.status === 'completed') {
        return 'El documento se firmó correctamente.';
    }

    if (resultado?.status === 'cancelled') {
        return 'La firma fue cancelada antes de completarse.';
    }

    if (resultado?.status === 'rejected') {
        return MENSAJES_ERROR[resultado.rejectionCode]
            || resultado.motivo
            || 'No se pudo firmar el documento.';
    }

    return 'No fue posible determinar el resultado de la firma.';
}

/**
 * Validar la firma de un documento no involucra ningún dato sensible del
 * usuario (no hace falta PIN), así que no necesita popup — es una llamada
 * directa al backend real de HSM Sign CR.
 *
 * @param {string} xmlFirmado - El XML ya firmado, como texto.
 * @returns {Promise<object>} { esValida, signerId, signerName, algorithm,
 *   certificateStatus, signatureDate } o { esValida: false, motivo }.
 */
export async function validarConHSMSignCR(xmlFirmado) {
    const respuesta = await fetch(`${HSM_API_URL}/api/documentos/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlFirmado }),
    });

    return respuesta.json();
}

/**
 * Consulta el/los certificados digitales de un contribuyente por su
 * cédula/DIMEX — útil para verificar que alguien ya tiene un certificado
 * vigente en HSM Sign CR antes de recibir cualquier documento suyo (por
 * ejemplo, al inscribirlo en tu propio sistema). No requiere conocer
 * ningún ID interno de HSM Sign CR.
 *
 * @param {string} identificacion - Cédula/DIMEX del contribuyente.
 * @returns {Promise<object[]>} Arreglo de certificados (revisa que alguno
 *   tenga `estado: 'VIGENTE'`). Lanza un error si esa identificación no
 *   está registrada en HSM Sign CR.
 */
export async function consultarCertificadoPorIdentificacion(identificacion) {
    const respuesta = await fetch(
        `${HSM_API_URL}/api/documentos/certificados/por-identificacion/${encodeURIComponent(identificacion)}`,
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo consultar el certificado.');
    }

    return datos;
}

/**
 * Busca contribuyentes por nombre/razón social (coincidencia parcial) —
 * útil cuando solo se conoce el nombre de la persona/empresa, no su
 * cédula. Por cada resultado indica si tiene un certificado vigente en
 * este momento, su nombre y su identificación.
 *
 * @param {string} nombre - Nombre o razón social a buscar (parcial, no
 *   distingue mayúsculas/minúsculas).
 * @returns {Promise<object[]>} Arreglo de { identificacion,
 *   nombre_razon_social, tipo_contribuyente, estadoContribuyente,
 *   firmaVigente, certificado }.
 */
export async function consultarContribuyentesPorNombre(nombre) {
    const respuesta = await fetch(
        `${HSM_API_URL}/api/documentos/certificados/por-nombre?nombre=${encodeURIComponent(nombre)}`,
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo realizar la búsqueda.');
    }

    return datos;
}
