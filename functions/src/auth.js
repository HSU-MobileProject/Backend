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
exports.deleteProfile = functions.auth.user().onDelete((user) => {
    return admin.firestore().collection("users").doc(user.uid).delete();
});