const target = process.env.BACKEND_URL || 'http://localhost:3000';

module.exports = {
  '/auth/**': { target },
  '/credit-applications': { target },
};
