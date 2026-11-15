module.exports = {
  '/auth/**': { target: process.env.BACKEND_URL || 'http://localhost:3000' },
};
