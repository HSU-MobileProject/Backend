const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 회원가입(Auth 생성) 시 Firestore에 유저 문서 자동 생성
exports.createProfile = functions.auth.user().onCreate((user) => {
    return admin.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        nickname: user.displayName || "익명",
        photoURL: user.photoURL || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userType: "personal", // 기본값
        point: 0 // 포인트 등 초기화
    });
});

// 회원탈퇴 시 Firestore 데이터도 삭제 (선택)
// 회원탈퇴 시 관련 데이터 정리
exports.deleteProfile = functions.auth.user().onDelete(async (user) => {
    const db = admin.firestore();
    const batch = db.batch();

    // 유저 정보 삭제
    const userRef = db.collection("users").doc(user.uid);
    batch.delete(userRef);
    /*
        // 이 사람이 올린 프로젝트를 '삭제'하거나 '알수없음' 처리 - 이 부분은 후에 논의
        const projectsSnapshot = await db.collection("projects").where("writerUid", "==", user.uid).get();
        projectsSnapshot.forEach(doc => {
            batch.delete(doc.ref); // 프로젝트 삭제 (또는 status를 'deleted'로 변경)
        });
    */
    // 알림 내역 삭제
    const notiSnapshot = await db.collection("notifications").where("userId", "==", user.uid).get();
    notiSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 일괄 처리 실행
    return batch.commit();
});