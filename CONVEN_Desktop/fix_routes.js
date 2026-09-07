const fs = require('fs');
const path = require('path');
const indexPath = 'C:/Users/Soporte Tecnico/Desktop/CONVEN/CONVEN_Desktop/backend_src/index.ts';

let content = fs.readFileSync(indexPath, 'utf8');

// Fix route imports: './routes/X' -> './X.routes'
const routeMap = {
  'infraestructura': 'infraestructura.routes',
  'familias': 'familias.routes',
  'inspecciones': 'inspecciones.routes',
  'gastos': 'gastos.routes',
  'residentes': 'residentes.routes',
  'dashboard': 'dashboard.routes',
  'tesoreria': 'tesoreria.routes',
  'config': 'config.routes',
  'propiedades': 'propiedades.routes',
  'auth': 'auth.routes',
  'usuarios': 'usuarios.routes',
  'auditoria': 'auditoria.routes',
  'licencia': 'licencia.routes',
};

for (const [from, to] of Object.entries(routeMap)) {
  content = content.replace(
    new RegExp(`from '\\./routes/${from}'`, 'g'),
    `from './${to}'`
  );
}

// Also fix @condominio/core-bimonetario if still present
content = content.replace(/import \{ MotorCondominio \} from '@condominio\/core-bimonetario';/g, '');

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Fixed route paths in index.ts');
