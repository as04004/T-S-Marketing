
// Simple LocalStorage based DB to replace Firestore
const storage = {
  get: (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  set: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const collection = (db: any, path: string) => path;

export const doc = (...args: any[]) => {
  let path = '';
  let id = '';

  if (args.length === 1) {
    // doc(collectionRef)
    path = args[0];
    id = Math.random().toString(36).substr(2, 9);
  } else if (args.length === 2) {
    // doc(db, path) or doc(collectionRef, id)
    if (typeof args[0] === 'string' && typeof args[1] === 'string') {
      path = args[0];
      id = args[1];
    } else {
      path = args[1];
      id = Math.random().toString(36).substr(2, 9);
    }
  } else {
    // doc(db, path, id)
    path = args[1];
    id = args[2];
  }

  return `${path}/${id}`;
};

export const query = (colRef: string, ...constraints: any[]) => {
  return { path: colRef, constraints };
};

export const where = (field: string, op: string, value: any) => {
  return { type: 'where', field, op, value };
};

export const orderBy = (field: string, direction: string = 'asc') => {
  return { type: 'orderBy', field, direction };
};

export const limit = (n: number) => {
  return { type: 'limit', n };
};

export const getDocs = async (q: any) => {
  const path = typeof q === 'string' ? q : q.path;
  let data = storage.get(path);
  
  if (q.constraints) {
    q.constraints.forEach((c: any) => {
      if (c.type === 'where') {
        data = data.filter((item: any) => {
          if (c.op === '==') return item[c.field] === c.value;
          if (c.op === '>=') return item[c.field] >= c.value;
          if (c.op === '<=') return item[c.field] <= c.value;
          if (c.op === '!=') return item[c.field] !== c.value;
          if (c.op === 'in') return Array.isArray(c.value) && c.value.includes(item[c.field]);
          return true;
        });
      }
      if (c.type === 'orderBy') {
        data.sort((a: any, b: any) => {
          if (a[c.field] < b[c.field]) return c.direction === 'asc' ? -1 : 1;
          if (a[c.field] > b[c.field]) return c.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      if (c.type === 'limit') {
        data = data.slice(0, c.n);
      }
    });
  }

  const docs = data.map((d: any) => ({
    id: d.id,
    data: () => d,
    ref: { id: d.id, path: `${path}/${d.id}` }
  }));

  return {
    empty: docs.length === 0,
    docs: docs,
    forEach: (cb: (doc: any) => void) => docs.forEach(cb),
    size: docs.length
  };
};

export const getDoc = async (docRef: string) => {
  const [path, id] = docRef.split('/');
  const data = storage.get(path);
  const item = data.find((i: any) => i.id === id);
  return {
    exists: () => !!item,
    data: () => item,
    id: id
  };
};

export const addDoc = async (colRef: string, data: any) => {
  const all = storage.get(colRef);
  const newDoc = { ...data, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
  all.push(newDoc);
  storage.set(colRef, all);
  
  // Trigger listeners
  window.dispatchEvent(new CustomEvent(`storage-${colRef}`));
  return { id: newDoc.id };
};

export const setDoc = async (docRef: string, data: any) => {
  const [path, id] = docRef.split('/');
  const all = storage.get(path);
  const index = all.findIndex((i: any) => i.id === id);
  const newDoc = { ...data, id };
  if (index >= 0) all[index] = newDoc;
  else all.push(newDoc);
  storage.set(path, all);
  
  // Trigger listeners
  window.dispatchEvent(new CustomEvent(`storage-${path}`));
  window.dispatchEvent(new CustomEvent(`storage-${path}-${id}`));
};

export const deleteDoc = async (docRef: string) => {
  const [path, id] = docRef.split('/');
  const all = storage.get(path);
  const filtered = all.filter((i: any) => i.id !== id);
  storage.set(path, filtered);
  
  // Trigger listeners
  window.dispatchEvent(new CustomEvent(`storage-${path}`));
};

export const onSnapshot = (q: any, ...args: any[]) => {
  // Handle (q, callback) or (q, options, callback) or (q, callback, error)
  let callback: any;
  let onError: any;

  if (typeof args[0] === 'function') {
    callback = args[0];
    onError = args[1];
  } else if (typeof args[1] === 'function') {
    callback = args[1];
    onError = args[2];
  }

  if (typeof callback !== 'function') {
    console.warn("onSnapshot: No callback function provided", q, args);
    return () => {};
  }

  const path = typeof q === 'string' ? q.split('/')[0] : (q.path || q);
  const id = typeof q === 'string' ? (q.split('/')[1] || null) : null;

  const update = async () => {
    if (id) {
      const snap = await getDoc(q);
      callback(snap);
    } else {
      const snap = await getDocs(q);
      callback(snap);
    }
  };

  const eventName = id ? `storage-${path}-${id}` : `storage-${path}`;
  window.addEventListener(eventName, update);
  window.addEventListener(`storage-${path}`, update); // Listen to collection changes too

  update();

  return () => {
    window.removeEventListener(eventName, update);
    window.removeEventListener(`storage-${path}`, update);
  };
};

export const writeBatch = (db: any) => {
  const operations: any[] = [];
  const batch = {
    delete: (docRef: any) => { operations.push({ type: 'delete', docRef: typeof docRef === 'string' ? docRef : (docRef.id || docRef) }); return batch; },
    set: (docRef: any, data: any) => { operations.push({ type: 'set', docRef: typeof docRef === 'string' ? docRef : (docRef.id || docRef), data }); return batch; },
    update: (docRef: any, data: any) => { operations.push({ type: 'update', docRef: typeof docRef === 'string' ? docRef : (docRef.id || docRef), data }); return batch; },
    commit: async () => {
      for (const op of operations) {
        if (op.type === 'delete') await deleteDoc(op.docRef);
        if (op.type === 'set') await setDoc(op.docRef, op.data);
        if (op.type === 'update') await updateDoc(op.docRef, op.data);
      }
    }
  };
  return batch;
};

export const updateDoc = async (docRef: string, data: any) => {
  const [path, id] = docRef.split('/');
  const all = storage.get(path);
  const index = all.findIndex((i: any) => i.id === id);
  if (index >= 0) {
    // Handle increments manually if needed, but for now simple merge
    const current = all[index];
    const update = { ...current, ...data };
    
    // Process increments and other special types
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'object' && data[key].type === 'increment') {
        update[key] = (current[key] || 0) + data[key].value;
      }
    });
    
    all[index] = update;
    storage.set(path, all);
    
    // Trigger listeners
    window.dispatchEvent(new CustomEvent(`storage-${path}`));
    window.dispatchEvent(new CustomEvent(`storage-${path}-${id}`));
  }
};

export const serverTimestamp = () => new Date().toISOString();
export const increment = (n: number) => ({ type: 'increment', value: n });
export const deleteField = () => undefined;
