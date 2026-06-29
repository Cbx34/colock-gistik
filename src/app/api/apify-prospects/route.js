import legacyHandler from '../../../../api/apify-prospects';

const runLegacyHandler = async (request) => {
  const body = await request.json().catch(() => ({}));

  return new Promise((resolve) => {
    const response = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(name, value) {
        this.headers[name] = value;
      },
      json(payload) {
        resolve(Response.json(payload, { status: this.statusCode, headers: this.headers }));
      },
    };

    Promise.resolve(legacyHandler({ method: request.method, body }, response)).catch((error) => {
      resolve(Response.json({ error: error instanceof Error ? error.message : 'Erreur inconnue Apify' }, { status: 500 }));
    });
  });
};

export async function POST(request) {
  return runLegacyHandler(request);
}
