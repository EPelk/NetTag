import http from 'http';
import express from 'express';
import next from 'next';

const PORT = parseInt(process.env.PORT || "3000", 10);
const DEV = process.env.NODE_ENV !== 'production';
const APP = next({ dev: DEV });
const HANDLE = APP.getRequestHandler();

APP.prepare().then(() => {
  const SERVER = express();
  
  SERVER.get('/testroute', (req, res) => {
    res.send('test route');
  });
  
  SERVER.get('/{*splat}', (req, res) => {
    return HANDLE(req, res);
  });
  
  http.createServer(SERVER).listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT} in ${DEV ? 'development' : process.env.NODE_ENV} mode.`);
  });
});