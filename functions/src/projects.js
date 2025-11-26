const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 프로젝트가 생성/수정될 때 검색용 키워드 생성
exports.generateKeywords = functions.firestore
    .document("projects/{projectId}")
    .onWrite(async (change, context) => {
        // 데이터가 삭제된 경우 무시
        if (!change.after.exists) return null;

        const data = change.after.data();
        const title = data.title || "";

        // 제목이 변경되지 않았다면 무시 (무한 루프 방지)
        if (change.before.exists && change.before.data().title === title) {
            return null;
        }

        // 1. 띄어쓰기 단위로 쪼개기 (간단한 검색용)
        // 예: "스마트 블록 조립" -> ["스마트", "블록", "조립"]
        const keywords = title.split(" ").filter(k => k.length > 0);

        // 2. 원본 데이터에 keywords 필드 추가 업데이트
        return change.after.ref.update({
            keywords: keywords
        });
    });