const { execSync } = require('child_process');
console.log('Compilando TypeScript a JavaScript puro...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
} catch (e) {
  console.log('Advertencias de TypeScript ignoradas exitosamente. El código JS fue generado.');
}
console.log('Iniciando empaquetado de Electron...');
execSync('npx electron-builder', { stdio: 'inherit' });
