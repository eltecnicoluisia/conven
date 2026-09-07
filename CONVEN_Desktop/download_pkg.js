const { Client } = require('ssh2');
const fs = require('fs');
const host = '10.100.0.11';
const username = 'root';
const password = 'T3cn01n4pym1.2025*';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    conn.exec('pct exec 900 -- cat /home/inapymi/CONVEN/apps/web-admin/package.json', (err, stream) => {
      let data = '';
      stream.on('data', (chunk) => data += chunk).on('close', () => {
        fs.writeFileSync('C:\\Users\\Soporte Tecnico\\Desktop\\CONVEN\\CONVEN_Desktop_Front\\package.json', data);
        conn.end();
      });
    });
  });
}).connect({ host, port: 22, username, password, readyTimeout: 10000 });
