// functions/src/projects/crud.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

/**
 * 프로젝트 등록
 */
exports.createProject = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const {
        title,
        description,
        techStack,
        category,
        thumbnail,
        price,
    } = data;

    if (!title || !description) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "title과 description은 필수 입력 값입니다."
        );
    }

    const project = {
        title,
        description,
        techStack: Array.isArray(techStack) ? techStack : [],
        category: category || null,
        thumbnail: thumbnail || null,
        price: typeof price === "number" ? price : 0,
        ownerUid: uid,
        favoritesCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection("projects").add(project);
    return { success: true, projectId: docRef.id };
});


/**
 * 프로젝트 목록 조회
 */
exports.listProjects = functions.https.onCall(async (data, context) => {
    const limit = data?.limit && data.limit > 0 && data.limit <= 50 ? data.limit : 20;

    const snapshot = await admin.firestore()
        .collection("projects")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return { success: true, projects };
});


/**
 * 프로젝트 상세 조회
 */
exports.getProject = functions.https.onCall(async (data, context) => {
    const { projectId } = data || {};

    if (!projectId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "projectId가 필요합니다."
        );
    }

    const doc = await admin.firestore().collection("projects").doc(projectId).get();

    if (!doc.exists) {
        throw new functions.https.HttpsError(
            "not-found",
            "해당 프로젝트를 찾을 수 없습니다."
        );
    }

    return { success: true, projectId: doc.id, project: doc.data() };
});


/**
 * 프로젝트 수정 (작성자만 가능)
 */
exports.updateProject = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const { projectId, update } = data || {};

    if (!projectId || !update) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "projectId 및 update 객체가 필요합니다."
        );
    }

    const docRef = admin.firestore().collection("projects").doc(projectId);
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new functions.https.HttpsError(
            "not-found",
            "해당 프로젝트를 찾을 수 없습니다."
        );
    }

    const project = doc.data();

    if (project.ownerUid !== uid) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "본인이 등록한 프로젝트만 수정할 수 있습니다."
        );
    }

    const allowedFields = ["title", "description", "techStack", "category", "thumbnail", "price"];
    const updateData = {};

    allowedFields.forEach(key => {
        if (update[key] !== undefined) {
            updateData[key] = update[key];
        }
    });

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await docRef.update(updateData);
    return { success: true };
});


/**
 * 프로젝트 삭제 (작성자만 가능)
 */
exports.deleteProject = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const { projectId } = data || {};

    if (!projectId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "projectId가 필요합니다."
        );
    }

    const docRef = admin.firestore().collection("projects").doc(projectId);
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new functions.https.HttpsError(
            "not-found",
            "해당 프로젝트를 찾을 수 없습니다."
        );
    }

    const project = doc.data();

    if (project.ownerUid !== uid) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "본인이 등록한 프로젝트만 삭제할 수 있습니다."
        );
    }

    await docRef.delete();
    return { success: true };
});
