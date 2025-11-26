// functions/src/projects/favorites.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * 즐겨찾기 추가
 */
exports.addFavorite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const uid = context.auth.uid;
    const { projectId } = data;

    if (!projectId) {
        throw new functions.https.HttpsError('invalid-argument', 'projectId가 필요합니다.');
    }

    const favRef = admin.firestore()
        .collection('users')
        .doc(uid)
        .collection('favorites')
        .doc(projectId);

    await favRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });

    // 프로젝트의 favoritesCount 증가
    const projectRef = admin.firestore().collection('projects').doc(projectId);
    await projectRef.update({
        favoritesCount: admin.firestore.FieldValue.increment(1),
    });

    return { success: true };
});


/**
 * 즐겨찾기 제거
 */
exports.removeFavorite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const uid = context.auth.uid;
    const { projectId } = data;

    if (!projectId) {
        throw new functions.https.HttpsError('invalid-argument', 'projectId가 필요합니다.');
    }

    const favRef = admin.firestore()
        .collection('users')
        .doc(uid)
        .collection('favorites')
        .doc(projectId);

    await favRef.delete();

    // 프로젝트의 favoritesCount 감소
    const projectRef = admin.firestore().collection('projects').doc(projectId);
    await projectRef.update({
        favoritesCount: admin.firestore.FieldValue.increment(-1),
    });

    return { success: true };
});


/**
 * 즐겨찾기한 프로젝트 목록 조회
 */
exports.listFavorites = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const uid = context.auth.uid;

    const snapshot = await admin.firestore()
        .collection('users')
        .doc(uid)
        .collection('favorites')
        .orderBy('createdAt', 'desc')
        .get();

    const favoriteProjectIds = snapshot.docs.map(doc => doc.id);

    if (favoriteProjectIds.length === 0) {
        return { success: true, favorites: [] };
    }

    const projectDocs = await admin.firestore()
        .collection('projects')
        .where(admin.firestore.FieldPath.documentId(), 'in', favoriteProjectIds)
        .get();

    const favorites = projectDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return { success: true, favorites };
});
