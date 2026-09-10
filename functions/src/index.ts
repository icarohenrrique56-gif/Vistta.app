import { initializeApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import { onCall, onRequest, HttpsError, type Request } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createHmac, timingSafeEqual } from 'node:crypto';

initializeApp();

const database = getDatabase();
const adminAuth = getAdminAuth();
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;
const glitchtipWebhookSecret = defineSecret('GLITCHTIP_WEBHOOK_SECRET');
const githubDispatchToken = defineSecret('GITHUB_DISPATCH_TOKEN');
const githubRepository = defineSecret('GITHUB_REPOSITORY');

type UserProfile = { empresaId?: string; role?: string; status?: string; nome?: string; email?: string };
type SaleItem = { id: string; qtd: number; venda: number; custo: number; codigo?: string; marca?: string; modelo?: string };
type SalePayload = { requestId: string; cliId?: string; pag: string; desconto?: number; items: SaleItem[] };
type CallableRequest = { auth?: { uid: string; token?: Record<string, unknown> } | null; data?: any };

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
  return request.auth.uid;
}

function requireOwner(request: CallableRequest): string {
  const uid = requireAuth(request);
  if (request.auth?.token?.role !== 'developer' && request.auth?.token?.platformOwner !== true) throw new HttpsError('permission-denied', 'Somente um developer da plataforma pode executar esta operação.');
  return uid;
}

async function writePlatformAudit(actorUid: string, action: string, metadata: Record<string, unknown> = {}) {
  await database.ref('platformAudit').push({ actorUid, action, metadata, timestamp: ServerValue.TIMESTAMP, origin: 'cloud-function' });
}

async function getCompany(uid: string, adminOnly = false): Promise<{ empresaId: string; profile: UserProfile }> {
  const snapshot = await database.ref(`users/${uid}`).get();
  const profile = snapshot.val() as UserProfile | null;
  if (!profile?.empresaId) throw new HttpsError('failed-precondition', 'Usuário sem empresa vinculada.');
  if (['blocked', 'suspended', 'inactive'].includes(String(profile.status || '').toLowerCase())) throw new HttpsError('permission-denied', 'Usuário sem acesso ativo.');
  const companySnapshot = await database.ref(`empresas/${profile.empresaId}/info`).get();
  if (!companySnapshot.exists() || ['blocked', 'suspended', 'inactive'].includes(String(companySnapshot.val()?.status || '').toLowerCase())) throw new HttpsError('permission-denied', 'Empresa sem acesso ativo.');
  if (adminOnly && !['admin', 'manager'].includes(String(profile.role))) throw new HttpsError('permission-denied', 'Somente gestores podem executar esta operação.');
  return { empresaId: profile.empresaId, profile };
}

function requireManagement(profile: UserProfile) {
  if (!['admin', 'manager'].includes(String(profile.role))) throw new HttpsError('permission-denied', 'Somente gestores podem executar esta operação.');
}

async function getManagedSeller(uid: string, targetUid: string, empresaId: string) {
  if (!targetUid || targetUid === uid) throw new HttpsError('invalid-argument', 'Vendedor inválido.');
  const targetRef = database.ref(`users/${targetUid}`);
  const targetSnapshot = await targetRef.get();
  const target = targetSnapshot.val() as UserProfile | null;
  if (!targetSnapshot.exists() || target?.empresaId !== empresaId || !['seller', 'user'].includes(String(target.role))) {
    throw new HttpsError('not-found', 'Vendedor não encontrado nesta empresa.');
  }
  return { targetRef, target };
}

export const createSeller = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId, profile } = await getCompany(uid, true);
  requireManagement(profile);
  const name = String(request.data?.nome || '').trim();
  const email = String(request.data?.email || '').trim().toLowerCase();
  const password = String(request.data?.senha || '').trim();
  if (!name || !email || !email.includes('@')) throw new HttpsError('invalid-argument', 'Nome e e-mail são obrigatórios.');
  if (password && password.length < 6) throw new HttpsError('invalid-argument', 'A senha deve ter pelo menos 6 caracteres.');
  let createdUid = '';
  try {
    const created = await adminAuth.createUser({ email, password: password || undefined, displayName: name, disabled: false });
    createdUid = created.uid;
    const sellerProfile = { nome: name, email, empresaId, role: 'seller', status: 'active', convidadoPor: uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await database.ref().update({ [`users/${createdUid}`]: sellerProfile, [`empresas/${empresaId}/usuarios/${createdUid}`]: { ...sellerProfile, authUid: createdUid } });
    await writePlatformAudit(uid, 'seller.created', { sellerUid: createdUid, empresaId });
    return { uid: createdUid, email, status: 'active', passwordResetRequired: !password };
  } catch (error: any) {
    if (createdUid) await adminAuth.deleteUser(createdUid).catch(() => undefined);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(error?.code === 'auth/email-already-exists' ? 'already-exists' : 'internal', error?.message || 'Não foi possível criar o vendedor.');
  }
});

export const updateSeller = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId, profile } = await getCompany(uid, true);
  requireManagement(profile);
  const targetUid = String(request.data?.uid || '');
  const { targetRef, target } = await getManagedSeller(uid, targetUid, empresaId);
  const nome = String(request.data?.nome ?? target.nome ?? '').trim();
  const email = String(request.data?.email ?? target.email ?? '').trim().toLowerCase();
  if (!nome || !email || !email.includes('@')) throw new HttpsError('invalid-argument', 'Nome e e-mail são obrigatórios.');
  await adminAuth.updateUser(targetUid, { displayName: nome, email });
  const changes = { ...target, nome, email, role: 'seller', updatedAt: new Date().toISOString(), updatedBy: uid };
  await database.ref().update({ [`users/${targetUid}`]: changes, [`empresas/${empresaId}/usuarios/${targetUid}`]: { ...target, ...changes, authUid: targetUid } });
  return { uid: targetUid, nome, email };
});

export const setSellerStatus = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId, profile } = await getCompany(uid, true);
  requireManagement(profile);
  const targetUid = String(request.data?.uid || '');
  const status = String(request.data?.status || '');
  if (!['active', 'inactive'].includes(status)) throw new HttpsError('invalid-argument', 'Status inválido.');
  const { targetRef, target } = await getManagedSeller(uid, targetUid, empresaId);
  await targetRef.update({ status, updatedAt: new Date().toISOString(), updatedBy: uid });
  await database.ref(`empresas/${empresaId}/usuarios/${targetUid}`).update({ ...target, status, updatedAt: new Date().toISOString(), updatedBy: uid, authUid: targetUid });
  await adminAuth.updateUser(targetUid, { disabled: status !== 'active' });
  return { uid: targetUid, status };
});

export const getOpenCashStatus = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId } = await getCompany(uid);
  const snapshot = await database.ref(`empresas/${empresaId}/caixas`).orderByChild('status').equalTo('aberto').limitToFirst(1).get();
  let caixaId = '';
  snapshot.forEach(child => { caixaId = child.key || ''; return true; });
  return { aberto: Boolean(caixaId) };
});

export const listSellerProducts = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId, profile } = await getCompany(uid);
  if (!['seller', 'user'].includes(String(profile.role))) throw new HttpsError('permission-denied', 'Esta operação é exclusiva para vendedores.');
  const snapshot = await database.ref(`empresas/${empresaId}/produtos`).get();
  const products: Record<string, unknown>[] = [];
  snapshot.forEach(child => {
    const product = child.val() || {};
    products.push({ id: child.key, codigo: product.codigo || '', categoria: product.categoria || '', marca: product.marca || '', modelo: product.modelo || '', cor: product.cor || '', tamanho: product.tamanho || '', material: product.material || '', fornecedorId: product.fornecedorId || '', tratamento: product.tratamento || '', venda: Number(product.venda || 0), qtd: Number(product.qtd || 0), min: Number(product.min || 0) });
    return false;
  });
  return { products };
});

function numberOrError(value: unknown, label: string, minimum = 0): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum) throw new HttpsError('invalid-argument', `${label} inválido.`);
  return number;
}

function requestIdOrError(value: unknown): string {
  const requestId = String(value || '').trim();
  if (!requestId || requestId.length > 100) throw new HttpsError('invalid-argument', 'Identificador da operação inválido.');
  return requestId;
}

function validateItems(items: unknown): SaleItem[] {
  if (!Array.isArray(items) || items.length === 0) throw new HttpsError('invalid-argument', 'A venda precisa ter itens.');
  const quantities = new Map<string, number>();
  for (const item of items as SaleItem[]) {
    const id = String(item?.id || '');
    if (!id) continue;
    const quantity = numberOrError(item.qtd, 'Quantidade', 0.000001);
    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }
  const validItems = [...quantities.entries()].map(([id, qtd]) => ({ id, qtd, venda: 0, custo: 0, codigo: '', marca: '', modelo: '' }));
  if (validItems.length === 0) throw new HttpsError('invalid-argument', 'A venda precisa ter itens válidos.');
  return validItems;
}

async function claimRequest(path: string, uid: string): Promise<'claimed' | 'completed'> {
  const now = Date.now();
  const result = await database.ref(path).transaction((current: { status?: string; updatedAt?: number; uid?: string } | null) => {
    if (current?.status === 'completed') return current;
    if (current?.status === 'processing' && now - Number(current.updatedAt || now) < PROCESSING_TIMEOUT_MS) return;
    return { status: 'processing', uid, updatedAt: ServerValue.TIMESTAMP };
  });
  if (!result.committed) {
    const current = result.snapshot.val();
    if (current?.status === 'completed') {
      if (current.uid !== uid) throw new HttpsError('permission-denied', 'Esta operação pertence a outro usuário.');
      return 'completed';
    }
    throw new HttpsError('aborted', 'Esta operação já está sendo processada.');
  }
  return 'claimed';
}

export const finalizeSale = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId, profile } = await getCompany(uid);
  const payload = request.data as SalePayload;
  const requestId = requestIdOrError(payload?.requestId);
  const requestedItems = validateItems(payload?.items);
  const items = await Promise.all(requestedItems.map(async item => {
    const productSnapshot = await database.ref(`empresas/${empresaId}/produtos/${item.id}`).get();
    const product = productSnapshot.val();
    if (!productSnapshot.exists() || !product) throw new HttpsError('not-found', 'Um dos produtos da venda não existe mais.');
    const venda = numberOrError(product.venda, 'Preço do produto');
    const custo = numberOrError(product.custo, 'Custo do produto');
    return { ...item, venda, custo, codigo: String(product.codigo || ''), marca: String(product.marca || ''), modelo: String(product.modelo || '') };
  }));
  const pagamento = String(payload?.pag || '').trim();
  if (!['Pix', 'Crédito', 'Débito', 'Dinheiro'].includes(pagamento)) throw new HttpsError('invalid-argument', 'Forma de pagamento inválida.');
  const subtotal = items.reduce((sum, item) => sum + item.venda * item.qtd, 0);
  const custoTotal = items.reduce((sum, item) => sum + item.custo * item.qtd, 0);
  const desconto = Math.min(numberOrError(payload?.desconto || 0, 'Desconto'), subtotal);
  const total = subtotal - desconto;
  if (payload?.cliId && !(await database.ref(`empresas/${empresaId}/clientes/${payload.cliId}`).get()).exists()) throw new HttpsError('not-found', 'Cliente não encontrado nesta empresa.');
  const caixaSnapshot = await database.ref(`empresas/${empresaId}/caixas`).orderByChild('status').equalTo('aberto').limitToFirst(1).get();
  let caixaId = '';
  caixaSnapshot.forEach(child => { caixaId = child.key || ''; return true; });
  if (!caixaId) throw new HttpsError('failed-precondition', 'Abra o caixa antes de vender.');
  const requestPath = `empresas/${empresaId}/operacoes/vendas/${requestId}`;
  const claim = await claimRequest(requestPath, uid);
  if (claim === 'completed') {
    const previous = (await database.ref(requestPath).get()).val();
    return { saleId: previous.saleId, total: previous.total, alreadyProcessed: true };
  }
  const reserved: SaleItem[] = [];
  try {
    for (const item of items) {
      const result = await database.ref(`empresas/${empresaId}/produtos/${item.id}/qtd`).transaction(current => {
        const available = Number(current);
        if (!Number.isFinite(available) || available < item.qtd) return;
        return available - item.qtd;
      });
      if (!result.committed) throw new HttpsError('failed-precondition', `Estoque insuficiente para ${item.marca || item.id}.`);
      reserved.push(item);
    }
    const saleRef = database.ref(`empresas/${empresaId}/vendas`).push();
    const saleId = saleRef.key;
    if (!saleId) throw new HttpsError('internal', 'Não foi possível gerar a venda.');
    const sale = { cliId: payload.cliId || '', pag: pagamento, subtotal, desconto, total, custoBase: custoTotal, itens: items.length, itensDetalhados: items, data: new Date().toISOString(), dataHoraServidor: ServerValue.TIMESTAMP, createdAt: ServerValue.TIMESTAMP, caixaId, criadoPor: uid, vendedorId: uid, vendedorNome: String(profile.nome || profile.email || uid) };
    await database.ref().update({ [`empresas/${empresaId}/vendas/${saleId}`]: sale, [requestPath]: { status: 'completed', uid, saleId, total, updatedAt: ServerValue.TIMESTAMP } });
    return { saleId, total, alreadyProcessed: false };
  } catch (error) {
    await Promise.all(reserved.map(item => database.ref(`empresas/${empresaId}/produtos/${item.id}/qtd`).transaction(current => Number(current || 0) + item.qtd)));
    await database.ref(requestPath).remove();
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Não foi possível finalizar a venda.');
  }
});

export const openCash = onCall(async request => {
  let requestPath = '';
  let claimed = false;
  try {
    const uid = requireAuth(request);
    const { empresaId, profile } = await getCompany(uid, true);
    requireManagement(profile);
    const requestId = requestIdOrError(request.data?.requestId);
    const valorInicial = numberOrError(request.data?.valorInicial, 'Fundo inicial');
    requestPath = `empresas/${empresaId}/operacoes/caixa/${requestId}`;
    if (await claimRequest(requestPath, uid) === 'completed') return { caixaId: (await database.ref(requestPath).get()).val()?.caixaId, alreadyProcessed: true };
    claimed = true;
    const caixasRef = database.ref(`empresas/${empresaId}/caixas`);
    const caixaRef = caixasRef.push();
    const result = await caixasRef.transaction(current => {
      const caixas = current && typeof current === 'object' ? Object.values(current) : [];
      if (caixas.some((caixa: any) => caixa?.status === 'aberto')) return;
      return { ...(current || {}), [caixaRef.key as string]: { dataAbertura: new Date().toISOString(), createdAt: ServerValue.TIMESTAMP, valorInicial, status: 'aberto', operador: uid } };
    });
    if (!result.committed) throw new HttpsError('already-exists', 'Já existe um caixa aberto.');
    await database.ref().update({
      [requestPath]: { status: 'completed', uid, caixaId: caixaRef.key, updatedAt: ServerValue.TIMESTAMP },
      [`empresas/${empresaId}/caixaStatus`]: { aberto: true, caixaId: caixaRef.key, updatedAt: ServerValue.TIMESTAMP }
    });
    return { caixaId: caixaRef.key, alreadyProcessed: false };
  } catch (error) {
    if (claimed && requestPath) await database.ref(requestPath).remove();
    if (error instanceof HttpsError) throw error;
    console.error('Falha inesperada ao abrir caixa:', error);
    throw new HttpsError('internal', 'Não foi possível abrir o caixa. Verifique a conexão com o Firebase e tente novamente.');
  }
});

export const closeCash = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId, profile } = await getCompany(uid, true);
  requireManagement(profile);
  const requestId = requestIdOrError(request.data?.requestId);
  const requestPath = `empresas/${empresaId}/operacoes/caixa/${requestId}`;
  const caixaId = String(request.data?.caixaId || '');
  if (!caixaId) throw new HttpsError('invalid-argument', 'Caixa inválido.');
  const caixaRef = database.ref(`empresas/${empresaId}/caixas/${caixaId}`);
  const [vendasSnapshot, caixaSnapshot] = await Promise.all([database.ref(`empresas/${empresaId}/vendas`).orderByChild('caixaId').equalTo(caixaId).get(), caixaRef.get()]);
  if (!caixaSnapshot.exists() || caixaSnapshot.val()?.status !== 'aberto') throw new HttpsError('failed-precondition', 'O caixa já foi fechado ou não existe.');
  if (profile.role !== 'admin' && caixaSnapshot.val()?.operador !== uid) throw new HttpsError('permission-denied', 'Somente o operador do caixa pode fechá-lo.');
  if (await claimRequest(requestPath, uid) === 'completed') return { caixaId, alreadyProcessed: true };
  let totalVendas = 0;
  vendasSnapshot.forEach(child => { totalVendas += Number(child.val()?.total || 0); return false; });
  try {
    const result = await caixaRef.transaction((caixa: any) => {
      if (!caixa || caixa.status !== 'aberto') return;
      const lancamentos = caixa.lancamentos && typeof caixa.lancamentos === 'object' ? Object.values(caixa.lancamentos) : [];
      const totalLancamentos = lancamentos.reduce((total: number, item: any) => total + (item?.tipo === 'entrada' ? Number(item?.valor || 0) : -Number(item?.valor || 0)), 0);
      return { ...caixa, status: 'fechado', dataFechamento: new Date().toISOString(), closedAt: ServerValue.TIMESTAMP, fechadoPor: uid, totalVendas, valorFinal: Number(caixa.valorInicial || 0) + totalVendas + totalLancamentos };
    });
    if (!result.committed) throw new HttpsError('failed-precondition', 'O caixa já foi fechado ou não existe.');
    await database.ref().update({
      [requestPath]: { status: 'completed', uid, caixaId, updatedAt: ServerValue.TIMESTAMP },
      [`empresas/${empresaId}/caixaStatus`]: { aberto: false, caixaId, updatedAt: ServerValue.TIMESTAMP }
    });
    return { caixaId, alreadyProcessed: false };
  } catch (error) {
    await database.ref(requestPath).remove();
    throw error;
  }
});

export const addCashEntry = onCall(async request => {
  const uid = requireAuth(request);
  const { empresaId, profile } = await getCompany(uid, true);
  requireManagement(profile);
  const requestId = requestIdOrError(request.data?.requestId);
  const requestPath = `empresas/${empresaId}/operacoes/caixa/${requestId}`;
  const caixaId = String(request.data?.caixaId || '');
  const tipo = String(request.data?.tipo || '');
  const descricao = String(request.data?.descricao || '').trim();
  const valor = numberOrError(request.data?.valor, 'Valor', 0.01);
  if (!caixaId || !['entrada', 'saida', 'sangria'].includes(tipo) || !descricao) throw new HttpsError('invalid-argument', 'Lançamento inválido.');
  const caixa = await database.ref(`empresas/${empresaId}/caixas/${caixaId}`).get();
  if (!caixa.exists() || caixa.val()?.status !== 'aberto') throw new HttpsError('failed-precondition', 'O caixa está fechado.');
  if (profile.role !== 'admin' && caixa.val()?.operador !== uid) throw new HttpsError('permission-denied', 'Somente o operador do caixa pode registrar movimentos.');
  if (await claimRequest(requestPath, uid) === 'completed') return { entryId: (await database.ref(requestPath).get()).val()?.entryId, alreadyProcessed: true };
  const entryRef = database.ref(`empresas/${empresaId}/caixas/${caixaId}/lancamentos`).push();
  try {
    await entryRef.set({ tipo, descricao, valor, data: new Date().toISOString(), createdAt: ServerValue.TIMESTAMP, operador: uid });
    await database.ref(requestPath).set({ status: 'completed', uid, caixaId, entryId: entryRef.key, updatedAt: ServerValue.TIMESTAMP });
    return { entryId: entryRef.key, alreadyProcessed: false };
  } catch (error) {
    await database.ref(requestPath).remove();
    throw error;
  }
});

function isSafeWebhookValue(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 100; }
function webhookIsAuthorized(request: Request, expected: string): boolean {
  const provided = String(request.get('x-vistta-webhook-signature') || '');
  if (!expected || !provided) return false;
  const body = request.rawBody || JSON.stringify(request.body || {});
  const expectedBuffer = Buffer.from(createHmac('sha256', expected).update(body).digest('hex'));
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export const glitchtipIssueWebhook = onRequest({ cors: false, secrets: [glitchtipWebhookSecret, githubDispatchToken, githubRepository] }, async (request, response) => {
  if (request.method !== 'POST' || !webhookIsAuthorized(request, glitchtipWebhookSecret.value())) { response.status(401).json({ error: 'unauthorized' }); return; }
  const payload = request.body || {};
  const issueId = payload.issue_id || payload.issueId;
  const release = payload.release;
  const environment = payload.environment;
  if (!isSafeWebhookValue(issueId) || !isSafeWebhookValue(release) || !isSafeWebhookValue(environment)) { response.status(400).json({ error: 'issue_id, release and environment are required' }); return; }
  const dispatchToken = githubDispatchToken.value();
  const repository = githubRepository.value();
  if (!dispatchToken || !repository || !/^[^/]+\/[^/]+$/.test(repository)) { response.status(503).json({ error: 'automation is not configured' }); return; }
  const dispatchResponse = await fetch(`https://api.github.com/repos/${repository}/dispatches`, { method: 'POST', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${dispatchToken}`, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: JSON.stringify({ event_type: 'glitchtip-issue', client_payload: { issue_id: issueId, release, environment } }) });
  if (!dispatchResponse.ok) { console.error('GitHub dispatch failed', { status: dispatchResponse.status }); response.status(502).json({ error: 'automation dispatch failed' }); return; }
  response.status(202).json({ accepted: true });
});

export const getPlatformOverview = onCall(async request => {
  const ownerUid = requireOwner(request);
  const [usersSnapshot, companiesSnapshot, auditSnapshot] = await Promise.all([database.ref('users').get(), database.ref('empresas').get(), database.ref('platformAudit').limitToLast(25).get()]);
  const users = usersSnapshot.val() && typeof usersSnapshot.val() === 'object' ? Object.entries(usersSnapshot.val() as Record<string, any>) : [];
  const companies = companiesSnapshot.val() && typeof companiesSnapshot.val() === 'object' ? Object.entries(companiesSnapshot.val() as Record<string, any>) : [];
  const isActive = (value: any) => !['blocked', 'suspended', 'inactive'].includes(String(value?.status || '').toLowerCase());
  const newSince = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const createdAt = (value: any) => Date.parse(value?.createdAt || value?.criadoEm || '') || 0;
  const recentLogins = users.map(([uid, value]) => ({ uid, ...value })).filter(value => value.lastLoginAt).sort((a, b) => Date.parse(String(b.lastLoginAt)) - Date.parse(String(a.lastLoginAt))).slice(-10).reverse();
  const activity = auditSnapshot.val() && typeof auditSnapshot.val() === 'object' ? Object.entries(auditSnapshot.val() as Record<string, any>).map(([id, value]) => ({ id, ...value })).reverse() : [];
  await writePlatformAudit(ownerUid, 'platform.overview.viewed');
  return { generatedAt: new Date().toISOString(), users: { total: users.length, active: users.filter(([, value]) => isActive(value)).length, blocked: users.filter(([, value]) => !isActive(value)).length, newLast30Days: users.filter(([, value]) => createdAt(value) >= newSince).length }, companies: { total: companies.length, active: companies.filter(([, value]) => isActive(value?.info)).length, blocked: companies.filter(([, value]) => !isActive(value?.info)).length, newLast30Days: companies.filter(([, value]) => createdAt(value?.info) >= newSince).length }, recentLogins, recentActivity: activity, security: { ownerUid, mfa: 'not_configured', suspiciousAttempts: 'not_collected' }, billing: { configured: false, message: 'Nenhuma integração de planos ou pagamentos foi configurada.' } };
});

export const listPlatformCompanies = onCall(async request => {
  const ownerUid = requireOwner(request);
  const [companiesSnapshot, usersSnapshot] = await Promise.all([database.ref('empresas').get(), database.ref('users').get()]);
  const companies = companiesSnapshot.val() && typeof companiesSnapshot.val() === 'object' ? companiesSnapshot.val() as Record<string, any> : {};
  const users = usersSnapshot.val() && typeof usersSnapshot.val() === 'object' ? Object.values(usersSnapshot.val() as Record<string, any>) : [];
  const result = Object.entries(companies).map(([companyId, value]) => ({ companyId, info: value?.info || {}, userCount: users.filter((user: any) => user.empresaId === companyId).length }));
  await writePlatformAudit(ownerUid, 'platform.companies.viewed');
  return { companies: result };
});

export const setCompanyStatus = onCall(async request => {
  const ownerUid = requireOwner(request);
  const companyId = String(request.data?.companyId || '');
  const status = String(request.data?.status || '');
  if (!companyId || !['active', 'blocked'].includes(status)) throw new HttpsError('invalid-argument', 'Empresa ou status inválido.');
  const companyRef = database.ref(`empresas/${companyId}/info`);
  if (!(await companyRef.get()).exists()) throw new HttpsError('not-found', 'Empresa não encontrada.');
  await companyRef.update({ status, updatedAt: new Date().toISOString(), updatedBy: ownerUid });
  await writePlatformAudit(ownerUid, 'company.status.changed', { companyId, status });
  return { companyId, status };
});

export const setUserStatus = onCall(async request => {
  const ownerUid = requireOwner(request);
  const uid = String(request.data?.uid || '');
  const status = String(request.data?.status || '');
  if (!uid || !['active', 'blocked'].includes(status)) throw new HttpsError('invalid-argument', 'Usuário ou status inválido.');
  if (uid === ownerUid) throw new HttpsError('failed-precondition', 'O proprietário não pode bloquear a própria conta.');
  const userRef = database.ref(`users/${uid}`);
  if (!(await userRef.get()).exists()) throw new HttpsError('not-found', 'Usuário não encontrado.');
  await userRef.update({ status, updatedAt: new Date().toISOString(), updatedBy: ownerUid });
  await adminAuth.updateUser(uid, { disabled: status === 'blocked' });
  await writePlatformAudit(ownerUid, 'user.status.changed', { uid, status });
  return { uid, status };
});
