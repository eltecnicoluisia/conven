const crypto = require('crypto');

function generarLicencia() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let licencia = '';
  for (let i = 0; i < 15; i++) {
    const indiceAleatorio = crypto.randomInt(0, caracteres.length);
    licencia += caracteres.charAt(indiceAleatorio);
  }
  return licencia;
}

const nuevaLicencia = generarLicencia();
console.log('=============================================');
console.log('       GENERADOR DE LICENCIAS CONVEN');
console.log('=============================================');
console.log('NUEVA LICENCIA GENERADA: ' + nuevaLicencia);
console.log('Largo: ' + nuevaLicencia.length + ' caracteres (Alfanumerico sensible a mayusculas/minusculas)');
console.log('=============================================');
console.log('Guarde esta licencia. Puede entregarsela a su cliente.');
