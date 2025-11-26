// functions/src/projects/search.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * 프로젝트 검색 (제목, 설명, 기술스택)
 */
exports.searchProjects = functions.https.onCall(async (data, context) => {
    const { keyword } = data || {};

    if (!keyword || typeof keyword !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'keyword가 필요합니다.'
        );
    }

    const projectsRef = admin.firestore().collection('projects');

    const snapshot = await projectsRef
        .where('keywords', 'array-contains', keyword.toLowerCase())
        .get();

    const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return { success: true, projects };
});


/**
 * 카테고리별 프로젝트 필터
 */
exports.filterByCategory = functions.https.onCall(async (data, context) => {
    const { category } = data || {};

    if (!category) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'category가 필요합니다.'
        );
    }

    const snapshot = await admin.firestore()
        .collection('projects')
        .where('category', '==', category)
        .orderBy('createdAt', 'desc')
        .get();

    const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return { success: true, projects };
});
