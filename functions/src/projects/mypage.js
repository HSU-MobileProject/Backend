const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");


// 내가 등록한 프로젝트 + 구매한 프로젝트 조회

exports.myProjects = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // 내가 등록한 프로젝트
    const createdSnap = await db.collection("projects")
        .where("ownerUid", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

    const created = createdSnap.docs.map(doc => ({
        id: doc.id,
        type: "created",
        ...doc.data(),
    }));

    // 내가 구매한 프로젝트
    const purchasedSnap = await db.collection("purchases")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

    let purchased = [];
    for (const doc of purchasedSnap.docs) {
        const pd = doc.data();
        const projectDoc = await db.collection("projects").doc(pd.projectId).get();
        if (projectDoc.exists) {
            purchased.push({
                id: projectDoc.id,
                type: "purchased",
                ...projectDoc.data(),
            });
        }
    }

    return {
        success: true,
        myProjects: [...created, ...purchased]
    };
});
