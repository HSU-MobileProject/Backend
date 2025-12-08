const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");


 // 내가 등록한 프로젝트 + 내가 구매한 프로젝트 조회

exports.myProjects = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // 내가 등록한 프로젝트
    const createdSnap = await db
        .collection("projects")
        .where("ownerUid", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

    const created = createdSnap.docs.map((doc) => ({
        id: doc.id,
        type: "created",
        ...doc.data(),
    }));

    // 내가 구매한 프로젝트
    const purchasedSnap = await db
        .collection("purchases")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

    const purchased = [];
    for (const doc of purchasedSnap.docs) {
        const purchaseData = doc.data();
        const projectDoc = await db.collection("projects").doc(purchaseData.projectId).get();

        if (projectDoc.exists) {
            purchased.push({
                id: projectDoc.id,
                type: "purchased",
                ...projectDoc.data(),
                purchase: {
                    amount: purchaseData.amount,
                    createdAt: purchaseData.createdAt,
                    paymentId: purchaseData.paymentId,
                },
            });
        }
    }

    return {
        success: true,
        created,
        purchased,
    };
});


 // 거래내역 요약 + 상세
exports.getMyTransactionStats = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // 내가 구매한 내역
    const purchaseSnap = await db
        .collection("purchases")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

    let purchaseTotal = 0;
    const purchaseHistory = [];

    for (const doc of purchaseSnap.docs) {
        const p = doc.data();
        purchaseTotal += p.amount || 0;

        const projectDoc = await db.collection("projects").doc(p.projectId).get();
        const projectData = projectDoc.exists ? projectDoc.data() : {};

        purchaseHistory.push({
            id: doc.id,
            projectId: p.projectId,
            projectTitle: projectData.title || "",
            amount: p.amount,
            createdAt: p.createdAt,
        });
    }

    // 내가 판매한 내역
    const salesSnap = await db
        .collection("purchases")
        .where("sellerUid", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

    let salesTotal = 0;
    const salesHistory = [];

    for (const doc of salesSnap.docs) {
        const p = doc.data();
        salesTotal += p.amount || 0;

        const projectDoc = await db.collection("projects").doc(p.projectId).get();
        const projectData = projectDoc.exists ? projectDoc.data() : {};

        salesHistory.push({
            id: doc.id,
            projectId: p.projectId,
            projectTitle: projectData.title || "",
            amount: p.amount,
            createdAt: p.createdAt,
            buyerUid: p.userId,
        });
    }

    const totalAmount = purchaseTotal + salesTotal;

    return {
        success: true,
        summary: {
            totalAmount,      // 총 거래액
            purchaseTotal,    // 구매 총액
            salesTotal,       // 판매 총액
        },
        purchaseHistory,
        salesHistory,
    };
});


 // 마이페이지 프로필 조회
exports.getMyProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
        const defaultProfile = {
            email: context.auth.token.email || null,
            nickname: context.auth.token.name || "익명",
            photoURL: context.auth.token.picture || null,
            userType: "personal",
            point: 0,
        };
        await db.collection("users").doc(uid).set(defaultProfile);
        return { success: true, profile: { uid, ...defaultProfile } };
    }

    return { success: true, profile: { uid, ...doc.data() } };
});


 // 마이페이지 프로필 수정
exports.updateMyProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    const {
        nickname,
        bio,
        githubUrl,
        companyName,
        companyHomepage,
        photoURL,
        userType,
    } = data || {};

    const updateData = {};

    if (nickname !== undefined) updateData.nickname = nickname;
    if (bio !== undefined) updateData.bio = bio;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyHomepage !== undefined) updateData.companyHomepage = companyHomepage;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    if (userType !== undefined) {
        if (userType === "personal" || userType === "corporate") {
            updateData.userType = userType;
        } else {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "userType은 'personal' 또는 'corporate'만 가능합니다."
            );
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "수정할 필드가 없습니다."
        );
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("users").doc(uid).set(updateData, { merge: true });

    return { success: true };
});

