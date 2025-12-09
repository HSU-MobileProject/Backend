const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

exports.onLikeChange = functions.firestore
    .document("userLikes/{userId}/projects/{projectId}")
    .onWrite(async (change, context) => {
        const projectId = context.params.projectId;
        const projectRef = admin.firestore().collection("projects").doc(projectId);

        // 즐겨찾기 추가됨 (Create)
        if (!change.before.exists && change.after.exists) {
            return projectRef.update({
                likes: admin.firestore.FieldValue.increment(1)
            });
        }
        // 즐겨찾기 취소됨 (Delete)
        else if (change.before.exists && !change.after.exists) {
            return projectRef.update({
                likes: admin.firestore.FieldValue.increment(-1)
            });
        }
        return null;
    });