import * as storageMocks from './lib/storage';

console.log("Firebase: Switched to LocalStorage Mode");

// Mock Auth
export const auth: any = {
  get currentUser() {
    return JSON.parse(localStorage.getItem('auth_user') || 'null');
  },
  onAuthStateChanged: (authOrCb: any, cb?: any) => {
    const callback = typeof authOrCb === 'function' ? authOrCb : cb;
    if (typeof callback !== 'function') return () => {};
    
    const handler = () => {
      const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
      console.log("Mock Auth: State change detected", user?.email);
      callback(user);
    };
    
    window.addEventListener('auth_change', handler);
    // Initial check
    setTimeout(handler, 0); 
    
    return () => window.removeEventListener('auth_change', handler);
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  console.log("Mock Auth: Logging in", email);
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  const superAdminEmail = 'cmrabbi@gmail.com';
  const superAdminPass = '123456';

  // Ensure super admin exists in storage if not already there
  if (!users.find((u: any) => u.email === superAdminEmail)) {
    const sAdmin = {
      id: 'super-admin-id',
      uid: 'super-admin-id',
      email: superAdminEmail,
      password: superAdminPass,
      role: 'super_admin',
      displayName: 'Super Admin',
      emailVerified: true,
      providerData: [],
      createdAt: new Date().toISOString()
    };
    users.push(sAdmin);
    localStorage.setItem('users', JSON.stringify(users));
  }

  let user = users.find((u: any) => u.email === (email || '').trim());

  if (user) {
    if (user.password !== password) {
      throw { code: 'auth/wrong-password', message: 'পাসওয়ার্ড সঠিক নয়।' };
    }
  } else {
    // New registration on first login
    if (email === superAdminEmail && password !== superAdminPass) {
      throw { code: 'auth/wrong-password', message: 'Super Admin পাসওয়ার্ড সঠিক নয়।' };
    }
    
    user = {
      id: Math.random().toString(36).substr(2, 9),
      uid: Math.random().toString(36).substr(2, 9),
      email,
      password,
      role: email === superAdminEmail ? 'super_admin' : 'admin',
      displayName: email.split('@')[0],
      emailVerified: true,
      providerData: [],
      createdAt: new Date().toISOString()
    };
    user.uid = user.id; // ensure they are same
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Trigger snapshot for collection('users')
    window.dispatchEvent(new CustomEvent('storage-users'));
    window.dispatchEvent(new CustomEvent(`storage-users-${user.id}`));
  }

  const authUser = { ...user };
  delete authUser.password;
  
  localStorage.setItem('auth_user', JSON.stringify(authUser));
  window.dispatchEvent(new Event('auth_change'));
  return { user: authUser };
};

export const signInWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  return loginWithEmail(email, password);
};

export const createUserWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  return loginWithEmail(email, password);
};

export const updateEmail = async (user: any, newEmail: string) => {
  const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (authUser.email === 'cmrabbi@gmail.com') {
    throw new Error('Super Admin ইমেইল পরিবর্তন করা সম্ভব নয়।');
  }
  authUser.email = newEmail;
  localStorage.setItem('auth_user', JSON.stringify(authUser));
  
  // Update in user list too
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const uIndex = users.findIndex((u: any) => u.uid === authUser.uid);
  if (uIndex !== -1) {
    users[uIndex].email = newEmail;
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  window.dispatchEvent(new Event('auth_change'));
};

export const updatePassword = async (user: any, newPass: string) => {
  const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (authUser.email === 'cmrabbi@gmail.com') {
    throw new Error('Super Admin পাসওয়ার্ড পরিবর্তন করা সম্ভব নয়।');
  }
  
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const uIndex = users.findIndex((u: any) => u.uid === authUser.uid);
  if (uIndex !== -1) {
    users[uIndex].password = newPass;
    localStorage.setItem('users', JSON.stringify(users));
  }
  console.log("Mock Auth: Password updated in storage");
};

export const signOut = async (auth?: any) => {
  localStorage.removeItem('auth_user');
  window.dispatchEvent(new Event('auth_change'));
};

export const logout = signOut;

export const onAuthStateChanged = (authOrCb: any, cb?: any) => auth.onAuthStateChanged(authOrCb, cb);

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  providerData: any[];
};

// Mock DB
export const db = {};
export const storage = {};

export * from './lib/storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const getAuth = (app?: any) => auth;
export const initializeApp = (config: any, options?: any) => {
  const name = (typeof options === 'string' ? options : options?.name) || '[default]';
  return { name, config };
};
export const getApp = (name?: string) => ({ name });
export const getApps = () => [{ name: '[default]' }];

// Initialize some data if empty
if (!localStorage.getItem('app_settings')) {
  localStorage.setItem('app_settings', JSON.stringify([
    { id: 'config', companyName: 'T S Marketing', companyAddress: 'Kalkini, Madaripur' },
    { id: 'loading_screen', loadingTitle: 'T S Marketing', loadingSubtitle: 'Halal income, for a better future' }
  ]));
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Storage Error: ', error);
}
