const { Client } = require('ssh2');
const fs = require('fs');
const host = '10.100.0.11';
const username = 'root';
const password = 'T3cn01n4pym1.2025*';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected, downloading frontend dist...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // We will execute a tar command to compress the dist folder, then download it
    conn.exec('pct exec 900 -- tar -czf /tmp/dist.tar.gz -C /home/inapymi/CONVEN/apps/web-admin/dist . && pct pull 900 /tmp/dist.tar.gz /tmp/dist.tar.gz', (err, stream) => {
      if (err) throw err;
      stream.on('close', (code) => {
        sftp.fastGet('/tmp/dist.tar.gz', './dist.tar.gz', (err) => {
          if (err) throw err;
          console.log('Downloaded dist.tar.gz');
          conn.end();
        });
      }).on('data', (data) => process.stdout.write(data))
        .stderr.on('data', (data) => process.stderr.write(data));
    });
  });
}).connect({ host, port: 22, username, password, readyTimeout: 10000 });
