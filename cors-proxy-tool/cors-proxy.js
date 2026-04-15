const cors_anywhere = require('cors-anywhere');

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 9001;

cors_anywhere.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: [],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function() {
    console.log('Running CORS proxy on ' + host + ':' + port);
    console.log('');
    console.log('Usage: http://localhost:' + port + '/https://your-api-url.com');
});