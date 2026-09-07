const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Soporte Tecnico/Desktop/CONVEN/CONVEN_Desktop/backend_src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
const prismaShim = "import { PrismaClient } from '@prisma/client';\nconst prisma = new PrismaClient();";

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Replace @condominio/database import with prisma client
  content = content.replace(/import \{ prisma \} from '@condominio\/database';/g, prismaShim);
  
  // Fix wrong relative path for authMiddleware
  content = content.replace(/from '\.\.\/authMiddleware'/g, "from './authMiddleware'");
  
  // Fix wrong relative path for shadowLogger
  content = content.replace(/from '\.\.\/shadowLogger'/g, "from './shadowLogger'");

  fs.writeFileSync(fp, content, 'utf8');
  console.log('Patched: ' + file);
}
console.log('Done!');
