import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const [uid, role] = process.argv.slice(2);
const allowedRoles = new Set(['admin', 'manager', 'user']);
if (!uid || !allowedRoles.has(role)) {
  console.error('Uso: node functions/scripts/set-profile-role.mjs <UID> <admin|manager|user>');
  process.exit(1);
}

initializeApp();
const auth = getAuth();
const database = getDatabase();
const user = await auth.getUser(uid);
const profileRef = database.ref(`users/${uid}`);
const profile = (await profileRef.get()).val();
if (!profile) {
  console.error(`Perfil users/${uid} não encontrado.`);
  process.exit(1);
}
if (role !== 'admin' && !profile.empresaId) {
  console.error('Um perfil sem empresa só pode ser o administrador inicial.');
  process.exit(1);
}

await profileRef.update({ role, updatedAt: new Date().toISOString() });
console.log(`Role ${role} aplicada ao UID ${uid} (${user.email || 'sem e-mail'}). Faça logout/login para atualizar a sessão.`);
