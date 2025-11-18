const crypto = require('crypto');

const b64u = {
  encode: (buf) => Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'),
  decode: (str) => Buffer.from(str.replace(/-/g,'+').replace(/_/g,'/'), 'base64')
};

function hmacSign(secret, payload){
  return b64u.encode(crypto.createHmac('sha256', secret).update(payload).digest());
}

function createToken(secret, claims, ttlSec){
  const iat = Math.floor(Date.now()/1000);
  const exp = iat + (ttlSec||900);
  const body = { ...claims, iat, exp };
  const payload = b64u.encode(JSON.stringify(body));
  const sig = hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

function verifyToken(secret, token){
  if(!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const good = hmacSign(secret, payload);
  if(!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  const data = JSON.parse(Buffer.from(payload,'base64').toString());
  if(data.exp && data.exp < Math.floor(Date.now()/1000)) return null;
  return data;
}

async function readJson(req, limit=10*1024){
  return new Promise((resolve, reject)=>{
    let size=0; let chunks=[];
    req.on('data', (c)=>{ size+=c.length; if(size>limit){ reject(new Error('payload_too_large')); req.destroy(); } else { chunks.push(c); } });
    req.on('end', ()=>{
      try{ const obj = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(obj); }
      catch(e){ reject(new Error('invalid_json')); }
    });
    req.on('error', reject);
  });
}

function setNoStore(res){
  res.setHeader('Cache-Control','no-store');
}

module.exports = { b64u, hmacSign, createToken, verifyToken, readJson, setNoStore };
