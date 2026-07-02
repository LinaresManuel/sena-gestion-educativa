/**
 * Script de prueba del sistema de permisos
 * Ejecutar con: npx tsx scripts/test-permissions.ts
 * 
 * Prueba:
 * 1. Login y obtención de JWT con permisos
 * 2. Endpoints de admin
 * 3. Verificación de permisos en tiempo real
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function log(msg: string) {
  console.log(msg);
}

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  log(`  ${icon} ${name}: ${message}`);
}

async function testLogin() {
  log('\n🔐 Probando login...');
  
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123!' }),
    });

    if (!res.ok) {
      addResult('Login', false, `HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    
    // Verificar que la respuesta incluye permisos
    if (data.user && Array.isArray(data.user.permisos)) {
      addResult('Login', true, `Usuario: ${data.user.username}, Permisos: ${data.user.permisos.length}`);
      return data.user;
    } else {
      addResult('Login', false, 'No se recibieron permisos en la respuesta');
      return null;
    }
  } catch (error: any) {
    addResult('Login', false, error.message);
    return null;
  }
}

async function testGetMe(cookie: string) {
  log('\n👤 Probando endpoint /me...');
  
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `sena_session=${cookie}` },
    });

    if (!res.ok) {
      addResult('GET /me', false, `HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    
    if (data.permisos && Array.isArray(data.permisos)) {
      addResult('GET /me', true, `Permisos: ${data.permisos.length}`);
      return data;
    } else {
      addResult('GET /me', false, 'No se recibieron permisos');
      return null;
    }
  } catch (error: any) {
    addResult('GET /me', false, error.message);
    return null;
  }
}

async function testAdminEndpoints(cookie: string) {
  log('\n🛡️ Probando endpoints de admin...');
  
  // Test GET /api/admin/permisos
  try {
    const res = await fetch(`${BASE_URL}/api/admin/permisos`, {
      headers: { Cookie: `sena_session=${cookie}` },
    });
    
    if (res.ok) {
      const data = await res.json();
      addResult('GET /admin/permisos', true, `${data.length} permisos`);
    } else {
      addResult('GET /admin/permisos', false, `HTTP ${res.status}`);
    }
  } catch (error: any) {
    addResult('GET /admin/permisos', false, error.message);
  }

  // Test GET /api/admin/roles
  try {
    const res = await fetch(`${BASE_URL}/api/admin/roles`, {
      headers: { Cookie: `sena_session=${cookie}` },
    });
    
    if (res.ok) {
      const data = await res.json();
      addResult('GET /admin/roles', true, `${data.length} roles`);
    } else {
      addResult('GET /admin/roles', false, `HTTP ${res.status}`);
    }
  } catch (error: any) {
    addResult('GET /admin/roles', false, error.message);
  }

  // Test GET /api/admin/usuarios
  try {
    const res = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { Cookie: `sena_session=${cookie}` },
    });
    
    if (res.ok) {
      const data = await res.json();
      addResult('GET /admin/usuarios', true, `${data.length} usuarios`);
    } else {
      addResult('GET /admin/usuarios', false, `HTTP ${res.status}`);
    }
  } catch (error: any) {
    addResult('GET /admin/usuarios', false, error.message);
  }

  // Test GET /api/admin/stats
  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: `sena_session=${cookie}` },
    });
    
    if (res.ok) {
      const data = await res.json();
      addResult('GET /admin/stats', true, `Usuarios: ${data.totalUsuarios}, Roles: ${data.totalRoles}, Permisos: ${data.totalPermisos}`);
    } else {
      addResult('GET /admin/stats', false, `HTTP ${res.status}`);
    }
  } catch (error: any) {
    addResult('GET /admin/stats', false, error.message);
  }
}

async function testPermissionCheck(cookie: string) {
  log('\n🔍 Probando verificación de permisos...');
  
  // Intentar acceder a un endpoint sin permiso adecuado
  // Primero, crear un usuario de prueba con rol lector
  try {
    const res = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { Cookie: `sena_session=${cookie}` },
    });
    
    if (res.ok) {
      const usuarios = await res.json();
      const adminUser = usuarios.find((u: any) => u.username === 'admin');
      
      if (adminUser) {
        addResult('Verificar usuario admin', true, `ID: ${adminUser.id}, Roles: ${adminUser.roles}`);
      } else {
        addResult('Verificar usuario admin', false, 'Usuario admin no encontrado');
      }
    }
  } catch (error: any) {
    addResult('Verificar usuario admin', false, error.message);
  }
}

function printSummary() {
  log('\n📊 Resumen de pruebas:');
  log('=' .repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  log(`✅ Pasaron: ${passed}`);
  log(`❌ Fallaron: ${failed}`);
  log(`Total: ${results.length}`);
  
  if (failed > 0) {
    log('\n❌ Pruebas fallidas:');
    results.filter(r => !r.passed).forEach(r => {
      log(`  - ${r.name}: ${r.message}`);
    });
  }
  
  log('=' .repeat(50));
}

async function runTests() {
  log('🧪 Iniciando pruebas del sistema de permisos');
  log('=' .repeat(50));
  
  // Test login
  const loginResult = await testLogin();
  
  if (!loginResult) {
    log('\n❌ No se pudo hacer login. Abortando pruebas.');
    printSummary();
    return;
  }
  
  // Obtener cookie del login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin123!' }),
  });
  
  const setCookie = loginRes.headers.get('set-cookie');
  const cookieMatch = setCookie?.match(/sena_session=([^;]+)/);
  const cookie = cookieMatch ? cookieMatch[1] : '';
  
  if (!cookie) {
    log('\n❌ No se pudo obtener la cookie. Abortando pruebas.');
    printSummary();
    return;
  }
  
  // Ejecutar pruebas
  await testGetMe(cookie);
  await testAdminEndpoints(cookie);
  await testPermissionCheck(cookie);
  
  // Resumen
  printSummary();
}

runTests().catch(console.error);
