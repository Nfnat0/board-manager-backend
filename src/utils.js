// utils.js
exports.addCorsHeaders = (response) => {
  return {
    ...response,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE,PUT',
      ...response.headers,
    },
  };
};
