const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.onLikeChange = functions.firestore
    .document("userLikes/{userId}/projects/{projectId}")
    .onWrite(async (change, context) => {
        const projectId = context.params.projectId;
        const projectRef = admin.firestore().collection("projects").doc(projectId);

        // 좋아요 추가됨 (Create)
        if (!change.before.exists && change.after.exists) {
            return projectRef.update({
                likes: admin.firestore.FieldValue.increment(1)
            });
        }
        // 좋아요 취소됨 (Delete)
        else if (change.before.exists && !change.after.exists) {
            return projectRef.update({
                likes: admin.firestore.FieldValue.increment(-1)
            });
        }
        return null;
    });