exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for'] || 'unknown';
  console.log('Visitor IP:', ip);
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};
