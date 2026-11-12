
import { firebaseConfig } from './firebase-config.js';

// No persistent Firestore disk cache: private ledger snapshots remain in memory only.
export async function connectFirebase() {
    const base = 'https://www.gstatic.com/firebasejs/11.10.0/';

    const [app, auth, fs] = await Promise.all([
        import(base + 'firebase-app.js'),
        import(base + 'firebase-auth.js'),
        import(base + 'firebase-firestore.js')
    ]);

    const instance = app.initializeApp(firebaseConfig);
    const a = auth.getAuth(instance);
    const db = fs.getFirestore(instance);

    // Keep users signed in across browser restarts.
    await auth.setPersistence(a, auth.browserLocalPersistence);

    return {
        auth: a,
        authSDK: auth,
        fs,
        db,

        async action(action, input, user, groupId, operationId) {
            const token = await user.getIdToken();

            const response = await fetch('/api/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({
                    action,
                    input,
                    groupId,
                    operationId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed.');
            }

            return data;
        },

        watchGroups(uid, next, error) {
            return fs.onSnapshot(
                fs.query(
                    fs.collection(db, 'groups'),
                    fs.where('memberIds', 'array-contains', uid),
                    fs.orderBy('updatedAt', 'desc'),
                    fs.limit(100)
                ),
                s => next(s.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }))),
                error
            );
        },

        watchRecords(gid, type, size, next, error) {
            return fs.onSnapshot(
                fs.query(
                    fs.collection(db, 'groups', gid, type),
                    fs.orderBy('createdAt', 'desc'),
                    fs.limit(size)
                ),
                s => next(s.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }))),
                error
            );
        },

        async page(gid, type, last) {
            const q = fs.query(
                fs.collection(db, 'groups', gid, type),
                fs.orderBy('createdAt', 'desc'),
                fs.orderBy(fs.documentId(), 'desc'),
                fs.startAfter(last.createdAt, last.id),
                fs.limit(50)
            );

            return (await fs.getDocs(q)).docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
        },

        watchPending(gid, next, error) {
            return fs.onSnapshot(
                fs.query(
                    fs.collection(db, 'groups', gid, 'settlements'),
                    fs.where('status', '==', 'pending')
                ),
                s => next(s.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }))),
                error
            );
        }
    };
}
